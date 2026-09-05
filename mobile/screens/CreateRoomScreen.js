import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { GameHeader } from '../components/GameHeader';
import { FormField } from '../components/FormField';
import { PrimaryButton } from '../components/PrimaryButton';
import { ArabicText } from '../components/ArabicText';
import { useGame } from '../context/GameContext';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/layout';

export function CreateRoomScreen({ navigation }) {
  const { actions, busyAction, lastName } = useGame();
  const [name, setName] = useState(lastName);

  const submit = async () => {
    const response = await actions.createRoom(name);
    if (response.ok) navigation.replace('Lobby');
  };

  return (
    <ScreenContainer keyboard contentStyle={styles.content}>
      <GameHeader title="إنشاء غرفة" subtitle="ستكون أنت مضيف اللعبة" onBack={() => navigation.goBack()} />
      <View style={styles.intro}>
        <ArabicText weight="extraBold" style={styles.heading}>ابدأ جولة جديدة</ArabicText>
        <ArabicText style={styles.description}>أنشئ الغرفة ثم شارك الرمز أو رمز QR مع أصدقائك.</ArabicText>
      </View>
      <View style={styles.formCard}>
        <FormField
          label="اسمك في اللعبة"
          icon="person-outline"
          value={name}
          onChangeText={setName}
          placeholder="مثال: أحمد"
          maxLength={20}
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={submit}
        />
        <PrimaryButton
          title="إنشاء الغرفة"
          icon="sparkles-outline"
          variant="red"
          loading={busyAction === 'room:create'}
          disabled={name.trim().length < 2}
          onPress={submit}
        />
      </View>
      <ArabicText style={styles.note}>لا تحتاج إلى حساب. تبقى الغرفة نشطة طوال مدة اللعب فقط.</ArabicText>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { justifyContent: 'center' },
  intro: { alignItems: 'flex-end', marginVertical: spacing.xl },
  heading: { fontSize: 29 },
  description: { color: colors.muted, fontSize: 14, marginTop: spacing.xs },
  formCard: { gap: spacing.xl, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line },
  note: { color: colors.muted, fontSize: 11, textAlign: 'center', marginTop: spacing.xl },
});
