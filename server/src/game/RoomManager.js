const crypto = require('node:crypto');
const { createBoard, normalizeArabic } = require('./gameEngine');
const {
  TEAM,
  ROLE,
  CARD,
  STATUS,
  RESULT_REASON,
  MIN_PLAYERS,
  MAX_PLAYERS,
} = require('./constants');
const { GameError } = require('./errors');

const ROOM_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

class RoomManager {
  constructor({ random = Math.random, reconnectWindowMs = 120_000, onAsyncChange = () => {} } = {}) {
    this.rooms = new Map();
    this.socketIndex = new Map();
    this.disconnectTimers = new Map();
    this.random = random;
    this.reconnectWindowMs = reconnectWindowMs;
    this.onAsyncChange = onAsyncChange;
  }

  createRoom({ name, socketId }) {
    const cleanName = this.validateName(name);
    const roomCode = this.generateRoomCode();
    const player = this.createPlayer({
      name: cleanName,
      socketId,
      team: TEAM.RED,
      role: ROLE.SPYMASTER,
      isHost: true,
    });

    const room = {
      roomId: roomCode,
      status: STATUS.LOBBY,
      hostId: player.id,
      players: [player],
      board: [],
      currentTeam: null,
      startingTeam: null,
      clue: null,
      guessesRemaining: 0,
      remainingCards: { [TEAM.RED]: 0, [TEAM.BLUE]: 0 },
      winner: null,
      resultReason: null,
      round: 0,
      stateVersion: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.rooms.set(roomCode, room);
    this.indexSocket(socketId, roomCode, player.id);
    return this.sessionResult(room, player);
  }

  joinRoom({ roomCode, name, socketId }) {
    const room = this.requireRoom(roomCode);
    const cleanName = this.validateName(name);

    if (room.status !== STATUS.LOBBY) throw new GameError('ROOM_STARTED');
    if (room.players.length >= MAX_PLAYERS) throw new GameError('ROOM_FULL');
    if (room.players.some((player) => normalizeArabic(player.name) === normalizeArabic(cleanName))) {
      throw new GameError('DUPLICATE_NAME');
    }

    const assignment = this.nextAssignment(room);
    const player = this.createPlayer({
      name: cleanName,
      socketId,
      team: assignment.team,
      role: assignment.role,
      isHost: false,
    });

    room.players.push(player);
    this.touch(room);
    this.indexSocket(socketId, room.roomId, player.id);
    return this.sessionResult(room, player);
  }

  reconnect({ roomCode, sessionToken, socketId }) {
    const room = this.requireRoom(roomCode);
    const player = room.players.find((candidate) => candidate.sessionToken === sessionToken);
    if (!player) throw new GameError('INVALID_SESSION');

    this.clearDisconnectTimer(room.roomId, player.id);
    if (player.socketId) this.socketIndex.delete(player.socketId);
    player.socketId = socketId;
    player.connected = true;
    player.lastSeenAt = Date.now();

    if (!room.players.some((candidate) => candidate.isHost && candidate.connected)) {
      room.players.forEach((candidate) => { candidate.isHost = false; });
      player.isHost = true;
      room.hostId = player.id;
    }

    this.indexSocket(socketId, room.roomId, player.id);
    this.touch(room);
    return this.sessionResult(room, player);
  }

  disconnect(socketId) {
    const indexed = this.socketIndex.get(socketId);
    if (!indexed) return null;
    this.socketIndex.delete(socketId);

    const room = this.rooms.get(indexed.roomCode);
    if (!room) return null;
    const player = room.players.find((candidate) => candidate.id === indexed.playerId);
    if (!player || player.socketId !== socketId) return null;

    player.connected = false;
    player.socketId = null;
    player.lastSeenAt = Date.now();
    const wasHost = player.isHost;
    player.isHost = false;

    if (wasHost) this.transferHost(room);
    this.touch(room);

    const timerKey = this.timerKey(room.roomId, player.id);
    const timer = setTimeout(() => {
      this.disconnectTimers.delete(timerKey);
      const currentRoom = this.rooms.get(room.roomId);
      const currentPlayer = currentRoom?.players.find((candidate) => candidate.id === player.id);
      if (!currentRoom || !currentPlayer || currentPlayer.connected) return;

      currentRoom.players = currentRoom.players.filter((candidate) => candidate.id !== player.id);
      if (currentRoom.players.length === 0) {
        this.rooms.delete(currentRoom.roomId);
      } else {
        if (!currentRoom.players.some((candidate) => candidate.isHost)) this.transferHost(currentRoom);
        this.touch(currentRoom);
      }
      this.onAsyncChange(currentRoom.roomId);
    }, this.reconnectWindowMs);
    timer.unref?.();
    this.disconnectTimers.set(timerKey, timer);
    return { roomCode: room.roomId, playerId: player.id };
  }

  updatePlayer({ socketId, targetPlayerId, team, role }) {
    const { room, player } = this.requireSocketPlayer(socketId);
    this.assertHost(room, player);
    if (room.status !== STATUS.LOBBY) throw new GameError('LOBBY_ONLY');
    if (!Object.values(TEAM).includes(team) || !Object.values(ROLE).includes(role)) {
      throw new GameError('INVALID_ASSIGNMENT');
    }

    const target = room.players.find((candidate) => candidate.id === targetPlayerId);
    if (!target) throw new GameError('PLAYER_NOT_FOUND');

    if (role === ROLE.SPYMASTER) {
      room.players.forEach((candidate) => {
        if (candidate.id !== target.id && candidate.team === team && candidate.role === ROLE.SPYMASTER) {
          candidate.role = ROLE.AGENT;
        }
      });
    }

    target.team = team;
    target.role = role;
    this.touch(room);
    return room;
  }

  removePlayer({ socketId, targetPlayerId }) {
    const { room, player } = this.requireSocketPlayer(socketId);
    this.assertHost(room, player);
    if (room.status !== STATUS.LOBBY) throw new GameError('LOBBY_ONLY');
    if (targetPlayerId === player.id) throw new GameError('UNAUTHORIZED');

    const target = room.players.find((candidate) => candidate.id === targetPlayerId);
    if (!target) throw new GameError('PLAYER_NOT_FOUND');
    if (target.socketId) this.socketIndex.delete(target.socketId);
    this.clearDisconnectTimer(room.roomId, target.id);
    room.players = room.players.filter((candidate) => candidate.id !== target.id);
    this.touch(room);
    return { room, removedPlayer: target };
  }

  leaveRoom(socketId) {
    const { room, player } = this.requireSocketPlayer(socketId);
    this.socketIndex.delete(socketId);
    this.clearDisconnectTimer(room.roomId, player.id);
    room.players = room.players.filter((candidate) => candidate.id !== player.id);

    if (room.players.length === 0) {
      this.rooms.delete(room.roomId);
    } else {
      if (player.isHost || !room.players.some((candidate) => candidate.isHost)) {
        this.transferHost(room);
      }
      this.touch(room);
    }
    return { roomCode: room.roomId, playerId: player.id };
  }

  startGame(socketId) {
    const { room, player } = this.requireSocketPlayer(socketId);
    this.assertHost(room, player);
    if (room.status !== STATUS.LOBBY) throw new GameError('LOBBY_ONLY');
    if (!this.canStart(room)) throw new GameError('NOT_READY');
    this.initializeRound(room);
    return room;
  }

  restartGame(socketId) {
    const { room, player } = this.requireSocketPlayer(socketId);
    this.assertHost(room, player);
    if (room.status !== STATUS.FINISHED) throw new GameError('GAME_NOT_FINISHED');
    if (!this.canStart(room)) throw new GameError('NOT_READY');
    this.initializeRound(room);
    return room;
  }

  returnToLobby(socketId) {
    const { room, player } = this.requireSocketPlayer(socketId);
    this.assertHost(room, player);
    if (room.status === STATUS.ACTIVE) throw new GameError('GAME_NOT_FINISHED');

    room.status = STATUS.LOBBY;
    room.board = [];
    room.currentTeam = null;
    room.startingTeam = null;
    room.clue = null;
    room.guessesRemaining = 0;
    room.remainingCards = { [TEAM.RED]: 0, [TEAM.BLUE]: 0 };
    room.winner = null;
    room.resultReason = null;
    this.touch(room);
    return room;
  }

  giveClue({ socketId, word, count }) {
    const { room, player } = this.requireSocketPlayer(socketId);
    if (room.status !== STATUS.ACTIVE) throw new GameError('GAME_NOT_ACTIVE');
    if (player.team !== room.currentTeam) throw new GameError('NOT_YOUR_TURN');
    if (player.role !== ROLE.SPYMASTER) throw new GameError('SPYMASTER_ONLY');
    if (room.clue) throw new GameError('CLUE_EXISTS');

    const cleanWord = String(word || '').trim();
    const cleanCount = Number(count);
    if (!/^[\u0600-\u06FF]+$/u.test(cleanWord) || cleanWord.length > 24 || !Number.isInteger(cleanCount) || cleanCount < 1 || cleanCount > 9) {
      throw new GameError('INVALID_CLUE');
    }
    if (room.board.some((card) => !card.revealed && normalizeArabic(card.word) === normalizeArabic(cleanWord))) {
      throw new GameError('CLUE_MATCHES_CARD');
    }

    room.clue = {
      word: cleanWord,
      count: cleanCount,
      team: room.currentTeam,
      givenBy: player.id,
      createdAt: Date.now(),
    };
    room.guessesRemaining = cleanCount + 1;
    this.touch(room);
    return room;
  }

  selectCard({ socketId, cardId }) {
    const { room, player } = this.requireSocketPlayer(socketId);
    if (room.status !== STATUS.ACTIVE) throw new GameError('GAME_NOT_ACTIVE');
    if (player.team !== room.currentTeam) throw new GameError('NOT_YOUR_TURN');
    if (player.role !== ROLE.AGENT) throw new GameError('AGENT_ONLY');
    if (!room.clue) throw new GameError('CLUE_REQUIRED');

    const card = room.board.find((candidate) => candidate.id === cardId);
    if (!card || card.revealed) throw new GameError('INVALID_CARD');

    card.revealed = true;
    card.revealedBy = player.id;
    const selectingTeam = room.currentTeam;
    let turnEnded = false;

    if (card.type === CARD.ASSASSIN) {
      this.finishRound(room, this.oppositeTeam(selectingTeam), RESULT_REASON.ASSASSIN);
    } else if (card.type === selectingTeam) {
      room.remainingCards[selectingTeam] -= 1;
      if (room.remainingCards[selectingTeam] === 0) {
        this.finishRound(room, selectingTeam, RESULT_REASON.ALL_WORDS);
      } else {
        room.guessesRemaining -= 1;
        if (room.guessesRemaining <= 0) {
          this.switchTurn(room);
          turnEnded = true;
        }
      }
    } else if (card.type === this.oppositeTeam(selectingTeam)) {
      room.remainingCards[card.type] -= 1;
      if (room.remainingCards[card.type] === 0) {
        this.finishRound(room, card.type, RESULT_REASON.ALL_WORDS);
      } else {
        this.switchTurn(room);
        turnEnded = true;
      }
    } else {
      this.switchTurn(room);
      turnEnded = true;
    }

    this.touch(room);
    return { room, revealedType: card.type, turnEnded };
  }

  endTurn(socketId) {
    const { room, player } = this.requireSocketPlayer(socketId);
    if (room.status !== STATUS.ACTIVE) throw new GameError('GAME_NOT_ACTIVE');
    if (player.team !== room.currentTeam) throw new GameError('NOT_YOUR_TURN');
    if (player.role !== ROLE.AGENT) throw new GameError('AGENT_ONLY');
    if (!room.clue) throw new GameError('CLUE_REQUIRED');
    this.switchTurn(room);
    this.touch(room);
    return room;
  }

  serializeFor(roomCode, viewerId) {
    const room = this.requireRoom(roomCode);
    const viewer = room.players.find((candidate) => candidate.id === viewerId);
    if (!viewer) throw new GameError('PLAYER_NOT_FOUND');
    const seesHiddenBoard = viewer.role === ROLE.SPYMASTER;

    return {
      roomId: room.roomId,
      status: room.status,
      hostId: room.hostId,
      players: room.players.map((player) => ({
        id: player.id,
        name: player.name,
        team: player.team,
        role: player.role,
        isHost: player.isHost,
        connected: player.connected,
      })),
      currentPlayerId: viewer.id,
      currentTeam: room.currentTeam,
      startingTeam: room.startingTeam,
      board: room.board.map((card) => ({
        id: card.id,
        word: card.word,
        revealed: card.revealed,
        revealedBy: card.revealedBy,
        type: card.revealed || seesHiddenBoard ? card.type : null,
      })),
      clue: room.clue ? {
        word: room.clue.word,
        count: room.clue.count,
        team: room.clue.team,
        givenBy: room.clue.givenBy,
      } : null,
      guessesRemaining: room.guessesRemaining,
      remainingCards: { ...room.remainingCards },
      winner: room.winner,
      resultReason: room.resultReason,
      round: room.round,
      canStart: this.canStart(room),
      minPlayers: MIN_PLAYERS,
      maxPlayers: MAX_PLAYERS,
      stateVersion: room.stateVersion,
      serverTime: Date.now(),
    };
  }

  canStart(room) {
    const connected = room.players.filter((player) => player.connected);
    if (connected.length < MIN_PLAYERS) return false;
    return Object.values(TEAM).every((team) => (
      connected.some((player) => player.team === team && player.role === ROLE.SPYMASTER)
      && connected.some((player) => player.team === team && player.role === ROLE.AGENT)
    ));
  }

  requireRoom(roomCode) {
    const normalized = String(roomCode || '').trim().toUpperCase();
    if (!/^[A-Z2-9]{5}$/.test(normalized)) throw new GameError('INVALID_ROOM');
    const room = this.rooms.get(normalized);
    if (!room) throw new GameError('ROOM_NOT_FOUND');
    return room;
  }

  requireSocketPlayer(socketId) {
    const indexed = this.socketIndex.get(socketId);
    if (!indexed) throw new GameError('UNAUTHORIZED');
    const room = this.rooms.get(indexed.roomCode);
    const player = room?.players.find((candidate) => candidate.id === indexed.playerId);
    if (!room || !player || !player.connected || player.socketId !== socketId) {
      throw new GameError('UNAUTHORIZED');
    }
    return { room, player };
  }

  sessionResult(room, player) {
    return {
      roomCode: room.roomId,
      playerId: player.id,
      sessionToken: player.sessionToken,
      state: this.serializeFor(room.roomId, player.id),
    };
  }

  clear() {
    this.disconnectTimers.forEach((timer) => clearTimeout(timer));
    this.disconnectTimers.clear();
    this.socketIndex.clear();
    this.rooms.clear();
  }

  initializeRound(room) {
    const generated = createBoard(this.random);
    room.status = STATUS.ACTIVE;
    room.board = generated.cards;
    room.startingTeam = generated.startingTeam;
    room.currentTeam = generated.startingTeam;
    room.clue = null;
    room.guessesRemaining = 0;
    room.remainingCards = {
      [TEAM.RED]: room.board.filter((card) => card.type === TEAM.RED).length,
      [TEAM.BLUE]: room.board.filter((card) => card.type === TEAM.BLUE).length,
    };
    room.winner = null;
    room.resultReason = null;
    room.round += 1;
    this.touch(room);
  }

  finishRound(room, winner, reason) {
    room.status = STATUS.FINISHED;
    room.winner = winner;
    room.resultReason = reason;
    room.clue = null;
    room.guessesRemaining = 0;
  }

  switchTurn(room) {
    room.currentTeam = this.oppositeTeam(room.currentTeam);
    room.clue = null;
    room.guessesRemaining = 0;
  }

  nextAssignment(room) {
    const connected = room.players.filter((player) => player.connected);
    if (!connected.some((player) => player.team === TEAM.BLUE && player.role === ROLE.SPYMASTER)) {
      return { team: TEAM.BLUE, role: ROLE.SPYMASTER };
    }
    if (!connected.some((player) => player.team === TEAM.RED && player.role === ROLE.AGENT)) {
      return { team: TEAM.RED, role: ROLE.AGENT };
    }
    if (!connected.some((player) => player.team === TEAM.BLUE && player.role === ROLE.AGENT)) {
      return { team: TEAM.BLUE, role: ROLE.AGENT };
    }

    const redCount = connected.filter((player) => player.team === TEAM.RED).length;
    const blueCount = connected.filter((player) => player.team === TEAM.BLUE).length;
    return { team: redCount <= blueCount ? TEAM.RED : TEAM.BLUE, role: ROLE.AGENT };
  }

  createPlayer({ name, socketId, team, role, isHost }) {
    return {
      id: crypto.randomUUID(),
      sessionToken: crypto.randomBytes(24).toString('hex'),
      socketId,
      name,
      team,
      role,
      isHost,
      connected: true,
      joinedAt: Date.now(),
      lastSeenAt: Date.now(),
    };
  }

  validateName(name) {
    const clean = String(name || '').trim().replace(/\s+/g, ' ');
    if (clean.length < 2 || clean.length > 20) throw new GameError('INVALID_NAME');
    return clean;
  }

  generateRoomCode() {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      let code = '';
      for (let index = 0; index < 5; index += 1) {
        code += ROOM_ALPHABET[Math.floor(this.random() * ROOM_ALPHABET.length)];
      }
      if (!this.rooms.has(code)) return code;
    }
    throw new Error('Unable to generate a unique room code.');
  }

  indexSocket(socketId, roomCode, playerId) {
    this.socketIndex.set(socketId, { roomCode, playerId });
  }

  assertHost(room, player) {
    if (room.hostId !== player.id || !player.isHost) throw new GameError('NOT_HOST');
  }

  transferHost(room) {
    room.players.forEach((player) => { player.isHost = false; });
    const nextHost = room.players.find((player) => player.connected);
    room.hostId = nextHost?.id || null;
    if (nextHost) nextHost.isHost = true;
  }

  oppositeTeam(team) {
    return team === TEAM.RED ? TEAM.BLUE : TEAM.RED;
  }

  touch(room) {
    room.updatedAt = Date.now();
    room.stateVersion += 1;
  }

  timerKey(roomCode, playerId) {
    return `${roomCode}:${playerId}`;
  }

  clearDisconnectTimer(roomCode, playerId) {
    const key = this.timerKey(roomCode, playerId);
    const timer = this.disconnectTimers.get(key);
    if (timer) clearTimeout(timer);
    this.disconnectTimers.delete(key);
  }
}

module.exports = { RoomManager };
