import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';

const families = {
  regular: 'Tajawal_400Regular',
  medium: 'Tajawal_500Medium',
  bold: 'Tajawal_700Bold',
  extraBold: 'Tajawal_800ExtraBold',
};

export function ArabicText({ weight = 'regular', style, children, ...props }) {
  return (
    <Text {...props} style={[styles.base, { fontFamily: families[weight] || families.regular }, style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    color: colors.paper,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
});
