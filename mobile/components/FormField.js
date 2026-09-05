import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ArabicText } from './ArabicText';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/layout';

export function FormField({ label, icon, style, inputStyle, ...inputProps }) {
  return (
    <View style={[styles.field, style]}>
      {label ? <ArabicText weight="medium" style={styles.label}>{label}</ArabicText> : null}
      <View style={styles.inputShell}>
        {icon ? <Ionicons name={icon} size={20} color={colors.muted} /> : null}
        <TextInput
          placeholderTextColor={colors.muted}
          {...inputProps}
          style={[styles.input, inputStyle]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.sm },
  label: { color: colors.paperMuted, fontSize: 13 },
  inputShell: {
    minHeight: 54,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  input: {
    flex: 1,
    color: colors.paper,
    fontFamily: 'Tajawal_500Medium',
    fontSize: 16,
    textAlign: 'right',
    writingDirection: 'rtl',
    paddingVertical: 8,
  },
});
