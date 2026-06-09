import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import DoNowButton from "./DoNowButton";
import { colors, spacing, radius } from "../theme/colors";
import { typography } from "../theme/typography";
import { taskAPI, getApiErrorMessage } from "../services/apiService";

export default function ProjectEditModal({ isOpen, onClose, task, onSaved }) {
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!title.trim()) return Alert.alert("Title required");
    setLoading(true);
    try {
      const { data } = await taskAPI.updateTask(task._id, {
        title: title.trim(),
        description,
      });
      onSaved && onSaved(data);
      onClose();
    } catch (e) {
      Alert.alert("Error", getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <ScrollView contentContainerStyle={styles.safe}>
        <View style={styles.header}>
          <Text style={typography.h2}>Edit Project</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.close}>Close</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.field}>
          <Text style={typography.caption}>Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            style={styles.input}
          />
        </View>
        <View style={styles.field}>
          <Text style={typography.caption}>Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            style={[styles.input, { height: 120 }]}
            multiline
          />
        </View>
        <View style={{ marginTop: spacing.md }}>
          <DoNowButton title="Save" onPress={save} loading={loading} />
        </View>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: {
    padding: spacing.lg,
    backgroundColor: colors.background,
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  close: { color: colors.primary, fontWeight: "700" },
  field: { marginBottom: spacing.md },
  input: {
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
  },
});
