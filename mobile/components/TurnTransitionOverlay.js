import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { gsap } from 'gsap';
import { ArabicText } from './ArabicText';
import { TEAM_LABEL } from '../constants/game';
import { soundService } from '../services/sounds';
import { colors, teamColor } from '../theme/colors';
import { radius, shadow, spacing } from '../theme/layout';

export function TurnTransitionOverlay({ team }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!team) return undefined;
    const driver = { value: 0 };
    const sync = () => progress.setValue(driver.value);
    progress.setValue(0);
    soundService.play('turn');
    const timeline = gsap.timeline();
    timeline
      .to(driver, { value: 1, duration: 0.46, ease: 'back.out(1.8)', onUpdate: sync })
      .to(driver, { value: 1, duration: 0.82 })
      .to(driver, { value: 0, duration: 0.34, ease: 'power2.in', onUpdate: sync });
    return () => timeline.kill();
  }, [progress, team]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [-90, 0] });
  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] });
  return (
    <View pointerEvents="none" style={styles.overlay}>
      <Animated.View
        style={[
          styles.panel,
          {
            backgroundColor: teamColor(team),
            opacity: progress,
            transform: [{ translateY }, { scale }],
          },
        ]}
      >
        <View style={styles.pulse} />
        <ArabicText style={styles.caption}>استعدوا</ArabicText>
        <ArabicText weight="extraBold" style={styles.title}>دور {TEAM_LABEL[team] || 'الفريق'}</ArabicText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', zIndex: 50, elevation: 20, top: 64, right: spacing.md, left: spacing.md, alignItems: 'center' },
  panel: { width: '100%', maxWidth: 430, minHeight: 92, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderRadius: radius.lg, borderWidth: 2, borderColor: 'rgba(255,255,255,0.45)', ...shadow },
  pulse: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.1)' },
  caption: { color: 'rgba(255,255,255,0.78)', fontSize: 12 },
  title: { color: colors.white, fontSize: 25, textAlign: 'center' },
});
