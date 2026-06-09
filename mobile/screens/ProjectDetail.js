import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import { taskAPI, getApiErrorMessage } from "../services/apiService";
import { colors, spacing, radius } from "../theme/colors";
import { typography } from "../theme/typography";
import DoNowCard from "../components/DoNowCard";
import DoNowButton from "../components/DoNowButton";
import CollaboratorModal from "../components/CollaboratorModal";
import ProjectEditModal from "../components/ProjectEditModal";

export default function ProjectDetail() {
  const route = useRoute();
  const navigation = useNavigation();
  const { id } = route.params || {};

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCollabModalOpen, setIsCollabModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await taskAPI.getTask(id);
      setTask(data);
    } catch (e) {
      Alert.alert("Error", getApiErrorMessage(e));
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) load();
  }, [id]);

  const handleDelete = async () => {
    Alert.alert("Delete project", `Delete "${task?.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            // enqueue delete for reliable handling
            const { syncQueue } = await import("../services/syncQueue");
            const isLocal = task.isLocal === true;
            await syncQueue.enqueueDeleteTask(task._id, { isLocal });
            navigation.navigate("Tasks");
          } catch (e) {
            Alert.alert("Error", getApiErrorMessage(e));
          }
        },
      },
    ]);
  };

  if (loading)
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );

  if (!task) return null;

  const completed = task.subtasks?.filter((s) => s.completed).length || 0;
  const total = task.subtasks?.length || 0;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.inner}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.link}>Back</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <DoNowButton
              title="Team"
              variant="ghost"
              onPress={() => setIsCollabModalOpen(true)}
              style={styles.smallBtn}
            />
            <DoNowButton
              title="Edit"
              variant="ghost"
              onPress={() => {
                setIsEditModalOpen(true);
              }}
              style={styles.smallBtn}
            />
            <DoNowButton
              title="Delete"
              variant="destructive"
              onPress={handleDelete}
              style={styles.smallBtn}
            />
          </View>

          <DoNowCard>
            <Text style={typography.h2}>{task.title}</Text>
            {task.description ? (
              <Text style={[typography.bodyMuted, { marginTop: spacing.sm }]}>
                {task.description}
              </Text>
            ) : null}

            <View style={{ marginTop: spacing.md }}>
              <Text style={typography.caption}>
                Progress: {task.progress || 0}%
              </Text>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${task.progress || 0}%` },
                  ]}
                />
              </View>
              <Text style={typography.caption}>
                {completed} of {total} subtasks done
              </Text>
            </View>

            {(task.collaborators?.length > 0 || task.owner) && (
              <View style={{ marginTop: spacing.md }}>
                <Text style={[typography.caption, { marginBottom: 6 }]}>
                  Members
                </Text>
                <View
                  style={{ flexDirection: "row", gap: 8, alignItems: "center" }}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {task.owner?.name?.charAt(0)?.toUpperCase() || "?"}
                    </Text>
                  </View>
                  {task.collaborators?.slice(0, 4).map((c) => (
                    <View key={c._id} style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {c.name?.charAt(0)?.toUpperCase() || "?"}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </DoNowCard>

          <View style={{ height: spacing.md }} />

          <Text style={typography.h3}>Subtasks</Text>
          {total === 0 ? (
            <DoNowCard style={{ marginTop: spacing.sm }}>
              <Text style={typography.bodyMuted}>No subtasks yet.</Text>
            </DoNowCard>
          ) : (
            task.subtasks.map((s) => (
              <View key={s._id} style={styles.subtaskRow}>
                <Text
                  style={s.completed ? styles.subtaskDone : styles.subtaskText}
                >
                  {s.title}
                </Text>
                <Text style={typography.caption}>
                  {s.completed ? "Done" : ""}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
      <CollaboratorModal
        isOpen={isCollabModalOpen}
        onClose={() => setIsCollabModalOpen(false)}
        task={task}
        onTaskSaved={(updated) => setTask(updated)}
      />
      <ProjectEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        task={task}
        onSaved={(updated) => setTask(updated)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: spacing.xl },
  inner: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  link: { color: colors.primary, fontWeight: "700" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  smallBtn: { marginLeft: 8 },
  progressTrack: {
    height: 8,
    backgroundColor: colors.muted,
    borderRadius: 8,
    overflow: "hidden",
    marginVertical: 6,
  },
  progressFill: { height: "100%", backgroundColor: colors.primary },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${colors.primary}22`,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.primary, fontWeight: "800" },
  subtaskRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  subtaskText: { color: colors.foreground },
  subtaskDone: {
    color: colors.mutedForeground,
    textDecorationLine: "line-through",
  },
});
