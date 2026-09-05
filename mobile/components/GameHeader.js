import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ArabicText } from './ArabicText';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/layout';

export function GameHeader({ title, subtitle, onBack, rightIcon, onRightPress }) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable onPress={onBack} style={styles.iconButton} hitSlop={8}>
          <Ionicons name="arrow-forward" size={23} color={colors.paper} />
        </Pressable>
      ) : <View style={styles.placeholder} />}
      <View style={styles.copy}>
        <ArabicText weight="bold" style={styles.title}>{title}</ArabicText>
        {subtitle ? <ArabicText style={styles.subtitle}>{subtitle}</ArabicText> : null}
      </View>
      {rightIcon ? (
        <Pressable onPress={onRightPress} style={styles.iconButton} hitSlop={8}>
          <Ionicons name={rightIcon} size={22} color={colors.paper} />
        </Pressable>
      ) : <View style={styles.placeholder} />}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  copy: { flex: 1, alignItems: 'center' },
  title: { fontSize: 21, textAlign: 'center' },
  subtitle: { color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 1 },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: { width: 42, height: 42 },
});
