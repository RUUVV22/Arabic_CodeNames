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
  return (
    <View style={[styles.panel, { borderTopColor: color }]}>
      <View style={styles.header}>
        <View style={[styles.teamDot, { backgroundColor: color }]} />
        <ArabicText weight="bold" style={styles.title}>{TEAM_LABEL[team]}</ArabicText>
        {onJoin ? (
          <Pressable
            accessibilityRole="button"
            disabled={selected || joining}
            onPress={onJoin}
            style={[styles.joinButton, { borderColor: color }, selected && { backgroundColor: color }]}
          >
            <Ionicons name={selected ? 'checkmark-circle' : 'people-outline'} size={14} color={selected ? colors.white : color} />
            <ArabicText weight="bold" style={[styles.joinText, { color: selected ? colors.white : color }]}>
              {selected ? 'فريقك' : 'انضم'}
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
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderTopWidth: 4,
    backgroundColor: colors.panel,
  },
  header: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  teamDot: { width: 11, height: 11, borderRadius: 6 },
  title: { flex: 1, fontSize: 15 },
  remaining: { minWidth: 27, height: 27, paddingHorizontal: 6, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  remainingText: { color: colors.white, fontSize: 13, textAlign: 'center' },
  joinButton: { minHeight: 30, flexDirection: 'row-reverse', alignItems: 'center', gap: 4, paddingHorizontal: 9, borderWidth: 1, borderRadius: radius.pill },
  joinText: { fontSize: 10 },
});
