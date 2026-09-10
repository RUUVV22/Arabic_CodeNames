import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ArabicText } from './ArabicText';
import { PlayerList } from './PlayerList';
import { TEAM_LABEL } from '../constants/game';
import { colors, teamColor } from '../theme/colors';
import { radius, spacing } from '../theme/layout';

export function TeamPanel({ team, players, remaining, selected, joining, onJoin, ...playerListProps }) {
  const color = teamColor(team);
  const selectedBackground = team === 'RED' ? 'rgba(232,74,95,0.12)' : 'rgba(50,132,214,0.12)';
  return (
    <View
      style={[
        styles.panel,
        { borderTopColor: color },
        selected && { borderColor: color, backgroundColor: selectedBackground },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.teamDot, { backgroundColor: color }]} />
        <ArabicText weight="bold" style={styles.title}>{TEAM_LABEL[team]}</ArabicText>
        <View style={styles.playerCount}>
          <Ionicons name="people" size={14} color={colors.paperMuted} />
          <ArabicText weight="bold" style={styles.playerCountText}>{players.length}</ArabicText>
        </View>
        {onJoin ? (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected, disabled: selected || joining }}
            disabled={selected || joining}
            onPress={onJoin}
            style={[styles.joinButton, { borderColor: color }, selected && { backgroundColor: color }]}
          >
            <Ionicons name={selected ? 'checkmark-circle' : 'people-outline'} size={17} color={selected ? colors.white : color} />
            <ArabicText weight="bold" style={[styles.joinText, { color: selected ? colors.white : color }]}>
              {selected ? 'تم الاختيار' : 'انضم'}
            </ArabicText>
          </Pressable>
        ) : null}
        {Number.isInteger(remaining) ? (
          <View style={[styles.remaining, { backgroundColor: color }]}>
            <ArabicText weight="bold" style={styles.remainingText}>{remaining}</ArabicText>
          </View>
        ) : null}
      </View>
      <PlayerList players={players} {...playerListProps} />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    minWidth: 0,
    gap: 14,
    padding: 16,
    borderRadius: radius.md,
    borderWidth: 1,
    borderTopWidth: 6,
    borderColor: colors.line,
    backgroundColor: colors.panel,
  },
  header: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  teamDot: { width: 14, height: 14, borderRadius: 7 },
  title: { flex: 1, fontSize: 18 },
  playerCount: { minWidth: 38, minHeight: 30, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 7, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.08)' },
  playerCountText: { color: colors.paperMuted, fontSize: 12, textAlign: 'center' },
  remaining: { minWidth: 27, height: 27, paddingHorizontal: 6, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  remainingText: { color: colors.white, fontSize: 13, textAlign: 'center' },
  joinButton: { minHeight: 38, flexDirection: 'row-reverse', alignItems: 'center', gap: 5, paddingHorizontal: 12, borderWidth: 1, borderRadius: radius.pill },
  joinText: { fontSize: 12 },
});
