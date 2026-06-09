import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import BrandHeader from '../components/BrandHeader';
import DoNowButton from '../components/DoNowButton';
import TaskRow from '../components/TaskRow';
import DoNowCard from '../components/DoNowCard';
import { localTaskService } from '../services/localStorageService';
import { colors, spacing, radius } from '../theme/colors';
import { typography } from '../theme/typography';

/** Offline-only personal tasks — preserved feature, web-matched styling */
export default function PersonalTasksScreen() {
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const loadTasks = async () => {
    setTasks(await localTaskService.getTasks());
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const addTask = async () => {
    if (!newTaskTitle.trim()) return;
    await localTaskService.createTask({
      title: newTaskTitle.trim(),
      status: 'pending',
      priority: 'Medium',
      category: 'Personal',
    });
    setNewTaskTitle('');
    loadTasks();
  };

  const toggleTask = async (task) => {
    await localTaskService.updateTask(task._id, {
      status: task.status === 'completed' ? 'pending' : 'completed',
    });
    loadTasks();
  };

  const deleteTask = async (id) => {
    await localTaskService.deleteTask(id);
    loadTasks();
  };

  return (
    <ScreenContainer>
      <BrandHeader subtitle="Offline personal tasks" />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="New personal task..."
          placeholderTextColor={colors.mutedForeground}
          value={newTaskTitle}
          onChangeText={setNewTaskTitle}
          onSubmitEditing={addTask}
        />
        <DoNowButton title="Add" onPress={addTask} style={styles.addBtn} />
      </View>
      {tasks.length === 0 ? (
        <DoNowCard>
          <Text style={typography.bodyMuted}>No personal offline tasks yet.</Text>
        </DoNowCard>
      ) : (
        tasks.map((item) => (
          <TaskRow
            key={item._id}
            task={item}
            onToggle={() => toggleTask(item)}
            onPress={() => toggleTask(item)}
            onDelete={() => deleteTask(item._id)}
          />
        ))
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  inputRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.foreground,
  },
  addBtn: { paddingHorizontal: spacing.lg },
});
