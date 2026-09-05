import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { GameHeader } from '../components/GameHeader';
import { FormField } from '../components/FormField';
import { PrimaryButton } from '../components/PrimaryButton';
import { ArabicText } from '../components/ArabicText';
import { useGame } from '../context/GameContext';
import { parseRoomCode } from '../utils/deepLinks';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/layout';

export function JoinRoomScreen({ navigation, route }) {
  const { actions, busyAction, lastName } = useGame();
  const [name, setName] = useState(lastName);
  const [roomCode, setRoomCode] = useState(parseRoomCode(route.params?.roomCode) || '');

  useEffect(() => {
    const parsed = parseRoomCode(route.params?.roomCode);
    if (parsed) setRoomCode(parsed);
  }, [route.params?.roomCode]);

  const submit = async () => {
    const code = parseRoomCode(roomCode);
    if (!code) return;
    const response = await actions.joinRoom(code, name);
    if (response.ok) navigation.replace('Lobby');
  };

  return (
    <ScreenContainer keyboard contentStyle={styles.content}>
      <GameHeader title="الانضمام إلى غرفة" subtitle="أدخل الرمز المكوّن من خمسة أحرف" onBack={() => navigation.goBack()} />
      <View style={styles.formCard}>
        <FormField
          label="رمز الغرفة"
          icon="keypad-outline"
          value={roomCode}
          onChangeText={(value) => setRoomCode(value.toUpperCase().replace(/[^A-Z2-9]/g, '').slice(0, 5))}
          placeholder="A7K92"
          maxLength={5}
          autoCapitalize="characters"
          autoCorrect={false}
          inputStyle={styles.codeInput}
        />
        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <ArabicText style={styles.or}>أو</ArabicText>
          <View style={styles.divider} />
        </View>
        <PrimaryButton compact title="مسح رمز QR" icon="qr-code-outline" variant="ghost" onPress={() => navigation.navigate('QRScanner')} />
        <FormField
          label="اسمك في اللعبة"
          icon="person-outline"
          value={name}
          onChangeText={setName}
          placeholder="مثال: سارة"
          maxLength={20}
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={submit}
        />
        <PrimaryButton
          title="الانضمام الآن"
          icon="enter-outline"
          variant="blue"
          loading={busyAction === 'room:join'}
          disabled={!parseRoomCode(roomCode) || name.trim().length < 2}
          onPress={submit}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { justifyContent: 'center' },
  formCard: { gap: spacing.lg, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line },
  codeInput: { writingDirection: 'ltr', textAlign: 'center', letterSpacing: 7, fontSize: 22 },
  dividerRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  divider: { height: 1, flex: 1, backgroundColor: colors.line },
  or: { color: colors.muted, fontSize: 11 },
});
