import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../theme/colors';
import { typography } from '../theme/typography';

export default function BrandHeader({ subtitle, right }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.logoRow}>
        <View style={styles.logoBox}>
          <Text style={styles.logoLetter}>D</Text>
        </View>
        <View style={styles.textCol}>
          <View style={styles.brandRow}>
            <Text style={typography.brandDo}>Do</Text>
            <Text style={typography.brandNow}>(es)</Text>
          </View>
          {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
        </View>
      </View>
      {right ? <View>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  logoRow:   { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  textCol:   { flex: 1 },
  logoBox:   {
    width: 42, height: 42, borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoLetter: { color: '#fff', fontSize: 20, fontWeight: '900' },
  brandRow:   { flexDirection: 'row', alignItems: 'baseline' },
  subtitle:   { fontSize: 12, fontWeight: '600', color: colors.mutedForeground, marginTop: 1 },
});
