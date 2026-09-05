import { Platform } from 'react-native';

export const spacing = Object.freeze({
  xs: 4,
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  xxl: 34,
});

export const radius = Object.freeze({
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
});

export const shadow = Platform.select({
  ios: {
    shadowColor: '#000000',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  android: { elevation: 7 },
  default: {},
});
