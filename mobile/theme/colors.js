export const colors = Object.freeze({
  ink: '#08121F',
  inkSoft: '#102238',
  panel: '#14283E',
  panelRaised: '#1B334D',
  paper: '#FFF8E8',
  paperMuted: '#E6DCC9',
  white: '#FFFFFF',
  red: '#E84A5F',
  redDark: '#A8223A',
  redSoft: '#FFD8DE',
  blue: '#3284D6',
  blueDark: '#15528F',
  blueSoft: '#D7EBFF',
  gold: '#F5C451',
  goldDark: '#A5720B',
  neutral: '#C7BCA7',
  neutralDark: '#726858',
  assassin: '#1C1B22',
  success: '#44C28D',
  danger: '#FF6B6B',
  muted: '#8FA2B7',
  line: 'rgba(255,255,255,0.12)',
  shadow: '#000000',
  overlay: 'rgba(3, 9, 16, 0.82)',
});

export const teamColor = (team) => (team === 'RED' ? colors.red : colors.blue);
export const cardColor = (type) => ({
  RED: colors.red,
  BLUE: colors.blue,
  NEUTRAL: colors.neutralDark,
  ASSASSIN: colors.assassin,
}[type] || colors.paper);
