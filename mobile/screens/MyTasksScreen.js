import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import BrandHeader from "../components/BrandHeader";
import DoNowButton from "../components/DoNowButton";
import TaskRow from "../components/TaskRow";
import DoNowCard from "../components/DoNowCard";
import { taskAPI, getApiErrorMessage } from "../services/apiService";
import { localTaskService } from "../services/localStorageService";
import { syncQueue } from "../services/syncQueue";
import { colors, spacing, radius } from "../theme/colors";
import { typography } from "../theme/typography";

const PRIORITIES = ["Low", "Medium", "High"];
const FILTER_OPTS = ["All", "pending", "in-progress", "completed"];

export default function MyTasksScreen() {
  const [onlineTasks, setOnlineTasks] = useState([]);
  const [offlineTasks, setOfflineTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Add task modal
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState("Medium");
  const [newCategory, setNewCategory] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // Filter/search
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [mode, setMode] = useState("online"); // online | offline

  const load = useCallback(async () => {
    const local = await localTaskService.getTasks();
    setOfflineTasks(local);
    try {
      const { data } = await taskAPI.getTasks();
      setOnlineTasks(data || []);
      setIsOffline(false);
    } catch (e) {
      setIsOffline(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const addTask = async () => {
    if (!newTitle.trim()) return;
    // Duplicate check
    const existing = mode === "offline" ? offlineTasks : onlineTasks;
    const dup = existing.some(
      (t) => t.title.trim().toLowerCase() === newTitle.trim().toLowerCase(),
    );
    if (dup) {
      Alert.alert("Duplicate", "A task with this name already exists.");
      return;
    }
    setAddLoading(true);
    try {
      if (mode === "offline") {
        const local = await localTaskService.createTask({
          title: newTitle.trim(),
          status: "pending",
          priority: newPriority,
          category: newCategory || "Personal",
        });
        // enqueue create for background sync
        await syncQueue.enqueueCreateTask(local);
      } else {
        // online: try direct create; if it fails, fall back to enqueue
        try {
          await taskAPI.createTask({
            title: newTitle.trim(),
            priority: newPriority,
            category: newCategory || "General",
            type: "simple",
          });
        } catch (e) {
          // fallback to local + queue
          const local = await localTaskService.createTask({
            title: newTitle.trim(),
            status: "pending",
            priority: newPriority,
            category: newCategory || "Personal",
          });
          await syncQueue.enqueueCreateTask(local);
        }
      }
      setNewTitle("");
      setNewCategory("");
      setNewPriority("Medium");
      setShowAdd(false);
      load();
    } catch (e) {
      Alert.alert("Error", getApiErrorMessage(e));
    } finally {
      setAddLoading(false);
    }
  };

  const toggleTask = async (task) => {
    const next = task.status === "completed" ? "pending" : "completed";
    try {
      if (task.isLocal)
        await localTaskService.updateTask(task._id, { status: next });
      else await taskAPI.updateTask(task._id, { status: next });
      load();
    } catch (e) {
      Alert.alert("Error", getApiErrorMessage(e));
    }
  };

  const deleteTask = (task) => {
    Alert.alert("Delete task", `Remove "${task.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            if (task.isLocal) {
              // local delete and enqueue (will be a no-op on server)
              await syncQueue.enqueueDeleteTask(task._id, { isLocal: true });
            } else {
              // enqueue server delete; optimistic UI: reload
              await syncQueue.enqueueDeleteTask(task._id, { isLocal: false });
            }
            // refresh lists immediately for responsive UI
            load();
          } catch (e) {
            Alert.alert("Error", getApiErrorMessage(e));
          }
        },
      },
    ]);
  };

  const allTasks = mode === "offline" ? offlineTasks : onlineTasks;
  const filtered = allTasks
    .filter((t) => filter === "All" || t.status === filter)
    .filter(
      (t) => !search || t.title.toLowerCase().includes(search.toLowerCase()),
    );

  const doneCount = allTasks.filter((t) => t.status === "completed").length;
  const pendingCount = allTasks.filter((t) => t.status !== "completed").length;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inner}>
          <BrandHeader subtitle="My Tasks" />

          {/* Mode toggle */}
          <View style={styles.modeRow}>
            {["online", "offline"].map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => setMode(m)}
                style={[styles.modeBtn, mode === m && styles.modeBtnActive]}
              >
                <Text
                  style={[
                    styles.modeBtnText,
                    mode === m && styles.modeBtnTextActive,
                  ]}
                >
                  {m === "online" ? "☁️ Online" : "📱 Offline"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Offline warning */}
          {isOffline && mode === "online" && (
            <View style={styles.warnBanner}>
              <Text style={styles.warnText}>
                ⚠️ Server unreachable — switch to Offline or check your
                connection.
              </Text>
            </View>
          )}

          {/* Stats pills */}
          <View style={styles.statsRow}>
            <View style={[styles.pill, { backgroundColor: colors.amberBg }]}>
              <Text style={[styles.pillNum, { color: colors.amber }]}>
                {pendingCount}
              </Text>
              <Text style={[styles.pillLabel, { color: colors.amber }]}>
                Pending
              </Text>
            </View>
            <View style={[styles.pill, { backgroundColor: colors.emeraldBg }]}>
              <Text style={[styles.pillNum, { color: colors.emerald }]}>
                {doneCount}
              </Text>
              <Text style={[styles.pillLabel, { color: colors.emerald }]}>
                Done
              </Text>
            </View>
            <View style={[styles.pill, { backgroundColor: colors.muted }]}>
              <Text style={[styles.pillNum, { color: colors.mutedForeground }]}>
                {allTasks.length}
              </Text>
              <Text
                style={[styles.pillLabel, { color: colors.mutedForeground }]}
              >
                Total
              </Text>
            </View>
          </View>

          {/* Search */}
          <View style={styles.searchWrap}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search tasks..."
              placeholderTextColor={colors.mutedForeground}
              value={search}
              onChangeText={setSearch}
            />
            {search ? (
              <TouchableOpacity
                onPress={() => setSearch("")}
                style={styles.clearBtn}
              >
                <Text style={styles.clearText}>×</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Filter chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterRow}
            contentContainerStyle={{ gap: spacing.sm }}
          >
            {FILTER_OPTS.map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                style={[styles.chip, filter === f && styles.chipActive]}
              >
                <Text
                  style={[
                    styles.chipText,
                    filter === f && styles.chipTextActive,
                  ]}
                >
                  {f === "All" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Add button */}
          <DoNowButton
            title="+ Add Task"
            onPress={() => setShowAdd(true)}
            style={styles.addBtn}
          />

          {/* Task list */}
          {loading ? (
            <ActivityIndicator
              color={colors.primary}
              style={{ marginTop: spacing.xl }}
            />
          ) : filtered.length === 0 ? (
            <DoNowCard>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text
                style={[
                  typography.h3,
                  { textAlign: "center", marginBottom: spacing.xs },
                ]}
              >
                {search ? "No matching tasks" : "No tasks yet"}
              </Text>
              <Text style={[typography.bodyMuted, { textAlign: "center" }]}>
                {search
                  ? "Try a different search"
                  : 'Tap "+ Add Task" to create your first task'}
              </Text>
            </DoNowCard>
          ) : (
            filtered.map((task) => (
              <TaskRow
                key={task._id}
                task={task}
                onToggle={() => toggleTask(task)}
                onPress={() => toggleTask(task)}
                onDelete={() => deleteTask(task)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Add Task Modal */}
      <Modal
        visible={showAdd}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAdd(false)}
      >
        <SafeAreaView style={styles.modal}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.flex}
          >
            <ScrollView
              contentContainerStyle={styles.modalScroll}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.modalHeader}>
                <Text style={typography.h2}>New Task</Text>
                <TouchableOpacity
                  onPress={() => setShowAdd(false)}
                  style={styles.closeBtn}
                >
                  <Text style={styles.closeText}>×</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Title *</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Task title..."
                  placeholderTextColor={colors.mutedForeground}
                  value={newTitle}
                  onChangeText={setNewTitle}
                  autoFocus
                />
              </View>

              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Category</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="e.g. Work, Personal..."
                  placeholderTextColor={colors.mutedForeground}
                  value={newCategory}
                  onChangeText={setNewCategory}
                />
              </View>

              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Priority</Text>
                <View style={styles.priorityRow}>
                  {PRIORITIES.map((p) => {
                    const active = newPriority === p;
                    const bgMap = {
                      High: "#fef2f2",
                      Medium: "#fffbeb",
                      Low: "#f0fdf4",
                    };
                    const clrMap = {
                      High: colors.destructive,
                      Medium: colors.amber,
                      Low: colors.emerald,
                    };
                    return (
                      <TouchableOpacity
                        key={p}
                        onPress={() => setNewPriority(p)}
                        style={[
                          styles.priorityBtn,
                          active && {
                            backgroundColor: bgMap[p],
                            borderColor: clrMap[p],
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.priorityBtnText,
                            active && { color: clrMap[p], fontWeight: "800" },
                          ]}
                        >
                          {p}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.modalActions}>
                <DoNowButton
                  title="Cancel"
                  variant="ghost"
                  onPress={() => setShowAdd(false)}
                  style={styles.modalBtn}
                />
                <DoNowButton
                  title="Create Task"
                  onPress={addTask}
                  loading={addLoading}
                  style={styles.modalBtn}
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: spacing.xxl },
  inner: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },

  modeRow: {
    flexDirection: "row",
    backgroundColor: colors.muted,
    borderRadius: radius.lg,
    padding: 4,
    marginBottom: spacing.md,
    gap: 4,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    borderRadius: radius.md,
  },
  modeBtnActive: {
    backgroundColor: colors.card,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  modeBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.mutedForeground,
  },
  modeBtnTextActive: { color: colors.primary },

  warnBanner: {
    backgroundColor: colors.amberBg,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.amber,
  },
  warnText: { fontSize: 13, color: colors.amber, fontWeight: "600" },

  statsRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  pill: {
    flex: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: "center",
  },
  pillNum: { fontSize: 22, fontWeight: "900" },
  pillLabel: { fontSize: 10, fontWeight: "700", marginTop: 2 },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    height: 48,
  },
  searchIcon: { fontSize: 16, marginRight: spacing.xs },
  searchInput: { flex: 1, fontSize: 15, color: colors.foreground },
  clearBtn: { padding: 4 },
  clearText: { fontSize: 20, color: colors.mutedForeground, lineHeight: 20 },

  filterRow: { marginBottom: spacing.md },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: "600", color: colors.mutedForeground },
  chipTextActive: { color: "#fff" },

  addBtn: { marginBottom: spacing.lg },

  emptyIcon: { fontSize: 40, textAlign: "center", marginBottom: spacing.md },

  // Modal
  modal: { flex: 1, backgroundColor: colors.background },
  modalScroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: { fontSize: 22, color: colors.foreground, lineHeight: 22 },

  fieldWrap: { marginBottom: spacing.lg },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  fieldInput: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    fontSize: 15,
    color: colors.foreground,
  },

  priorityRow: { flexDirection: "row", gap: spacing.sm },
  priorityBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: radius.md,
    backgroundColor: colors.muted,
    borderWidth: 1.5,
    borderColor: "transparent",
    alignItems: "center",
  },
  priorityBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.mutedForeground,
  },

  modalActions: { flexDirection: "row", gap: spacing.sm },
  modalBtn: { flex: 1 },
});
