import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { colors, spacing } from "../theme/colors";
import { typography } from "../theme/typography";
import { useAIAssistant } from "../context/AIAssistantContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

const MSG_KEY = "@ai_messages";

export default function AIChatScreen() {
  const { openAssistant } = useAIAssistant();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    openAssistant();
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(MSG_KEY);
        setMessages(raw ? JSON.parse(raw) : []);
      } catch {}
    })();
  }, []);

  const send = async () => {
    if (!input.trim()) return;
    const m = {
      id: Date.now().toString(),
      role: "user",
      text: input.trim(),
      createdAt: new Date().toISOString(),
    };
    const newMsgs = [...messages, m];
    setMessages(newMsgs);
    setInput("");
    await AsyncStorage.setItem(MSG_KEY, JSON.stringify(newMsgs));
    // start assistant streaming response
    const assistantId = `assistant_${Date.now()}`;
    const assistantMsg = {
      id: assistantId,
      role: "assistant",
      text: "",
      createdAt: new Date().toISOString(),
    };
    const withAssistant = [...newMsgs, assistantMsg];
    setMessages(withAssistant);
    await AsyncStorage.setItem(MSG_KEY, JSON.stringify(withAssistant));

    try {
      await streamUnifiedMessage({
        messages: withAssistant.map((x) => ({ role: x.role, content: x.text })),
        context: {},
        onChunk: async (full, chunk) => {
          // update assistant message progressively
          setMessages((prev) => {
            const next = prev.map((p) =>
              p.id === assistantId ? { ...p, text: full } : p,
            );
            AsyncStorage.setItem(MSG_KEY, JSON.stringify(next)).catch(() => {});
            return next;
          });
        },
        onDone: async (full) => {
          setMessages((prev) => {
            const next = prev.map((p) =>
              p.id === assistantId ? { ...p, text: full } : p,
            );
            AsyncStorage.setItem(MSG_KEY, JSON.stringify(next)).catch(() => {});
            return next;
          });
        },
        onError: async (err) => {
          setMessages((prev) => {
            const next = prev.map((p) =>
              p.id === assistantId
                ? { ...p, text: "Error: failed to generate response" }
                : p,
            );
            AsyncStorage.setItem(MSG_KEY, JSON.stringify(next)).catch(() => {});
            return next;
          });
        },
      });
    } catch (err) {
      // already handled via callbacks
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={typography.h2}>AI Assistant</Text>
      </View>
      <FlatList
        data={messages}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View
            style={item.role === "user" ? styles.userMsg : styles.assistantMsg}
          >
            <Text style={typography.body}>{item.text}</Text>
          </View>
        )}
        contentContainerStyle={{ padding: spacing.lg }}
      />
      <View style={styles.inputRow}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask AI..."
          style={styles.input}
        />
        <TouchableOpacity onPress={send} style={styles.sendBtn}>
          <Text style={{ color: "#fff" }}>Send</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg },
  userMsg: {
    alignSelf: "flex-end",
    backgroundColor: colors.primary,
    padding: 10,
    borderRadius: 10,
    marginBottom: spacing.sm,
  },
  assistantMsg: {
    alignSelf: "flex-start",
    backgroundColor: colors.card,
    padding: 10,
    borderRadius: 10,
    marginBottom: spacing.sm,
  },
  inputRow: {
    flexDirection: "row",
    padding: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  input: {
    flex: 1,
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginRight: 8,
  },
  sendBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    justifyContent: "center",
  },
});
