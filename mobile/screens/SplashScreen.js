import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BrandMark } from '../components/BrandMark';
import { ArabicText } from '../components/ArabicText';
import { colors } from '../theme/colors';
import { spacing } from '../theme/layout';

export function SplashScreen({ navigation }) {
  useEffect(() => {
    const timer = setTimeout(() => navigation.replace('Home'), 1_450);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <LinearGradient colors={[colors.ink, '#0A2035', '#133958']} style={styles.screen}>
      <View style={styles.glow} />
      <BrandMark size={116} />
      <ArabicText weight="extraBold" style={styles.title}>الشِّفرة</ArabicText>
      <ArabicText weight="medium" style={styles.subtitle}>كلمة واحدة تغيّر كل شيء</ArabicText>
      <View style={styles.rule} />
      <ArabicText style={styles.multiplayer}>لعبة جماعية عربية</ArabicText>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  glow: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(245,196,81,0.06)' },
  title: { color: colors.paper, fontSize: 48, textAlign: 'center', marginTop: spacing.xl },
  subtitle: { color: colors.gold, fontSize: 17, textAlign: 'center', marginTop: -2 },
  rule: { width: 42, height: 3, borderRadius: 2, backgroundColor: colors.red, marginTop: spacing.xl, marginBottom: spacing.md },
  multiplayer: { color: colors.muted, fontSize: 13, textAlign: 'center' },
});
