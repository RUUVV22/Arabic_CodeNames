import React, { memo, useEffect, useMemo, useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { gsap } from 'gsap';
import { ArabicText } from './ArabicText';
import { cardColor, cardTextColor, colors } from '../theme/colors';
import { radius, shadow } from '../theme/layout';

export const CARD_SUSPENSE_MS = 900;

export const GameCard = memo(function GameCard({ card, width, disabled, selecting, onPress }) {
  const shakeX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const reveal = useRef(new Animated.Value(card.type ? 1 : 0)).current;
  const hadIdentity = useRef(Boolean(card.type));
  const identityColor = cardColor(card.type);
  const identityTextColor = cardTextColor(card.type);

  useEffect(() => {
    if (!selecting || card.revealed) return undefined;
    const driver = { x: 0, rotation: 0, scale: 1 };
    const sync = () => {
      shakeX.setValue(driver.x);
      rotation.setValue(driver.rotation);
      scale.setValue(driver.scale);
    };
    const timeline = gsap.timeline({ onUpdate: sync });
    timeline
      .to(driver, { x: -5, rotation: -2.3, scale: 0.975, duration: 0.07, ease: 'power1.inOut' })
      .to(driver, { x: 6, rotation: 2.5, duration: 0.08, ease: 'power1.inOut' })
      .to(driver, { x: -6, rotation: -2.5, duration: 0.08, ease: 'power1.inOut' })
      .to(driver, { x: 5, rotation: 2, duration: 0.08, ease: 'power1.inOut' })
      .to(driver, { x: -4, rotation: -1.6, duration: 0.08, ease: 'power1.inOut' })
      .to(driver, { x: 4, rotation: 1.5, duration: 0.08, ease: 'power1.inOut' })
      .to(driver, { x: -2, rotation: -0.8, duration: 0.08, ease: 'power1.inOut' })
      .to(driver, { x: 0, rotation: 0, scale: 1.035, duration: 0.12, ease: 'back.out(2)' })
      .to(driver, { scale: 1, duration: 0.1, ease: 'power2.out' });

    return () => {
      timeline.kill();
      shakeX.setValue(0);
      rotation.setValue(0);
      scale.setValue(1);
    };
  }, [card.revealed, rotation, scale, selecting, shakeX]);

  useEffect(() => {
    let tween;
    if (card.type && !hadIdentity.current) {
      const driver = { value: 0 };
      reveal.setValue(0);
      tween = gsap.to(driver, {
        value: 1,
        duration: 0.58,
        ease: 'power3.out',
        onUpdate: () => reveal.setValue(driver.value),
      });
    } else if (!card.type) {
      reveal.setValue(0);
    } else {
      reveal.setValue(1);
    }
    hadIdentity.current = Boolean(card.type);
    return () => tween?.kill();
  }, [card.type, reveal]);

  const fontSize = useMemo(() => {
    if (card.word.length >= 8) return 10;
    if (card.word.length >= 6) return 11;
    return 12.5;
  }, [card.word]);

  const rotate = rotation.interpolate({ inputRange: [-3, 3], outputRange: ['-3deg', '3deg'] });
  const identityScale = reveal.interpolate({ inputRange: [0, 0.55, 1], outputRange: [0.78, 1.045, 1] });
  return (
    <Animated.View style={{ width, transform: [{ translateX: shakeX }, { rotate }, { scale }] }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${card.word}${card.revealed ? '، مكشوفة' : ''}`}
        disabled={disabled || card.revealed}
        onPress={() => onPress(card.id)}
        style={({ pressed }) => [
          styles.card,
          { width, height: Math.max(50, width * 0.78) },
          (disabled || card.revealed) && !card.revealed && !card.type && styles.disabled,
          pressed && styles.pressed,
        ]}
      >
        <ArabicText
          weight="bold"
          numberOfLines={2}
          adjustsFontSizeToFit
          style={[styles.word, { fontSize }]}
        >
          {card.word}
        </ArabicText>

        <Animated.View
          pointerEvents="none"
          style={[
            styles.identity,
            { backgroundColor: identityColor, opacity: reveal, transform: [{ scale: identityScale }] },
          ]}
        >
          {card.type === 'ASSASSIN' ? <ArabicText style={styles.assassin}>✦</ArabicText> : null}
          <ArabicText
            weight="bold"
            numberOfLines={2}
            adjustsFontSizeToFit
            style={[styles.identityWord, { color: identityTextColor, fontSize }]}
          >
            {card.word}
          </ArabicText>
        </Animated.View>
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
  identity: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  word: { color: colors.ink, textAlign: 'center', writingDirection: 'rtl', lineHeight: 18 },
  identityWord: { textAlign: 'center', writingDirection: 'rtl', lineHeight: 18, textShadowColor: 'rgba(0,0,0,0.2)', textShadowRadius: 2, textShadowOffset: { width: 0, height: 1 } },
  assassin: { position: 'absolute', top: 1, left: 5, color: colors.gold, fontSize: 12 },
  disabled: { opacity: 0.68 },
  pressed: { opacity: 0.92 },
});
