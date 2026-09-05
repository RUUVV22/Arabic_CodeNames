import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ArabicText } from './ArabicText';
import { colors } from '../theme/colors';
import { radius, shadow, spacing } from '../theme/layout';

const variants = {
  gold: { background: colors.gold, foreground: colors.ink },
  red: { background: colors.red, foreground: colors.white },
  blue: { background: colors.blue, foreground: colors.white },
  ghost: { background: 'rgba(255,255,255,0.07)', foreground: colors.paper },
  danger: { background: colors.danger, foreground: colors.white },
};

export function PrimaryButton({
  title,
  icon,
  variant = 'gold',
  loading = false,
  disabled = false,
  compact = false,
  style,
  onPress,
}) {
  const palette = variants[variant] || variants.gold;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        compact && styles.compact,
        { backgroundColor: palette.background },
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={palette.foreground} />
        ) : (
          <>
            {icon ? <Ionicons name={icon} size={compact ? 18 : 21} color={palette.foreground} /> : null}
            <ArabicText weight="bold" style={[styles.label, compact && styles.compactLabel, { color: palette.foreground }]}>
              {title}
            </ArabicText>
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    borderRadius: radius.md,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    ...shadow,
  },
  compact: { minHeight: 40, paddingHorizontal: spacing.md, borderRadius: radius.sm },
  content: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  label: { fontSize: 17, textAlign: 'center' },
  compactLabel: { fontSize: 14 },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },
});
