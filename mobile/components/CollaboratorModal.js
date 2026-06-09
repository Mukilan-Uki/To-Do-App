import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  FlatList,
} from "react-native";
import DoNowButton from "./DoNowButton";
import { colors, spacing, radius } from "../theme/colors";
import { typography } from "../theme/typography";
import { taskAPI, getApiErrorMessage } from "../services/apiService";

export default function CollaboratorModal({
  isOpen,
  onClose,
  task,
  onTaskSaved,
}) {
  const [invite, setInvite] = useState("");
  const [loading, setLoading] = useState(false);

  if (!task) return null;

  const sendInvite = async () => {
    if (!invite.trim()) return Alert.alert("Enter email or username");
    setLoading(true);
    try {
      const { data } = await taskAPI.addCollaborator(task._id, invite.trim());
      onTaskSaved && onTaskSaved(data);
      setInvite("");
    } catch (e) {
      Alert.alert("Error", getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const remove = (collabId) => {
    Alert.alert("Remove collaborator", "Remove this collaborator?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            const { data } = await taskAPI.removeCollaborator(
              task._id,
              collabId,
            );
            onTaskSaved && onTaskSaved(data);
          } catch (e) {
            Alert.alert("Error", getApiErrorMessage(e));
          }
        },
      },
    ]);
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <View style={styles.safe}>
        <View style={styles.header}>
          <Text style={typography.h2}>Team</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.close}>Close</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={[typography.caption, { marginBottom: spacing.sm }]}>
            Invite by email or username
          </Text>
          <View
            style={{ flexDirection: "row", gap: 8, marginBottom: spacing.md }}
          >
            <TextInput
              placeholder="email or username"
              value={invite}
              onChangeText={setInvite}
              style={styles.input}
              autoCapitalize="none"
            />
            <DoNowButton
              title="Invite"
              onPress={sendInvite}
              loading={loading}
            />
          </View>

          <Text style={[typography.h3, { marginBottom: spacing.sm }]}>
            Members
          </Text>
          <FlatList
            data={[
              ...(task.owner
                ? [
                    {
                      _id: "owner",
                      name: task.owner?.name || "Owner",
                      owner: true,
                    },
                  ]
                : []),
              ...(task.collaborators || []),
            ]}
            keyExtractor={(i) => i._id}
            renderItem={({ item }) => (
              <View style={styles.memberRow}>
                <Text style={styles.memberName}>
                  {item.name || item.email || "Unknown"}
                </Text>
                {!item.owner && (
                  <DoNowButton
                    title="Remove"
                    variant="ghost"
                    onPress={() => remove(item._id)}
                    style={styles.removeBtn}
                  />
                )}
              </View>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, padding: spacing.lg, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  close: { color: colors.primary, fontWeight: "700" },
  content: { flex: 1 },
  input: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
  },
  memberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  memberName: { color: colors.foreground, fontWeight: "700" },
  removeBtn: { paddingHorizontal: 8 },
});
