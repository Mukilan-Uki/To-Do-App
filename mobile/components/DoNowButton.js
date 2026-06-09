import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { colors, spacing, radius } from '../theme/colors';

export default function DoNowButton({ title, onPress, variant = 'primary', loading, disabled, style, icon }) {
  const isPrimary     = variant === 'primary';
  const isGhost       = variant === 'ghost';
  const isDestructive = variant === 'destructive';
  const isOutline     = variant === 'outline';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.82}
      style={[
        styles.base,
        isPrimary     && styles.primary,
        isGhost       && styles.ghost,
        isDestructive && styles.destructive,
        isOutline     && styles.outline,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={isPrimary || isDestructive ? '#fff' : colors.primary} />
      ) : (
        <View style={styles.row}>
          {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
          <Text style={[
            styles.text,
            isPrimary     && styles.textPrimary,
            isGhost       && styles.textGhost,
            isDestructive && styles.textDestructive,
            isOutline     && styles.textOutline,
          ]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    paddingVertical: 13,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  row:         { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconWrap:    { marginRight: 2 },
  primary: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 5,
  },
  ghost:       { backgroundColor: colors.muted },
  outline:     { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.border },
  destructive: { backgroundColor: colors.destructive },
  disabled:    { opacity: 0.5 },

  text:            { fontSize: 15, fontWeight: '700', letterSpacing: 0.1 },
  textPrimary:     { color: '#fff' },
  textGhost:       { color: colors.foreground },
  textOutline:     { color: colors.primary },
  textDestructive: { color: '#fff' },
});
