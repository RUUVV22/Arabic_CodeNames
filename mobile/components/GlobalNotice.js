import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArabicText } from './ArabicText';
import { useGame } from '../context/GameContext';
import { colors } from '../theme/colors';
import { radius, shadow, spacing } from '../theme/layout';

export function GlobalNotice() {
  const { notice, setNotice } = useGame();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(null), 4_500);
    return () => clearTimeout(timer);
  }, [notice, setNotice]);

  if (!notice) return null;
  const success = notice.type === 'success';
  return (
    <View pointerEvents="box-none" style={[styles.layer, { top: insets.top + spacing.sm }]}>
      <Pressable
        onPress={() => setNotice(null)}
        style={[styles.notice, { borderColor: success ? colors.success : colors.danger }]}
      >
        <Ionicons name={success ? 'checkmark-circle' : 'alert-circle'} size={22} color={success ? colors.success : colors.danger} />
        <ArabicText weight="medium" style={styles.text}>{notice.message}</ArabicText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', left: spacing.md, right: spacing.md, zIndex: 1000, alignItems: 'center' },
  notice: {
    maxWidth: 520,
    width: '100%',
    minHeight: 52,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    backgroundColor: colors.panelRaised,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    ...shadow,
  },
  text: { flex: 1, fontSize: 14 },
});
