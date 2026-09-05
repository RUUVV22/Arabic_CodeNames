const assert = require('node:assert/strict');
const { after, afterEach, before, test } = require('node:test');
const { io: createClient } = require('socket.io-client');
const { createGameServer } = require('../src/createServer');
const { createBoard } = require('../src/game/gameEngine');
const { TEAM, ROLE, CARD, STATUS, RESULT_REASON } = require('../src/game/constants');

let server;
let baseUrl;
let openSockets = [];

before(async () => {
  server = createGameServer({
    roomManager: { reconnectWindowMs: 5_000 },
  });
  const address = await server.start(0, '127.0.0.1');
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterEach(async () => {
  openSockets.forEach((socket) => socket.disconnect());
  openSockets = [];
  await new Promise((resolve) => setTimeout(resolve, 10));
  server.roomManager.clear();
});

after(async () => {
  await server.stop();
});

function connectClient() {
  return new Promise((resolve, reject) => {
    const socket = createClient(baseUrl, {
      transports: ['websocket'],
      forceNew: true,
      reconnection: false,
    });
    openSockets.push(socket);
    socket.once('connect', () => resolve(socket));
    socket.once('connect_error', reject);
  });
}

function emitAck(socket, event, payload = {}) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${event}`)), 2_000);
    socket.emit(event, payload, (response) => {
      clearTimeout(timer);
      resolve(response);
    });
  });
}

function unusedArabicClue(board, stem) {
  let clue = stem;
  while (board.some((card) => card.word === clue)) {
    clue += 'ا';
  }
  return clue;
}

async function waitUntil(predicate, timeoutMs = 1_000) {
  const startedAt = Date.now();
  while (!predicate()) {
    if (Date.now() - startedAt > timeoutMs) throw new Error('Condition was not reached in time');
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

async function createFourPlayerRoom() {
  const sockets = await Promise.all([connectClient(), connectClient(), connectClient(), connectClient()]);
  const sessions = [];
  sessions.push(await emitAck(sockets[0], 'room:create', { name: 'أحمد' }));
  const roomCode = sessions[0].roomCode;
  sessions.push(await emitAck(sockets[1], 'room:join', { roomCode, name: 'سارة' }));
  sessions.push(await emitAck(sockets[2], 'room:join', { roomCode, name: 'ليان' }));
  sessions.push(await emitAck(sockets[3], 'room:join', { roomCode, name: 'خالد' }));
  return { sockets, sessions, roomCode, room: server.roomManager.rooms.get(roomCode) };
}

function socketFor(room, sockets, team, role) {
  const player = room.players.find((candidate) => candidate.team === team && candidate.role === role);
  const index = room.players.indexOf(player);
  return { socket: sockets[index], player };
}

test('board generation produces 25 unique words and the classic 9/8/7/1 distribution', () => {
  const board = createBoard(() => 0.314159);
  assert.equal(board.cards.length, 25);
  assert.equal(new Set(board.cards.map((card) => card.word)).size, 25);
  assert.equal(board.cards.filter((card) => card.type === board.startingTeam).length, 9);
  assert.equal(board.cards.filter((card) => card.type === CARD.NEUTRAL).length, 7);
  assert.equal(board.cards.filter((card) => card.type === CARD.ASSASSIN).length, 1);
});

test('create/join validates room codes, duplicate names, and Arabic errors', async () => {
  const host = await connectClient();
  const guest = await connectClient();
  const created = await emitAck(host, 'room:create', { name: 'نور' });
  assert.equal(created.ok, true);
  assert.match(created.roomCode, /^[A-Z2-9]{5}$/);

  const duplicate = await emitAck(guest, 'room:join', { roomCode: created.roomCode, name: 'نور' });
  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.code, 'DUPLICATE_NAME');
  assert.match(duplicate.message, /الاسم/);

  const missing = await emitAck(guest, 'room:join', { roomCode: 'ZZZZZ', name: 'ضيف' });
  assert.equal(missing.ok, false);
  assert.equal(missing.code, 'ROOM_NOT_FOUND');

  const joined = await emitAck(guest, 'room:join', { roomCode: created.roomCode, name: 'ضيف' });
  assert.equal(joined.ok, true);
  assert.equal(joined.state.players.length, 2);

  const left = await emitAck(guest, 'room:leave');
  assert.equal(left.ok, true);
  assert.equal(server.roomManager.rooms.get(created.roomCode).players.length, 1);
});

test('lobby auto-assigns both teams, enforces host controls, and blocks an unready game', async () => {
  const host = await connectClient();
  const guest = await connectClient();
  const created = await emitAck(host, 'room:create', { name: 'المضيف' });
  const joined = await emitAck(guest, 'room:join', { roomCode: created.roomCode, name: 'الضيف' });

  const earlyStart = await emitAck(host, 'game:start');
  assert.equal(earlyStart.code, 'NOT_READY');
  const unauthorized = await emitAck(guest, 'lobby:update-player', {
    playerId: created.playerId,
    team: TEAM.BLUE,
    role: ROLE.AGENT,
  });
  assert.equal(unauthorized.code, 'NOT_HOST');

  const { room } = server.roomManager.rooms.get(created.roomCode)
    ? { room: server.roomManager.rooms.get(created.roomCode) }
    : {};
  assert.equal(room.players[0].team, TEAM.RED);
  assert.equal(room.players[1].team, TEAM.BLUE);
  assert.equal(joined.state.players[1].role, ROLE.SPYMASTER);
});

test('starting a game sends hidden identities only to spymasters and blocks late joins', async () => {
  const { sockets, sessions, roomCode, room } = await createFourPlayerRoom();
  const started = await emitAck(sockets[0], 'game:start');
  assert.equal(started.ok, true);
  assert.equal(room.status, STATUS.ACTIVE);
  assert.equal(room.board.length, 25);

  const redSpymaster = room.players.find((player) => player.team === TEAM.RED && player.role === ROLE.SPYMASTER);
  const redAgent = room.players.find((player) => player.team === TEAM.RED && player.role === ROLE.AGENT);
  const spyView = server.roomManager.serializeFor(roomCode, redSpymaster.id);
  const agentView = server.roomManager.serializeFor(roomCode, redAgent.id);
  assert.ok(spyView.board.every((card) => card.type));
  assert.ok(agentView.board.every((card) => card.type === null));

  const lateSocket = await connectClient();
  const lateJoin = await emitAck(lateSocket, 'room:join', { roomCode, name: 'متأخر' });
  assert.equal(lateJoin.code, 'ROOM_STARTED');
  assert.equal(sessions.every((session) => session.ok), true);
});

test('server validates clue giver, clue text, agent selection, correct/opponent/neutral turn rules', async () => {
  const { sockets, room } = await createFourPlayerRoom();
  await emitAck(sockets[0], 'game:start');
  const team = room.currentTeam;
  const { socket: spySocket } = socketFor(room, sockets, team, ROLE.SPYMASTER);
  const { socket: agentSocket, player: agent } = socketFor(room, sockets, team, ROLE.AGENT);
  const otherTeam = team === TEAM.RED ? TEAM.BLUE : TEAM.RED;
  const { socket: wrongSpy } = socketFor(room, sockets, otherTeam, ROLE.SPYMASTER);
  const firstClue = unusedArabicClue(room.board, 'فضاء');
  const secondClue = unusedArabicClue(room.board, 'فكرة');

  assert.equal((await emitAck(wrongSpy, 'game:give-clue', { word: 'فضاء', count: 2 })).code, 'NOT_YOUR_TURN');
  assert.equal((await emitAck(agentSocket, 'game:give-clue', { word: 'فضاء', count: 2 })).code, 'SPYMASTER_ONLY');
  assert.equal((await emitAck(spySocket, 'game:give-clue', { word: room.board[0].word, count: 2 })).code, 'CLUE_MATCHES_CARD');
  assert.equal((await emitAck(spySocket, 'game:give-clue', { word: 'space', count: 2 })).code, 'INVALID_CLUE');
  assert.equal((await emitAck(spySocket, 'game:give-clue', { word: firstClue, count: 2 })).ok, true);
  assert.equal((await emitAck(spySocket, 'game:select-card', { cardId: room.board[0].id })).code, 'AGENT_ONLY');

  const correct = room.board.find((card) => card.type === team);
  assert.equal((await emitAck(agentSocket, 'game:select-card', { cardId: correct.id })).revealedType, team);
  const agentView = server.roomManager.serializeFor(room.roomId, agent.id);
  assert.equal(agentView.board.find((card) => card.id === correct.id).type, team);

  const opponent = room.board.find((card) => card.type === otherTeam && !card.revealed);
  assert.equal((await emitAck(agentSocket, 'game:select-card', { cardId: opponent.id })).turnEnded, true);
  assert.equal(room.currentTeam, otherTeam);

  const nextSpy = socketFor(room, sockets, otherTeam, ROLE.SPYMASTER).socket;
  const nextAgent = socketFor(room, sockets, otherTeam, ROLE.AGENT).socket;
  assert.equal((await emitAck(nextSpy, 'game:give-clue', { word: secondClue, count: 1 })).ok, true);
  const neutral = room.board.find((card) => card.type === CARD.NEUTRAL && !card.revealed);
  assert.equal((await emitAck(nextAgent, 'game:select-card', { cardId: neutral.id })).turnEnded, true);
  assert.equal(room.currentTeam, team);
});

test('assassin ends the game immediately, host can replay, and all team words produce a win', async () => {
  const { sockets, room } = await createFourPlayerRoom();
  await emitAck(sockets[0], 'game:start');
  const firstTeam = room.currentTeam;
  const firstSpy = socketFor(room, sockets, firstTeam, ROLE.SPYMASTER).socket;
  const firstAgent = socketFor(room, sockets, firstTeam, ROLE.AGENT).socket;
  await emitAck(firstSpy, 'game:give-clue', { word: 'مجهول', count: 1 });
  const assassin = room.board.find((card) => card.type === CARD.ASSASSIN);
  await emitAck(firstAgent, 'game:select-card', { cardId: assassin.id });
  assert.equal(room.status, STATUS.FINISHED);
  assert.equal(room.resultReason, RESULT_REASON.ASSASSIN);
  assert.equal(room.winner, firstTeam === TEAM.RED ? TEAM.BLUE : TEAM.RED);

  assert.equal((await emitAck(sockets[0], 'game:restart')).ok, true);
  assert.equal(room.status, STATUS.ACTIVE);
  assert.equal(room.round, 2);

  room.currentTeam = TEAM.RED;
  room.clue = null;
  const redSpy = socketFor(room, sockets, TEAM.RED, ROLE.SPYMASTER).socket;
  const redAgent = socketFor(room, sockets, TEAM.RED, ROLE.AGENT).socket;
  await emitAck(redSpy, 'game:give-clue', { word: 'مجموعة', count: 9 });
  const redCards = room.board.filter((card) => card.type === TEAM.RED);
  for (const card of redCards) {
    const response = await emitAck(redAgent, 'game:select-card', { cardId: card.id });
    assert.equal(response.ok, true);
  }
  assert.equal(room.status, STATUS.FINISHED);
  assert.equal(room.winner, TEAM.RED);
  assert.equal(room.resultReason, RESULT_REASON.ALL_WORDS);

  assert.equal((await emitAck(sockets[0], 'game:return-lobby')).ok, true);
  assert.equal(room.status, STATUS.LOBBY);
  assert.equal(room.board.length, 0);
});

test('disconnect marks a player offline, session token reconnects, and host handoff works', async () => {
  const { sockets, sessions, roomCode, room } = await createFourPlayerRoom();
  const reconnectingSession = sessions[2];
  sockets[2].disconnect();
  await waitUntil(() => room.players.find((player) => player.id === reconnectingSession.playerId)?.connected === false);

  const replacement = await connectClient();
  const restored = await emitAck(replacement, 'room:reconnect', {
    roomCode,
    sessionToken: reconnectingSession.sessionToken,
  });
  assert.equal(restored.ok, true);
  assert.equal(restored.playerId, reconnectingSession.playerId);
  assert.equal(room.players.length, 4);

  const oldHostId = room.hostId;
  sockets[0].disconnect();
  await waitUntil(() => room.hostId !== oldHostId);
  const newHost = room.players.find((player) => player.id === room.hostId);
  assert.ok(newHost.connected);
  assert.equal(newHost.isHost, true);
});
