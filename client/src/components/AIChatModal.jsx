import React, { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Send, Bot, Sparkles, Loader2, CheckCircle, ChevronDown } from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";

const AIChatModal = ({ isOpen, onClose, onTaskCreated }) => {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm your AI task assistant. Tell me what task you'd like to create, and I'll help you set it up! 🚀" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingTask, setPendingTask] = useState(null);
  const [creatingTask, setCreatingTask] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!isOpen) {
      setMessages([{ role: "assistant", content: "Hi! I'm your AI task assistant. Tell me what task you'd like to create, and I'll help you set it up! 🚀" }]);
      setInput("");
      setPendingTask(null);
    } else {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // On mobile: when the virtual keyboard resizes the viewport, scroll input into view
  useEffect(() => {
    if (!isOpen) return;
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => {
      // Give the browser a frame to reflow, then scroll input into view
      requestAnimationFrame(() => {
        inputRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      });
    };
    vv.addEventListener("resize", onResize);
    return () => vv.removeEventListener("resize", onResize);
  }, [isOpen]);

  const extractTask = (text) => {
    const match = text.match(/<task>([\s\S]*?)<\/task>/);
    if (match) { try { return JSON.parse(match[1].trim()); } catch { return null; } }
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
      const { data } = await api.post("/ai/chat", {
        messages: newMessages.map(m => ({ role: m.role, content: m.content })),
      });
      const aiText = data.content || "Sorry, I couldn't process that.";
      const task = extractTask(aiText);
      const cleanedText = cleanMessage(aiText);
      if (task) setPendingTask(task);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: cleanedText || (task ? "I've prepared this task for you! Click 'Create Task' to add it." : "How can I help?")
      }]);
    } catch (error) {
      const msg = error.response?.data?.message || "AI service unavailable.";
      toast.error(msg);
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I'm having trouble connecting right now." }]);
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
      toast.success("Task created! 🎉");
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
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
      />

      {/* Modal — centered on all screen sizes */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", damping: 28, stiffness: 350 }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      >
        <div
          ref={modalRef}
          className="bg-card w-full max-w-lg min-h-[70dvh] max-h-[90dvh] rounded-2xl shadow-2xl border border-border flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-violet-500/10 to-indigo-500/10 rounded-t-2xl flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-violet-500/20 flex items-center justify-center">
                <Bot size={18} className="text-violet-500" />
              </div>
              <div>
                <h2 className="font-semibold text-sm flex items-center gap-1.5">
                  AI Task Assistant <Sparkles size={13} className="text-amber-500" />
                </h2>
                <p className="text-[10px] text-muted-foreground">Powered by DeepSeek</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages — scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-violet-500/20 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                    <Bot size={13} className="text-violet-500" />
                  </div>
                )}
                <div className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
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
                  <Bot size={13} className="text-violet-500" />
                </div>
                <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-violet-500" />
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Pending Task Preview */}
          {pendingTask && (
            <div className="mx-3 mb-2 p-3 rounded-xl border border-violet-500/30 bg-violet-500/5 flex-shrink-0">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-violet-500 uppercase tracking-wider mb-1">Task Ready</p>
                  <p className="font-medium text-sm truncate">{pendingTask.title}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full">{pendingTask.priority}</span>
                    <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full">{pendingTask.category}</span>
                    {pendingTask.dueDate && <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full">{pendingTask.dueDate}</span>}
                  </div>
                </div>
                <button
                  onClick={handleCreateTask}
                  disabled={creatingTask}
                  className="flex items-center gap-1.5 px-3 py-2 bg-violet-500 text-white rounded-xl text-xs font-medium hover:bg-violet-600 transition-colors disabled:opacity-50 flex-shrink-0"
                >
                  {creatingTask ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                  Create
                </button>
              </div>
            </div>
          )}

          {/* Input — always visible at bottom */}
          <div
            className="p-3 border-t border-border flex-shrink-0"
            style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
          >
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 96) + "px";
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  // Small delay to let the keyboard open, then scroll into view
                  setTimeout(() => {
                    inputRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
                  }, 300);
                }}
                placeholder="Describe your task..."
                disabled={loading}
                className="flex-1 p-3 rounded-xl bg-background border border-border text-sm focus:ring-2 focus:ring-violet-500 outline-none disabled:opacity-50 resize-none overflow-hidden"
                style={{ minHeight: "44px", maxHeight: "96px" }}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="p-3 bg-violet-500 text-white rounded-xl hover:bg-violet-600 transition-colors disabled:opacity-50 flex-shrink-0 self-end"
              >
                <Send size={16} />
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-1.5 hidden sm:block">Enter to send · Shift+Enter for new line</p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AIChatModal;
