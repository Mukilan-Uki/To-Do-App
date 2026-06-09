import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../theme/colors';

export default function ProgressCard({ completedCount, total, streak = 0 }) {
  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  return (
    <View style={styles.card}>
      {/* Left: bar chart */}
      <View style={styles.left}>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { height: `${pct}%` }]} />
        </View>
      </View>

      {/* Center: main stat */}
      <View style={styles.center}>
        <Text style={styles.pct}>{pct}%</Text>
        <Text style={styles.label}>Completed</Text>
        <Text style={styles.sub}>{completedCount} of {total} tasks</Text>
      </View>

      {/* Right: streak */}
      <View style={styles.right}>
        <View style={styles.streakBox}>
          <Text style={styles.streakFire}>🔥</Text>
          <Text style={styles.streakNum}>{streak}</Text>
          <Text style={styles.streakLabel}>day streak</Text>
        </View>
        <View style={styles.decorDots}>
          <View style={[styles.decorDot, { backgroundColor: colors.emerald }]} />
          <View style={[styles.decorDot, { backgroundColor: '#fff', opacity: 0.4 }]} />
          <View style={[styles.decorDot, { backgroundColor: colors.amber }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primary,
    borderRadius: radius.xxl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
    minHeight: 150,
  },
  left: { alignItems: 'center', justifyContent: 'flex-end' },
  barTrack: {
    width: 14, height: 100,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 7,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 7,
    minHeight: 4,
  },

  center:  { flex: 1 },
  pct:     { fontSize: 48, fontWeight: '900', color: '#fff', lineHeight: 52 },
  label:   { fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.9)', marginTop: 2 },
  sub:     { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  right:      { alignItems: 'center', gap: spacing.sm },
  streakBox:  { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: radius.md, padding: spacing.sm, minWidth: 64 },
  streakFire: { fontSize: 22 },
  streakNum:  { fontSize: 22, fontWeight: '900', color: '#fff' },
  streakLabel:{ fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  decorDots:  { flexDirection: 'row', gap: 5 },
  decorDot:   { width: 10, height: 10, borderRadius: 5 },
});
