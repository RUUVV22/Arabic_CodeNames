import React, { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { GameHeader } from '../components/GameHeader';
import { TurnIndicator } from '../components/TurnIndicator';
import { CluePanel } from '../components/CluePanel';
import { GameCard } from '../components/GameCard';
import { GameResultModal } from '../components/GameResultModal';
import { PrimaryButton } from '../components/PrimaryButton';
import { ArabicText } from '../components/ArabicText';
import { useGame } from '../context/GameContext';
import { ROLE, STATUS, TEAM, TEAM_LABEL } from '../constants/game';
import { soundService } from '../services/sounds';
import { colors, teamColor } from '../theme/colors';
import { radius, spacing } from '../theme/layout';

export function GameScreen({ navigation }) {
  const {
    actions,
    busyAction,
    gameState,
    muted,
    session,
    toggleMute,
  } = useGame();
  const { width } = useWindowDimensions();

  useEffect(() => {
    if (!session) navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    else if (gameState?.status === STATUS.LOBBY) navigation.replace('Lobby');
  }, [gameState?.status, navigation, session]);

  const me = gameState?.players.find((player) => player.id === gameState.currentPlayerId);
  const isMyTurn = me?.team === gameState?.currentTeam;
  const isSpymaster = me?.role === ROLE.SPYMASTER;
  const canSelect = gameState?.status === STATUS.ACTIVE && isMyTurn && !isSpymaster && Boolean(gameState.clue);
  const boardWidth = Math.min(width - 16, 520);
  const cardGap = 4;
  const cardWidth = (boardWidth - cardGap * 4) / 5;
  const playerRole = isSpymaster ? 'قائد الفريق — ترى هويات البطاقات' : 'لاعب — اختر كلمات فريقك';

  const teams = useMemo(() => [TEAM.RED, TEAM.BLUE], []);
  if (!gameState || !me) {
    return <ScreenContainer scroll={false} contentStyle={styles.center}><ArabicText style={styles.muted}>جارٍ تحميل الجولة…</ArabicText></ScreenContainer>;
  }

  const handleSelect = async (cardId) => {
    await soundService.play('select');
    const response = await actions.selectCard(cardId);
    if (response.ok) await soundService.play('reveal');
  };

  return (
    <ScreenContainer scroll={false} contentStyle={styles.screen}>
      <GameHeader
        title={`الجولة ${gameState.round}`}
        subtitle={`${gameState.roomId} • ${playerRole}`}
        rightIcon={muted ? 'volume-mute-outline' : 'volume-high-outline'}
        onRightPress={toggleMute}
      />

      <View style={styles.scoreRow}>
        {teams.map((team) => (
          <View key={team} style={[styles.score, { borderColor: teamColor(team) }]}>
            <View style={[styles.scoreDot, { backgroundColor: teamColor(team) }]} />
            <ArabicText weight="bold" style={styles.scoreName}>{TEAM_LABEL[team]}</ArabicText>
            <ArabicText weight="extraBold" style={[styles.scoreNumber, { color: teamColor(team) }]}>{gameState.remainingCards[team]}</ArabicText>
          </View>
        ))}
      </View>

      <TurnIndicator team={gameState.currentTeam} isMyTurn={isMyTurn} />

      <View style={[styles.board, { width: boardWidth, gap: cardGap }]}>
        {gameState.board.map((card) => (
          <GameCard
            key={card.id}
            card={card}
            width={cardWidth}
            disabled={!canSelect || busyAction === 'game:select-card'}
            onPress={handleSelect}
          />
        ))}
      </View>

      <CluePanel
        clue={gameState.clue}
        team={gameState.currentTeam}
        canGiveClue={gameState.status === STATUS.ACTIVE && isMyTurn && isSpymaster && !gameState.clue}
        waitingForClue={isMyTurn}
        loading={busyAction === 'game:give-clue'}
        onGiveClue={actions.giveClue}
      />

      {canSelect ? (
        <View style={styles.agentActions}>
          <ArabicText style={styles.guesses}>المحاولات المتاحة: {gameState.guessesRemaining}</ArabicText>
          <PrimaryButton compact title="إنهاء الدور" icon="stop-circle-outline" variant="ghost" loading={busyAction === 'game:end-turn'} onPress={actions.endTurn} />
        </View>
      ) : null}

      <GameResultModal
        visible={gameState.status === STATUS.FINISHED}
        winner={gameState.winner}
        reason={gameState.resultReason}
        myTeam={me.team}
        isHost={me.isHost}
        loading={busyAction === 'game:restart'}
        onReplay={actions.restartGame}
        onLobby={actions.returnToLobby}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: spacing.sm, paddingBottom: spacing.sm },
  center: { alignItems: 'center', justifyContent: 'center' },
  muted: { color: colors.muted },
  scoreRow: { flexDirection: 'row-reverse', gap: spacing.sm, marginBottom: spacing.sm },
  score: { flex: 1, minHeight: 38, flexDirection: 'row-reverse', alignItems: 'center', gap: 5, paddingHorizontal: spacing.sm, borderWidth: 1, borderRadius: radius.sm, backgroundColor: colors.panel },
  scoreDot: { width: 7, height: 22, borderRadius: 4 },
  scoreName: { flex: 1, fontSize: 11 },
  scoreNumber: { fontSize: 18, textAlign: 'center' },
  board: { alignSelf: 'center', flexDirection: 'row', flexWrap: 'wrap', marginVertical: spacing.sm },
  agentActions: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, marginTop: spacing.sm },
  guesses: { color: colors.gold, fontSize: 12 },
});
