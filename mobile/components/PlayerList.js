import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ArabicText } from './ArabicText';
import { ROLE, ROLE_LABEL } from '../constants/game';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/layout';

export function PlayerList({ players, editable, currentPlayerId, onToggleRole, onMoveTeam, onRemove }) {
  if (!players.length) {
    return <ArabicText style={styles.empty}>بانتظار لاعب…</ArabicText>;
  }
  return (
    <View style={styles.list}>
      {players.map((player) => (
        <View key={player.id} style={[styles.row, !player.connected && styles.offline]}>
          <View style={styles.identity}>
            <View style={styles.nameLine}>
              {player.isHost ? <Ionicons name="star" size={13} color={colors.gold} /> : null}
              <ArabicText weight="bold" numberOfLines={1} style={styles.name}>
                {player.name}{player.id === currentPlayerId ? ' (أنت)' : ''}
              </ArabicText>
            </View>
            <ArabicText style={styles.status}>{player.connected ? 'متصل' : 'غير متصل'}</ArabicText>
          </View>

          <Pressable
            disabled={!editable}
            onPress={() => onToggleRole(player)}
            style={[styles.role, player.role === ROLE.SPYMASTER && styles.spyRole]}
          >
            <ArabicText weight="medium" style={[styles.roleText, player.role === ROLE.SPYMASTER && styles.spyRoleText]}>
              {ROLE_LABEL[player.role]}
            </ArabicText>
          </Pressable>

          {editable && player.id !== currentPlayerId ? (
            <View style={styles.actions}>
              <Pressable onPress={() => onMoveTeam(player)} style={styles.actionButton} hitSlop={5}>
                <Ionicons name="swap-horizontal" size={17} color={colors.paper} />
              </Pressable>
              <Pressable onPress={() => onRemove(player)} style={styles.actionButton} hitSlop={5}>
                <Ionicons name="close" size={18} color={colors.danger} />
              </Pressable>
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  row: {
    minHeight: 54,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  offline: { opacity: 0.47 },
  identity: { flex: 1, minWidth: 0 },
  nameLine: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.xs },
  name: { flexShrink: 1, fontSize: 13 },
  status: { color: colors.muted, fontSize: 10 },
  role: { paddingVertical: 5, paddingHorizontal: 8, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.08)' },
  spyRole: { backgroundColor: colors.gold },
  roleText: { color: colors.paperMuted, fontSize: 10 },
  spyRoleText: { color: colors.ink },
  actions: { flexDirection: 'row-reverse', gap: 3 },
  actionButton: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  empty: { color: colors.muted, fontSize: 12, textAlign: 'center', paddingVertical: spacing.md },
});
