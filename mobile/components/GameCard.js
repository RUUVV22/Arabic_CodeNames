import React, { memo, useEffect, useMemo, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { ArabicText } from './ArabicText';
import { cardColor, colors } from '../theme/colors';
import { radius, shadow } from '../theme/layout';

export const GameCard = memo(function GameCard({ card, width, disabled, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const identityColor = cardColor(card.type);
  const wasRevealed = useRef(card.revealed);

  useEffect(() => {
    if (card.revealed && !wasRevealed.current) {
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 0.88, duration: 110, useNativeDriver: true }),
          Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(rotation, { toValue: 1, duration: 110, useNativeDriver: true }),
          Animated.timing(rotation, { toValue: 0, duration: 170, useNativeDriver: true }),
        ]),
      ]).start();
    }
    wasRevealed.current = card.revealed;
  }, [card.revealed, rotation, scale]);

  const fontSize = useMemo(() => {
    if (card.word.length >= 8) return 10;
    if (card.word.length >= 6) return 11;
    return 12.5;
  }, [card.word]);

  const rotateY = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '8deg'] });
  return (
    <Animated.View style={{ width, transform: [{ scale }, { rotateY }] }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${card.word}${card.revealed ? '، مكشوفة' : ''}`}
        disabled={disabled || card.revealed}
        onPress={() => onPress(card.id)}
        style={({ pressed }) => [
          styles.card,
          { width, height: Math.max(50, width * 0.78) },
          card.revealed && { backgroundColor: identityColor, borderColor: identityColor },
          !card.revealed && card.type && { borderColor: identityColor, borderWidth: 2 },
          (disabled || card.revealed) && !card.revealed && styles.disabled,
          pressed && styles.pressed,
        ]}
      >
        {!card.revealed && card.type ? <View style={[styles.spyStripe, { backgroundColor: identityColor }]} /> : null}
        {card.revealed && card.type === 'ASSASSIN' ? <ArabicText style={styles.assassin}>✦</ArabicText> : null}
        <ArabicText
          weight="bold"
          numberOfLines={2}
          adjustsFontSizeToFit
          style={[styles.word, { fontSize }, card.revealed && styles.revealedWord]}
        >
          {card.word}
        </ArabicText>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#D9CBB2',
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    ...shadow,
  },
  spyStripe: { position: 'absolute', right: 0, left: 0, bottom: 0, height: 6 },
  word: { color: colors.ink, textAlign: 'center', writingDirection: 'rtl', lineHeight: 18 },
  revealedWord: { color: colors.white, textShadowColor: 'rgba(0,0,0,0.25)', textShadowRadius: 2, textShadowOffset: { width: 0, height: 1 } },
  assassin: { position: 'absolute', top: 1, left: 5, color: colors.gold, fontSize: 12 },
  disabled: { opacity: 0.68 },
  pressed: { transform: [{ scale: 0.95 }], opacity: 0.9 },
});
