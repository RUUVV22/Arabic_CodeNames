import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ArabicText } from './ArabicText';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/layout';

const labels = {
  connected: 'متصل',
  connecting: 'جارٍ الاتصال',
  disconnected: 'غير متصل',
};

export function ConnectionPill({ status }) {
  const dotColor = status === 'connected' ? colors.success : status === 'connecting' ? colors.gold : colors.danger;
  return (
    <View style={styles.pill}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <ArabicText weight="medium" style={styles.label}>{labels[status] || labels.disconnected}</ArabicText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { color: colors.paperMuted, fontSize: 12 },
});
