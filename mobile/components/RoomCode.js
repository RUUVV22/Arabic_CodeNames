import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { ArabicText } from './ArabicText';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/layout';

export function RoomCode({ code, onCopied }) {
  const copy = async () => {
    await Clipboard.setStringAsync(code);
    onCopied?.();
  };

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`رمز الغرفة ${code}`} onPress={copy} style={styles.container}>
      <View>
        <ArabicText style={styles.caption}>رمز الغرفة</ArabicText>
        <ArabicText weight="extraBold" style={styles.code}>{code}</ArabicText>
      </View>
      <Ionicons name="copy-outline" size={22} color={colors.gold} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    backgroundColor: colors.panelRaised,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  caption: { color: colors.muted, fontSize: 12 },
  code: { color: colors.gold, fontSize: 26, letterSpacing: 4, writingDirection: 'ltr', textAlign: 'right' },
});
