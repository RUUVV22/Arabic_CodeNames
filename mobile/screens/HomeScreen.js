import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../components/ScreenContainer';
import { BrandMark } from '../components/BrandMark';
import { ArabicText } from '../components/ArabicText';
import { PrimaryButton } from '../components/PrimaryButton';
import { ConnectionPill } from '../components/ConnectionPill';
import { FormField } from '../components/FormField';
import { InstallAppButton } from '../components/InstallAppButton';
import { useGame } from '../context/GameContext';
import { STATUS } from '../constants/game';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/layout';

export function HomeScreen({ navigation }) {
  const {
    serverUrl,
    connectionStatus,
    session,
    gameState,
    updateServerUrl,
  } = useGame();
  const [editingServer, setEditingServer] = useState(false);
  const [serverDraft, setServerDraft] = useState(serverUrl);

  const continueGame = () => {
    if (!gameState) return;
    navigation.navigate(gameState.status === STATUS.LOBBY ? 'Lobby' : 'Game');
  };

  return (
    <ScreenContainer contentStyle={styles.content}>
      <View style={styles.topRow}>
        <ConnectionPill status={connectionStatus} />
        <Pressable onPress={() => setEditingServer((value) => !value)} style={styles.settingsButton}>
          <Ionicons name="server-outline" size={20} color={colors.paperMuted} />
        </Pressable>
      </View>

      <View style={styles.hero}>
        <BrandMark size={92} />
        <View style={styles.heroCopy}>
          <ArabicText weight="extraBold" style={styles.title}>الشِّفرة</ArabicText>
          <ArabicText style={styles.tagline}>فكّر بذكاء. لمّح بكلمة. اكشف فريقك.</ArabicText>
        </View>
      </View>

      {editingServer ? (
        <View style={styles.serverPanel}>
          <ArabicText weight="bold" style={styles.serverTitle}>عنوان خادم اللعب</ArabicText>
          <ArabicText style={styles.serverHelp}>للهاتف الحقيقي استخدم عنوان IP للحاسوب على الشبكة نفسها.</ArabicText>
          <FormField
            icon="globe-outline"
            value={serverDraft}
            onChangeText={setServerDraft}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            inputStyle={styles.urlInput}
          />
          <PrimaryButton compact title="حفظ العنوان" icon="checkmark" onPress={async () => {
            if (await updateServerUrl(serverDraft)) setEditingServer(false);
          }} />
        </View>
      ) : null}

      <View style={styles.actions}>
        {session ? (
          <PrimaryButton
            title={gameState ? 'متابعة الغرفة' : 'جارٍ استعادة الغرفة…'}
            icon="play-circle-outline"
            variant="gold"
            disabled={!gameState}
            onPress={continueGame}
          />
        ) : null}
        <PrimaryButton title="إنشاء غرفة" icon="add-circle-outline" variant="red" onPress={() => navigation.navigate('CreateRoom')} />
        <PrimaryButton title="الانضمام إلى غرفة" icon="enter-outline" variant="blue" onPress={() => navigation.navigate('JoinRoom')} />
        <PrimaryButton title="كيفية اللعب" icon="help-circle-outline" variant="ghost" onPress={() => navigation.navigate('HowToPlay')} />
        <InstallAppButton />
      </View>

      <View style={styles.footer}>
        <View style={styles.teamDash} />
        <ArabicText style={styles.footerText}>مصممة للعربية من اليمين إلى اليسار</ArabicText>
        <View style={[styles.teamDash, styles.blueDash]} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { justifyContent: 'space-between', paddingTop: spacing.md },
  topRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  settingsButton: { width: 42, height: 42, borderRadius: radius.sm, backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center' },
  hero: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: spacing.xl, marginVertical: spacing.xxl },
  heroCopy: { alignItems: 'flex-end', flexShrink: 1 },
  title: { color: colors.paper, fontSize: 43, lineHeight: 54 },
  tagline: { color: colors.gold, fontSize: 14, maxWidth: 210 },
  actions: { gap: spacing.md },
  serverPanel: { gap: spacing.sm, padding: spacing.md, marginBottom: spacing.lg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panel },
  serverTitle: { fontSize: 15 },
  serverHelp: { color: colors.muted, fontSize: 11 },
  urlInput: { writingDirection: 'ltr', textAlign: 'left', fontSize: 13 },
  footer: { flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xxl },
  footerText: { color: colors.muted, fontSize: 11, textAlign: 'center' },
  teamDash: { width: 16, height: 3, borderRadius: 2, backgroundColor: colors.red },
  blueDash: { backgroundColor: colors.blue },
});
