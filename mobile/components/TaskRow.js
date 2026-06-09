import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, radius } from '../theme/colors';
import { typography } from '../theme/typography';

const PRIORITY_COLORS = {
  High:   { bg: '#fef2f2', text: '#ef4444', dot: '#ef4444' },
  Medium: { bg: '#fffbeb', text: '#f59e0b', dot: '#f59e0b' },
  Low:    { bg: '#f0fdf4', text: '#10b981', dot: '#10b981' },
};

function getProgress(task) {
  if (task.type === 'project') {
    if (typeof task.progress === 'number') return task.progress;
    if (task.subtasks?.length) {
      const done = task.subtasks.filter((s) => s.completed).length;
      return Math.round((done / task.subtasks.length) * 100);
    }
  }
  return task.status === 'completed' ? 100 : 0;
}

export default function TaskRow({ task, onPress, onToggle, onDelete }) {
  const pct       = getProgress(task);
  const completed = task.status === 'completed' || pct >= 100;
  const pc        = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.Medium;

  return (
    <TouchableOpacity style={styles.row} onPress={onPress || onToggle} activeOpacity={0.82}>
      {/* Completion toggle */}
      <TouchableOpacity onPress={onToggle} style={[styles.check, completed && styles.checkDone]} activeOpacity={0.7}>
        {completed && <Text style={styles.checkMark}>✓</Text>}
      </TouchableOpacity>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.title, completed && styles.titleDone]} numberOfLines={2}>
          {task.title}
        </Text>

        <View style={styles.meta}>
          {/* Priority badge */}
          <View style={[styles.badge, { backgroundColor: pc.bg }]}>
            <View style={[styles.dot, { backgroundColor: pc.dot }]} />
            <Text style={[styles.badgeText, { color: pc.text }]}>{task.priority || 'Medium'}</Text>
          </View>

          {/* Category */}
          <View style={styles.badgeMuted}>
            <Text style={styles.badgeMutedText} numberOfLines={1}>{task.category || 'General'}</Text>
          </View>

          {/* Type badges */}
          {task.type === 'project' && (
            <View style={[styles.badge, { backgroundColor: '#ede9fe' }]}>
              <Text style={[styles.badgeText, { color: colors.violet }]}>Project</Text>
            </View>
          )}
          {task.isLocal && (
            <View style={[styles.badge, { backgroundColor: colors.amberBg }]}>
              <Text style={[styles.badgeText, { color: colors.amber }]}>Offline</Text>
            </View>
          )}
        </View>

        {/* Progress bar for projects */}
        {task.type === 'project' && task.subtasks?.length > 0 && (
          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: pct >= 100 ? colors.emerald : colors.primary }]} />
            </View>
            <Text style={styles.progressLabel}>{pct}%</Text>
          </View>
        )}

        {/* Due date */}
        {task.dueDate && (
          <Text style={[styles.due, new Date(task.dueDate) < new Date() && !completed && styles.dueOverdue]}>
            Due {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </Text>
        )}
      </View>

      {/* Delete */}
      {onDelete ? (
        <TouchableOpacity onPress={onDelete} hitSlop={10} style={styles.deleteBtn}>
          <Text style={styles.deleteText}>×</Text>
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
    gap: spacing.sm,
  },
  check: {
    width: 24, height: 24, borderRadius: radius.xs,
    borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 1, flexShrink: 0,
    backgroundColor: colors.card,
  },
  checkDone:  { backgroundColor: colors.primary, borderColor: colors.primary },
  checkMark:  { color: '#fff', fontSize: 13, fontWeight: '900' },

  content: { flex: 1, minWidth: 0 },
  title:    { fontSize: 15, fontWeight: '700', color: colors.foreground, lineHeight: 20, marginBottom: 6 },
  titleDone: { textDecorationLine: 'line-through', color: colors.mutedForeground },

  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },

  badge:         { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  badgeText:     { fontSize: 10, fontWeight: '700' },
  dot:           { width: 6, height: 6, borderRadius: 3 },
  badgeMuted:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full, backgroundColor: colors.muted },
  badgeMutedText:{ fontSize: 10, fontWeight: '600', color: colors.mutedForeground },

  progressWrap:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  progressTrack: { flex: 1, height: 4, backgroundColor: colors.muted, borderRadius: 2, overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 2 },
  progressLabel: { fontSize: 10, fontWeight: '700', color: colors.mutedForeground, width: 28, textAlign: 'right' },

  due:        { fontSize: 11, fontWeight: '600', color: colors.mutedForeground, marginTop: 4 },
  dueOverdue: { color: colors.destructive },

  deleteBtn:  { padding: 4, marginLeft: 2 },
  deleteText: { fontSize: 22, color: colors.mutedForeground, lineHeight: 22 },
});
