import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ArabicText } from './ArabicText';
import { PlayerList } from './PlayerList';
import { TEAM_LABEL } from '../constants/game';
import { colors, teamColor } from '../theme/colors';
import { radius, spacing } from '../theme/layout';

export function TeamPanel({ team, players, remaining, ...playerListProps }) {
  const color = teamColor(team);
  return (
    <View style={[styles.panel, { borderTopColor: color }]}>
      <View style={styles.header}>
        <View style={[styles.teamDot, { backgroundColor: color }]} />
        <ArabicText weight="bold" style={styles.title}>{TEAM_LABEL[team]}</ArabicText>
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
});
