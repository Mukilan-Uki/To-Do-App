import { colors } from './colors';

export const typography = {
  hero:      { fontSize: 34, fontWeight: '900', color: colors.foreground, letterSpacing: -1 },
  h1:        { fontSize: 28, fontWeight: '800', color: colors.foreground, letterSpacing: -0.5 },
  h2:        { fontSize: 22, fontWeight: '800', color: colors.foreground },
  h3:        { fontSize: 18, fontWeight: '700', color: colors.foreground },
  body:      { fontSize: 15, fontWeight: '500', color: colors.foreground, lineHeight: 22 },
  bodyMuted: { fontSize: 14, fontWeight: '500', color: colors.mutedForeground, lineHeight: 20 },
  caption:   { fontSize: 12, fontWeight: '600', color: colors.mutedForeground },
  micro:     { fontSize: 10, fontWeight: '700', color: colors.mutedForeground },
  brandDo:   { fontSize: 24, fontWeight: '900', color: colors.primaryDark },
  brandNow:  { fontSize: 24, fontWeight: '900', color: colors.primary },
};
