import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, radius } from '../theme/colors';

export default function DoNowCard({ children, onPress, style, accentDot, variant = 'default' }) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      onPress={onPress}
      activeOpacity={onPress ? 0.82 : 1}
      style={[styles.card, variant === 'flat' && styles.flat, style]}
    >
      {accentDot ? <View style={[styles.dot, { backgroundColor: accentDot }]} /> : null}
      {children}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: spacing.md,
    position: 'relative',
    overflow: 'hidden',
  },
  flat: {
    shadowOpacity: 0,
    elevation: 0,
    borderColor: colors.border,
  },
  dot: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 10,
    height: 10,
    borderRadius: radius.full,
  },
});
