import React, { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Send, Bot, Sparkles, Loader2, CheckCircle } from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";

const SYSTEM_PROMPT_HINT = `You are a smart task creation assistant.`;

const AIChatModal = ({ isOpen, onClose, onTaskCreated }) => {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm your AI task assistant. Tell me what task you'd like to create, and I'll help you set it up! 🚀" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingTask, setPendingTask] = useState(null);
  const [creatingTask, setCreatingTask] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!isOpen) {
      setMessages([{ role: "assistant", content: "Hi! I'm your AI task assistant. Tell me what task you'd like to create, and I'll help you set it up! 🚀" }]);
      setInput("");
      setPendingTask(null);
    }
  }, [isOpen]);

  const extractTask = (text) => {
    const match = text.match(/<task>([\s\S]*?)<\/task>/);
    if (match) {
      try { return JSON.parse(match[1].trim()); } catch (e) { return null; }
    }
    return null;
  };

  const cleanMessage = (text) => text.replace(/<task>[\s\S]*?<\/task>/g, "").trim();

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      // Call our own backend proxy — no CORS issues
      const { data } = await api.post("/ai/chat", {
        messages: newMessages.map(m => ({ role: m.role, content: m.content })),
      });

      const aiText = data.content || "Sorry, I couldn't process that.";
      const task = extractTask(aiText);
      const cleanedText = cleanMessage(aiText);

      if (task) setPendingTask(task);

      setMessages(prev => [...prev, {
        role: "assistant",
        content: cleanedText || (task ? "I've prepared this task for you! Review it below and click 'Create Task' to add it." : "How can I help?")
      }]);
    } catch (error) {
      const msg = error.response?.data?.message || "AI service unavailable. Please check your server is running.";
      toast.error(msg);
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I'm having trouble connecting right now. Make sure the backend server is running!" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!pendingTask) return;
    setCreatingTask(true);
    try {
      const taskData = {
        title: pendingTask.title,
        description: pendingTask.description || "",
        priority: pendingTask.priority || "Medium",
        category: pendingTask.category || "General",
        type: pendingTask.type || "simple",
      };
      if (pendingTask.dueDate) taskData.dueDate = pendingTask.dueDate;
      if (pendingTask.type === "project" && pendingTask.subtasks?.length) {
        taskData.subtasks = pendingTask.subtasks.map((s, i) => ({
          title: typeof s === "string" ? s : s.title,
          completed: false,
          order: i,
        }));
      }

      await api.post("/tasks", taskData);
      toast.success("Task created successfully! 🎉");
      onTaskCreated?.();
      setPendingTask(null);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `✅ Task "${pendingTask.title}" has been created! Would you like to create another task?`
      }]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create task");
    } finally {
      setCreatingTask(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-background/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className="w-full sm:max-w-lg h-[85vh] sm:h-[600px] bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-violet-500/10 to-indigo-500/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-violet-500/20 flex items-center justify-center">
                <Bot size={20} className="text-violet-500" />
              </div>
              <div>
                <h2 className="font-semibold flex items-center gap-2">
                  AI Task Assistant <Sparkles size={14} className="text-amber-500" />
                </h2>
                <p className="text-xs text-muted-foreground">Powered by DeepSeek</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-violet-500/20 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                    <Bot size={14} className="text-violet-500" />
                  </div>
                )}
                <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-full bg-violet-500/20 flex items-center justify-center mr-2 flex-shrink-0">
                  <Bot size={14} className="text-violet-500" />
                </div>
                <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-violet-500" />
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Pending Task Preview */}
          {pendingTask && (
            <div className="mx-4 mb-2 p-3 rounded-xl border border-violet-500/30 bg-violet-500/5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-violet-500 uppercase tracking-wider mb-1">Task Ready</p>
                  <p className="font-medium text-sm truncate">{pendingTask.title}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{pendingTask.priority}</span>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{pendingTask.category}</span>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full capitalize">{pendingTask.type}</span>
                    {pendingTask.dueDate && <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{pendingTask.dueDate}</span>}
                  </div>
                  {pendingTask.subtasks?.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">{pendingTask.subtasks.length} subtasks included</p>
                  )}
                </div>
                <button
                  onClick={handleCreateTask}
                  disabled={creatingTask}
                  className="flex items-center gap-1.5 px-3 py-2 bg-violet-500 text-white rounded-xl text-sm font-medium hover:bg-violet-600 transition-colors disabled:opacity-50 flex-shrink-0"
                >
                  {creatingTask ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                  Create
                </button>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe your task..."
                disabled={loading}
                className="flex-1 p-3 rounded-xl bg-background border border-border text-sm focus:ring-2 focus:ring-violet-500 outline-none disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="p-3 bg-violet-500 text-white rounded-xl hover:bg-violet-600 transition-colors disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">Press Enter to send</p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AIChatModal;
