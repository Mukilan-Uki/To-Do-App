import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { ScrollView } from "react-native";
import BrandHeader from "../components/BrandHeader";
import DoNowCard from "../components/DoNowCard";
import TaskRow from "../components/TaskRow";
import DoNowButton from "../components/DoNowButton";
import { taskAPI, getApiErrorMessage } from "../services/apiService";
import { colors, spacing, radius } from "../theme/colors";
import { typography } from "../theme/typography";

export default function CollaborativeTasksScreen() {
  const [projects, setProjects] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [invLoading, setInvLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("projects"); // projects | invitations

  const loadData = useCallback(async () => {
    try {
      setError("");
      const { data } = await taskAPI.getTasks();
      setProjects((data || []).filter((t) => t.type === "project"));

      // Load invitations
      try {
        const { data: inv } = await taskAPI.getInvitations();
        setInvitations(inv || []);
      } catch {}
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const handleInvitation = async (taskId, taskTitle, accept) => {
    setInvLoading(true);
    try {
      await taskAPI.respondToInvitation(taskId, accept);
      Alert.alert(
        accept ? "🎉 Joined!" : "Declined",
        accept ? `You joined "${taskTitle}"` : `You declined the invitation`,
      );
      loadData();
    } catch (e) {
      Alert.alert("Error", getApiErrorMessage(e));
    } finally {
      setInvLoading(false);
    }
  };

  const invCount = invitations.length;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          loadData();
        }}
      >
        <View style={styles.inner}>
          <BrandHeader subtitle="Projects & Collaboration" />

          {/* Tab bar */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              onPress={() => setTab("projects")}
              style={[styles.tabBtn, tab === "projects" && styles.tabBtnActive]}
            >
              <Text
                style={[
                  styles.tabText,
                  tab === "projects" && styles.tabTextActive,
                ]}
              >
                Projects
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setTab("invitations")}
              style={[
                styles.tabBtn,
                tab === "invitations" && styles.tabBtnActive,
              ]}
            >
              <View style={styles.tabRow}>
                <Text
                  style={[
                    styles.tabText,
                    tab === "invitations" && styles.tabTextActive,
                  ]}
                >
                  Invitations
                </Text>
                {invCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{invCount}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={{ marginTop: spacing.xl }}
            />
          ) : error ? (
            <DoNowCard style={styles.errorCard}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
              <DoNowButton
                title="Retry"
                variant="ghost"
                onPress={loadData}
                style={{ marginTop: spacing.md }}
              />
            </DoNowCard>
          ) : tab === "projects" ? (
            projects.length === 0 ? (
              <DoNowCard>
                <Text style={styles.emptyIcon}>🗂️</Text>
                <Text
                  style={[
                    typography.h3,
                    { textAlign: "center", marginBottom: spacing.xs },
                  ]}
                >
                  No projects yet
                </Text>
                <Text style={[typography.bodyMuted, { textAlign: "center" }]}>
                  Create a project on the web app or ask AI to create one.
                </Text>
              </DoNowCard>
            ) : (
              projects.map((project) => (
                <View key={project._id} style={styles.projectBlock}>
                  <TaskRow
                    task={project}
                    onPress={() =>
                      navigation.navigate("ProjectDetail", { id: project._id })
                    }
                  />
                  <View style={styles.projectMeta}>
                    <View style={styles.metaPill}>
                      <Text style={styles.metaPillText}>
                        👥 {project.collaborators?.length || 0} collaborator
                        {project.collaborators?.length !== 1 ? "s" : ""}
                      </Text>
                    </View>
                    <View style={styles.metaPill}>
                      <Text style={styles.metaPillText}>
                        📋{" "}
                        {project.subtasks?.filter((s) => s.completed).length ||
                          0}
                        /{project.subtasks?.length || 0} subtasks
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )
          ) : // Invitations tab
          invitations.length === 0 ? (
            <DoNowCard>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text
                style={[
                  typography.h3,
                  { textAlign: "center", marginBottom: spacing.xs },
                ]}
              >
                No invitations
              </Text>
              <Text style={[typography.bodyMuted, { textAlign: "center" }]}>
                When someone invites you to a task, it will appear here.
              </Text>
            </DoNowCard>
          ) : (
            invitations.map((inv) => (
              <DoNowCard key={inv.taskId} style={styles.invCard}>
                <View style={styles.invHeader}>
                  <View style={styles.invAvatar}>
                    <Text style={styles.invAvatarText}>
                      {inv.invitedBy?.name?.charAt(0)?.toUpperCase() || "?"}
                    </Text>
                  </View>
                  <View style={styles.invInfo}>
                    <Text style={styles.invFrom}>
                      <Text style={{ color: colors.primary }}>
                        {inv.invitedBy?.name}
                      </Text>
                      {" invited you"}
                    </Text>
                    <Text style={styles.invTask} numberOfLines={1}>
                      {inv.taskTitle}
                    </Text>
                    <Text style={styles.invDate}>
                      {new Date(inv.invitedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </Text>
                  </View>
                </View>
                <View style={styles.invActions}>
                  <DoNowButton
                    title="Decline"
                    variant="ghost"
                    onPress={() =>
                      handleInvitation(inv.taskId, inv.taskTitle, false)
                    }
                    loading={invLoading}
                    style={styles.invBtn}
                  />
                  <DoNowButton
                    title="✓ Accept"
                    onPress={() =>
                      handleInvitation(inv.taskId, inv.taskTitle, true)
                    }
                    loading={invLoading}
                    style={styles.invBtn}
                  />
                </View>
              </DoNowCard>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, paddingBottom: spacing.xxl },
  inner: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },

  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.muted,
    borderRadius: radius.lg,
    padding: 4,
    marginBottom: spacing.lg,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    borderRadius: radius.md,
  },
  tabBtnActive: {
    backgroundColor: colors.card,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tabRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  tabText: { fontSize: 13, fontWeight: "700", color: colors.mutedForeground },
  tabTextActive: { color: colors.primary },
  badge: {
    backgroundColor: colors.destructive,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },

  errorCard: { backgroundColor: colors.destructiveBg },
  errorText: { fontSize: 14, color: colors.destructive, fontWeight: "600" },

  emptyIcon: { fontSize: 40, textAlign: "center", marginBottom: spacing.md },

  projectBlock: { marginBottom: spacing.xs },
  projectMeta: {
    flexDirection: "row",
    gap: spacing.xs,
    paddingLeft: spacing.sm,
    marginBottom: spacing.md,
  },
  metaPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.muted,
    borderRadius: radius.full,
  },
  metaPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.mutedForeground,
  },

  invCard: { marginBottom: spacing.md },
  invHeader: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  invAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${colors.primary}20`,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  invAvatarText: { fontSize: 18, fontWeight: "900", color: colors.primary },
  invInfo: { flex: 1 },
  invFrom: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.foreground,
    marginBottom: 2,
  },
  invTask: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.foreground,
    marginBottom: 2,
  },
  invDate: { fontSize: 11, color: colors.mutedForeground },
  invActions: { flexDirection: "row", gap: spacing.sm },
  invBtn: { flex: 1, paddingVertical: 10 },
});
