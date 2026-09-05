import React, { useEffect } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../components/ScreenContainer';
import { GameHeader } from '../components/GameHeader';
import { RoomCode } from '../components/RoomCode';
import { QRCodeDisplay } from '../components/QRCodeDisplay';
import { TeamPanel } from '../components/TeamPanel';
import { PrimaryButton } from '../components/PrimaryButton';
import { ArabicText } from '../components/ArabicText';
import { ConnectionPill } from '../components/ConnectionPill';
import { useGame } from '../context/GameContext';
import { ROLE, STATUS, TEAM } from '../constants/game';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/layout';

export function LobbyScreen({ navigation }) {
  const {
    actions,
    busyAction,
    connectionStatus,
    gameState,
    session,
    showNotice,
  } = useGame();

  useEffect(() => {
    if (!session) navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    else if (gameState?.status === STATUS.ACTIVE || gameState?.status === STATUS.FINISHED) navigation.replace('Game');
  }, [gameState?.status, navigation, session]);

  if (!gameState) {
    return (
      <ScreenContainer scroll={false} contentStyle={styles.loading}>
        <ArabicText style={styles.loadingText}>جارٍ استعادة الغرفة…</ArabicText>
      </ScreenContainer>
    );
  }

  const me = gameState.players.find((player) => player.id === gameState.currentPlayerId);
  const isHost = me?.isHost;
  const redPlayers = gameState.players.filter((player) => player.team === TEAM.RED);
  const bluePlayers = gameState.players.filter((player) => player.team === TEAM.BLUE);
  const connectedCount = gameState.players.filter((player) => player.connected).length;

  const toggleRole = (player) => actions.updatePlayer(
    player.id,
    player.team,
    player.role === ROLE.SPYMASTER ? ROLE.AGENT : ROLE.SPYMASTER,
  );
  const moveTeam = (player) => actions.updatePlayer(
    player.id,
    player.team === TEAM.RED ? TEAM.BLUE : TEAM.RED,
    player.role,
  );
  const removePlayer = (player) => Alert.alert(
    'إزالة اللاعب',
    `هل تريد إزالة ${player.name} من الغرفة؟`,
    [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'إزالة', style: 'destructive', onPress: () => actions.removePlayer(player.id) },
    ],
  );
  const leave = () => Alert.alert(
    'مغادرة الغرفة',
    'هل تريد العودة إلى الشاشة الرئيسية؟',
    [
      { text: 'البقاء', style: 'cancel' },
      {
        text: 'مغادرة',
        style: 'destructive',
        onPress: async () => {
          await actions.leaveRoom();
          navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
        },
      },
    ],
  );

  const playerListProps = {
    editable: isHost,
    currentPlayerId: me?.id,
    onToggleRole: toggleRole,
    onMoveTeam: moveTeam,
    onRemove: removePlayer,
  };

  return (
    <ScreenContainer>
      <GameHeader title="ردهة اللاعبين" subtitle={`${connectedCount} متصلون الآن`} onBack={leave} />
      <View style={styles.statusRow}>
        <ConnectionPill status={connectionStatus} />
        <View style={styles.hostBadge}>
          <Ionicons name={isHost ? 'star' : 'time-outline'} size={14} color={isHost ? colors.gold : colors.muted} />
          <ArabicText weight="medium" style={styles.hostText}>{isHost ? 'أنت المضيف' : 'بانتظار المضيف'}</ArabicText>
        </View>
      </View>

      <RoomCode code={gameState.roomId} onCopied={() => showNotice('تم نسخ رمز الغرفة', 'success')} />
      <View style={styles.qrWrap}>
        <QRCodeDisplay roomCode={gameState.roomId} compact />
        <View style={styles.inviteCopy}>
          <ArabicText weight="bold" style={styles.inviteTitle}>ادعُ أصدقاءك</ArabicText>
          <ArabicText style={styles.inviteText}>يمكنهم كتابة الرمز أو مسح QR من شاشة الانضمام.</ArabicText>
          <ArabicText style={styles.deepLink}>codenames://join/{gameState.roomId}</ArabicText>
        </View>
      </View>

      <ArabicText weight="bold" style={styles.sectionTitle}>الفرق والأدوار</ArabicText>
      {isHost ? <ArabicText style={styles.editHelp}>اضغط على الدور لتغييره، أو استخدم زر النقل بين الفريقين.</ArabicText> : null}
      <View style={styles.teams}>
        <TeamPanel team={TEAM.RED} players={redPlayers} {...playerListProps} />
        <TeamPanel team={TEAM.BLUE} players={bluePlayers} {...playerListProps} />
      </View>

      <View style={[styles.readiness, gameState.canStart && styles.ready]}>
        <Ionicons name={gameState.canStart ? 'checkmark-circle' : 'information-circle'} size={20} color={gameState.canStart ? colors.success : colors.gold} />
        <ArabicText style={styles.readinessText}>
          {gameState.canStart
            ? 'الفريقان جاهزان لبدء الجولة'
            : `يلزم ${gameState.minPlayers} لاعبين على الأقل: قائد ولاعب في كل فريق`}
        </ArabicText>
      </View>

      {isHost ? (
        <PrimaryButton
          title="بدء اللعبة"
          icon="play"
          disabled={!gameState.canStart}
          loading={busyAction === 'game:start'}
          onPress={actions.startGame}
        />
      ) : (
        <View style={styles.waitingHost}>
          <ArabicText style={styles.waitingHostText}>سيبدأ المضيف اللعبة عندما تكتمل الفرق</ArabicText>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loading: { alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: colors.muted },
  statusRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  hostBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.xs },
  hostText: { color: colors.paperMuted, fontSize: 12 },
  qrWrap: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md, marginVertical: spacing.md },
  inviteCopy: { flex: 1, gap: spacing.xs },
  inviteTitle: { fontSize: 18 },
  inviteText: { color: colors.muted, fontSize: 12, lineHeight: 19 },
  deepLink: { color: colors.gold, fontSize: 10, writingDirection: 'ltr', textAlign: 'left' },
  sectionTitle: { fontSize: 18, marginTop: spacing.md },
  editHelp: { color: colors.muted, fontSize: 11, marginBottom: spacing.sm },
  teams: { gap: spacing.md, marginVertical: spacing.md },
  readiness: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: 'rgba(245,196,81,0.08)', marginBottom: spacing.md },
  ready: { backgroundColor: 'rgba(68,194,141,0.10)' },
  readinessText: { flex: 1, color: colors.paperMuted, fontSize: 12 },
  waitingHost: { minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.05)' },
  waitingHostText: { color: colors.muted, fontSize: 13, textAlign: 'center' },
});
