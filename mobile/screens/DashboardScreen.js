import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, ScrollView, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BrandHeader from '../components/BrandHeader';
import ProgressCard from '../components/ProgressCard';
import DoNowCard from '../components/DoNowCard';
import TaskRow from '../components/TaskRow';
import { useAuth } from '../context/AuthContext';
import { syncManager } from '../services/syncManager';
import { colors, spacing, radius } from '../theme/colors';
import { typography } from '../theme/typography';

const CATEGORY_COLORS = [colors.primary, colors.violet, colors.emerald, colors.amber, colors.pink];

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [tasks, setTasks]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [isOffline, setIsOffline]     = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = await syncManager.syncTasks();
      setTasks(data.allTasks || []);
      setIsOffline(data.isOffline);
    } catch (e) {
      console.warn('Dashboard load error:', e?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const pendingCount   = tasks.filter((t) => t.status !== 'completed').length;
  const projectCount   = tasks.filter((t) => t.type === 'project').length;

  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, 5);

  const grouped = tasks.reduce((acc, t) => {
    const cat = t.category || 'General';
    if (!acc[cat]) acc[cat] = { total: 0, done: 0 };
    acc[cat].total++;
    if (t.status === 'completed') acc[cat].done++;
    return acc;
  }, {});
  const categoryEntries = Object.entries(grouped).slice(0, 4);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
      >
        <View style={styles.inner}>
          <BrandHeader
            subtitle={`${greeting}, ${user?.name?.split(' ')[0] || 'there'} 👋`}
            right={
              isOffline ? (
                <View style={styles.offlineBadge}>
                  <Text style={styles.offlineText}>Offline</Text>
                </View>
              ) : null
            }
          />

          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
          ) : (
            <>
              <ProgressCard completedCount={completedCount} total={tasks.length} />

              <View style={styles.statsRow}>
                {[
                  { label: 'Pending',  value: pendingCount,   color: colors.amber },
                  { label: 'Done',     value: completedCount, color: colors.emerald },
                  { label: 'Projects', value: projectCount,   color: colors.violet },
                ].map((s) => (
                  <DoNowCard key={s.label} style={styles.statCard} variant="flat">
                    <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                    <Text style={styles.statLabel}>{s.label}</Text>
                  </DoNowCard>
                ))}
              </View>

              {categoryEntries.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Categories</Text>
                  <View style={styles.grid}>
                    {categoryEntries.map(([label, { total, done }], i) => (
                      <DoNowCard
                        key={label}
                        style={styles.groupCard}
                        accentDot={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
                        onPress={() => navigation.navigate('Tasks')}
                      >
                        <Text style={styles.groupLabel} numberOfLines={1}>{label}</Text>
                        <Text style={styles.groupCount}>{done}/{total} done</Text>
                        <View style={styles.miniTrack}>
                          <View style={[styles.miniFill, {
                            width: `${total > 0 ? Math.round((done / total) * 100) : 0}%`,
                            backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                          }]} />
                        </View>
                      </DoNowCard>
                    ))}
                  </View>
                </>
              )}

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Tasks</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Tasks')}>
                  <Text style={styles.link}>View all</Text>
                </TouchableOpacity>
              </View>

              {recentTasks.length === 0 ? (
                <DoNowCard>
                  <Text style={{ fontSize: 32, textAlign: 'center', marginBottom: spacing.sm }}>🎉</Text>
                  <Text style={[typography.bodyMuted, { textAlign: 'center' }]}>No tasks yet. Tap "My Tasks" to add one.</Text>
                </DoNowCard>
              ) : (
                recentTasks.map((task) => (
                  <TaskRow key={task._id} task={task} onPress={() => navigation.navigate('Tasks')} />
                ))
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, paddingBottom: spacing.xxl },
  inner:  { paddingHorizontal: spacing.lg, paddingTop: spacing.md },

  offlineBadge: { backgroundColor: colors.amber, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.full },
  offlineText:  { color: '#fff', fontSize: 11, fontWeight: '800' },

  statsRow:  { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  statCard:  { flex: 1, padding: spacing.md, alignItems: 'center', marginBottom: 0 },
  statValue: { fontSize: 28, fontWeight: '900' },
  statLabel: { ...typography.caption, marginTop: 4, textAlign: 'center' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md, marginTop: spacing.sm },
  sectionTitle:  { ...typography.h3, marginBottom: spacing.md },
  link:          { color: colors.primary, fontWeight: '700', fontSize: 13 },

  grid:       { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  groupCard:  { width: '48%', padding: spacing.md, marginBottom: 0 },
  groupLabel: { fontSize: 15, fontWeight: '800', color: colors.foreground, marginBottom: 2 },
  groupCount: { ...typography.caption, marginBottom: spacing.sm },
  miniTrack:  { height: 4, backgroundColor: colors.muted, borderRadius: 2, overflow: 'hidden' },
  miniFill:   { height: '100%', borderRadius: 2 },
});
