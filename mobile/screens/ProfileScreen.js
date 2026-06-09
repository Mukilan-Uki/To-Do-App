import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BrandHeader from '../components/BrandHeader';
import DoNowCard from '../components/DoNowCard';
import DoNowButton from '../components/DoNowButton';
import { useAuth } from '../context/AuthContext';
import { taskAPI } from '../services/apiService';
import { API_URL } from '../config/constants';
import { colors, spacing, radius } from '../theme/colors';
import { typography } from '../theme/typography';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [tasks, setTasks]   = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await taskAPI.getTasks();
        setTasks(data || []);
      } catch {}
      setLoaded(true);
    })();
  }, []);

  const handleLogout = () => {
    Alert.alert('Log out', 'Sign out of Do(es)?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: logout },
    ]);
  };

  const total     = tasks.length;
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const pending   = tasks.filter((t) => t.status !== 'completed').length;
  const pct       = total > 0 ? Math.round((completed / total) * 100) : 0;

  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Recently joined';

  const stats = [
    { label: 'Total Tasks', value: total,     color: colors.primary },
    { label: 'Completed',   value: completed, color: colors.emerald },
    { label: 'Pending',     value: pending,   color: colors.amber },
    { label: 'Productivity',value: `${pct}%`, color: colors.violet },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.inner}>
          <BrandHeader subtitle="Profile" />

          {/* Avatar + Info */}
          <DoNowCard style={styles.profileCard}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || '?'}</Text>
              </View>
              <View style={[styles.avatarBadge, { backgroundColor: colors.emeraldBg }]}>
                <Text style={[styles.avatarBadgeText, { color: colors.emerald }]}>●</Text>
              </View>
            </View>
            <Text style={styles.name}>{user?.name}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            <View style={styles.rolePill}>
              <Text style={styles.rolePillText}>{user?.role || 'user'}</Text>
            </View>
            <Text style={styles.joined}>Joined {joinedDate}</Text>
          </DoNowCard>

          {/* Stats grid */}
          <View style={styles.statsGrid}>
            {stats.map((s) => (
              <DoNowCard key={s.label} style={styles.statCard} variant="flat">
                <Text style={[styles.statValue, { color: s.color }]}>{loaded ? s.value : '—'}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </DoNowCard>
            ))}
          </View>

          {/* Productivity bar */}
          {loaded && total > 0 && (
            <DoNowCard>
              <View style={styles.prodHeader}>
                <Text style={typography.h3}>Productivity</Text>
                <Text style={[styles.prodPct, { color: colors.primary }]}>{pct}%</Text>
              </View>
              <View style={styles.prodTrack}>
                <View style={[styles.prodFill, { width: `${pct}%` }]} />
              </View>
              <Text style={typography.caption}>{completed} of {total} tasks completed</Text>
            </DoNowCard>
          )}

          {/* Info card */}
          <DoNowCard style={styles.infoCard}>
            <Text style={styles.infoTitle}>App Info</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>API endpoint</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{API_URL}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Version</Text>
              <Text style={styles.infoValue}>1.0.0</Text>
            </View>
          </DoNowCard>

          <DoNowButton title="Log Out" variant="destructive" onPress={handleLogout} style={styles.logout} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, paddingBottom: spacing.xxl },
  inner:  { paddingHorizontal: spacing.lg, paddingTop: spacing.md },

  profileCard: { alignItems: 'center', paddingVertical: spacing.xl },
  avatarWrap:  { position: 'relative', marginBottom: spacing.md },
  avatar: {
    width: 84, height: 84, borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  avatarText:     { color: '#fff', fontSize: 36, fontWeight: '900' },
  avatarBadge:    { position: 'absolute', bottom: -2, right: -2, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.card },
  avatarBadgeText:{ fontSize: 10 },

  name:         { ...typography.h2, marginBottom: spacing.xs },
  email:        { ...typography.bodyMuted, marginBottom: spacing.sm },
  rolePill:     { paddingHorizontal: spacing.md, paddingVertical: 5, backgroundColor: `${colors.primary}15`, borderRadius: radius.full, marginBottom: spacing.sm },
  rolePillText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  joined:       { ...typography.caption },

  statsGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  statCard:   { width: '48%', padding: spacing.md, alignItems: 'center', flexShrink: 0 },
  statValue:  { fontSize: 28, fontWeight: '900' },
  statLabel:  { ...typography.caption, textAlign: 'center', marginTop: 4 },

  prodHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  prodPct:    { fontSize: 22, fontWeight: '900' },
  prodTrack:  { height: 10, backgroundColor: colors.muted, borderRadius: 5, overflow: 'hidden', marginBottom: spacing.sm },
  prodFill:   { height: '100%', backgroundColor: colors.primary, borderRadius: 5 },

  infoCard:   { marginBottom: spacing.md },
  infoTitle:  { ...typography.h3, marginBottom: spacing.md },
  infoRow:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  infoLabel:  { ...typography.caption },
  infoValue:  { fontSize: 12, fontWeight: '600', color: colors.foreground, maxWidth: '60%', textAlign: 'right' },

  logout:     { marginTop: spacing.sm },
});
