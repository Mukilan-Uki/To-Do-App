import React, { useEffect, useState, useRef, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors, spacing, radius } from "../theme/colors";
import { typography } from "../theme/typography";
import { useAIAssistant } from "../context/AIAssistantContext";
import { streamUnifiedMessage, sendUnifiedMessage } from "../services/aiService";
import {
  parseActionsFromResponse,
  DESTRUCTIVE_ACTIONS,
  inferRoutineActionsIfMissing,
} from "../services/actionParser";
import { executeActions } from "../services/actionExecutor";

const MSG_KEY = "@ai_messages";

const WELCOME =
  "I'm your DoNow AI — I control tasks, projects, subtasks, and daily routines. Try:\n\n• \"Add subtask under School Work: finish essay\"\n• \"Move wake up routine to 6 AM\"\n• \"What should I do today?\"";

export default function AIChatScreen() {
  const { openAssistant, refreshContext, notifyDataChanged, getContext } =
    useAIAssistant();

  const [messages, setMessages] = useState([
    { id: "welcome", role: "assistant", text: WELCOME },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);
  const lastUserMsgRef = useRef("");

  useEffect(() => {
    openAssistant();
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(MSG_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          if (saved.length > 0) setMessages(saved);
        }
      } catch {}
    })();
  }, []);

  const persistMessages = useCallback(async (msgs) => {
    try {
      await AsyncStorage.setItem(MSG_KEY, JSON.stringify(msgs));
    } catch {}
  }, []);

  const runActions = useCallback(
    async (actions) => {
      const ctx = await refreshContext();
      const results = await executeActions(actions, {
        tasks: ctx.tasks,
        routine: ctx.routine,
      });
      const ok = results.filter((r) => r.success && !r.skipped);
      const failed = results.filter((r) => r.success === false);
      if (ok.length) notifyDataChanged();
      return { ok, failed };
    },
    [refreshContext, notifyDataChanged],
  );

  const processAIResponse = useCallback(
    async (fullText) => {
      let { cleanText, actions } = parseActionsFromResponse(fullText);
      const inferred = inferRoutineActionsIfMissing(
        actions,
        lastUserMsgRef.current,
        fullText,
      );
      if (inferred.length && !actions.length) actions = inferred;

      const safe = actions.filter((a) => !DESTRUCTIVE_ACTIONS.includes(a.action));
      const destructive = actions.filter((a) =>
        DESTRUCTIVE_ACTIONS.includes(a.action),
      );

      let actionNote = "";

      if (safe.length) {
        const { ok, failed } = await runActions(safe);
        if (ok.length)
          actionNote += `\n\n✅ Done: ${ok.map((r) => r.message).join(" · ")}`;
        if (failed.length)
          actionNote += `\n\n❌ ${failed.map((r) => r.message).join(" · ")}`;
      }

      if (destructive.length) {
        Alert.alert(
          "Confirm action",
          `This will delete: ${destructive.map((a) => a.taskTitle || a.title).join(", ")}. Proceed?`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Delete",
              style: "destructive",
              onPress: async () => {
                await runActions(destructive);
              },
            },
          ],
        );
        actionNote += "\n\n⚠️ Awaiting your confirmation for destructive action.";
      }

      return (cleanText || "Done.") + actionNote;
    },
    [runActions],
  );

  const send = async () => {
    if (!input.trim() || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      role: "user",
      text: input.trim(),
    };
    lastUserMsgRef.current = userMsg.text;

    const history = [...messages.filter((m) => m.id !== "welcome"), userMsg];
    const updatedWithUser = [...messages, userMsg];
    setMessages(updatedWithUser);
    setInput("");
    setLoading(true);

    const assistantId = `assistant_${Date.now()}`;
    const assistantMsg = { id: assistantId, role: "assistant", text: "" };
    const withAssistant = [...updatedWithUser, assistantMsg];
    setMessages(withAssistant);

    const context = getContext();

    const updateStreaming = (text) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, text } : m)),
      );
    };

    try {
      let fullText = "";
      try {
        fullText = await streamUnifiedMessage({
          messages: history.map((m) => ({ role: m.role, content: m.text })),
          context,
          onChunk: (accumulated) => updateStreaming(accumulated),
        });
      } catch {
        const res = await sendUnifiedMessage({
          messages: history.map((m) => ({ role: m.role, content: m.text })),
          context,
        });
        fullText = res.content || res.message || "";
        updateStreaming(fullText);
      }

      const finalText = await processAIResponse(fullText);

      setMessages((prev) => {
        const next = prev.map((m) =>
          m.id === assistantId ? { ...m, text: finalText } : m,
        );
        persistMessages(next);
        return next;
      });
    } catch (err) {
      const errText = "I couldn't connect right now. Please try again.";
      setMessages((prev) => {
        const next = prev.map((m) =>
          m.id === assistantId ? { ...m, text: errText } : m,
        );
        persistMessages(next);
        return next;
      });
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    Alert.alert("Clear history", "Remove all chat history?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          const welcome = [{ id: "welcome", role: "assistant", text: WELCOME }];
          setMessages(welcome);
          await AsyncStorage.removeItem(MSG_KEY);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.aiIcon}>
              <Text style={styles.aiIconText}>⚡</Text>
            </View>
            <View>
              <Text style={typography.h3}>DoNow AI</Text>
              <Text style={styles.subtitle}>Talk naturally — I'll run actions</Text>
            </View>
          </View>
          <TouchableOpacity onPress={clearHistory} style={styles.clearBtn}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: true })
          }
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View
              style={[
                styles.bubble,
                item.role === "user" ? styles.userBubble : styles.aiBubble,
              ]}
            >
              <Text
                style={[
                  styles.bubbleText,
                  item.role === "user"
                    ? styles.userBubbleText
                    : styles.aiBubbleText,
                ]}
              >
                {item.text}
                {item.text === "" && <ActivityIndicator size="small" color={colors.primary} />}
              </Text>
            </View>
          )}
        />

        {/* Input row */}
        <View style={styles.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask or command anything..."
            placeholderTextColor={colors.mutedForeground}
            style={styles.input}
            multiline
            editable={!loading}
            onSubmitEditing={send}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            onPress={send}
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            disabled={!input.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.sendBtnText}>↑</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  aiIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  aiIconText: { fontSize: 18 },
  subtitle: { fontSize: 11, color: colors.mutedForeground, fontWeight: "600" },
  clearBtn: { padding: spacing.sm },
  clearText: { fontSize: 13, color: colors.mutedForeground, fontWeight: "700" },

  list: { padding: spacing.lg, gap: spacing.sm },

  bubble: {
    maxWidth: "85%",
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.lg,
    marginBottom: spacing.xs,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: colors.primary,
    borderBottomRightRadius: radius.xs,
  },
  aiBubble: {
    alignSelf: "flex-start",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: radius.xs,
  },
  bubbleText: { fontSize: 14, lineHeight: 20, fontWeight: "500" },
  userBubbleText: { color: "#fff" },
  aiBubbleText: { color: colors.foreground },

  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.foreground,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: "#fff", fontSize: 20, fontWeight: "900", lineHeight: 24 },
});
