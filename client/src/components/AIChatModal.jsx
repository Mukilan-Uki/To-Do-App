import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Send, Bot, Sparkles, Loader2, CheckCircle, CornerDownLeft } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AIChatModal = ({ isOpen, onClose, onTaskCreated }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm your AI task assistant. Describe what you need to get done, and I'll help you set it up! 🚀" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingTask, setPendingTask] = useState(null);
  const [creatingTask, setCreatingTask] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isOpen) {
      setMessages([{ role: 'assistant', content: "Hi! I'm your AI task assistant. Describe what you need to get done, and I'll help you set it up! 🚀" }]);
      setInput('');
      setPendingTask(null);
    } else {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => requestAnimationFrame(() => {
      inputRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
    vv.addEventListener('resize', onResize);
    return () => vv.removeEventListener('resize', onResize);
  }, [isOpen]);

  const extractTask = (text) => {
    const match = text.match(/<task>([\s\S]*?)<\/task>/);
    if (match) { try { return JSON.parse(match[1].trim()); } catch { return null; } }
    return null;
  };
  const cleanMessage = (text) => text.replace(/<task>[\s\S]*?<\/task>/g, '').trim();

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    try {
      const { data } = await api.post('/ai/chat', {
        messages: newMessages.map(m => ({ role: m.role, content: m.content })),
      });
      const aiText = data.content || "Sorry, I couldn't process that.";
      const task = extractTask(aiText);
      const cleanedText = cleanMessage(aiText);
      if (task) setPendingTask(task);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: cleanedText || (task ? "I've prepared this task for you!" : 'How can I help?')
      }]);
    } catch (error) {
      toast.error(error.response?.data?.message || 'AI service unavailable.');
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting right now." }]);
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
        description: pendingTask.description || '',
        priority: pendingTask.priority || 'Medium',
        category: pendingTask.category || 'General',
        type: pendingTask.type || 'simple',
      };
      if (pendingTask.dueDate) taskData.dueDate = pendingTask.dueDate;
      if (pendingTask.type === 'project' && pendingTask.subtasks?.length) {
        taskData.subtasks = pendingTask.subtasks.map((s, i) => ({
          title: typeof s === 'string' ? s : s.title,
          completed: false, order: i,
        }));
      }
      await api.post('/tasks', taskData);
      toast.success('Task created! 🎉');
      onTaskCreated?.();
      setPendingTask(null);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `✅ Task "${pendingTask.title}" created! Want to make another?`
      }]);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create task');
    } finally {
      setCreatingTask(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4"
      >
        <div
          className="bg-card w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border border-border flex flex-col overflow-hidden"
          style={{ height: 'min(90dvh, 640px)' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-violet-500/20 flex items-center justify-center">
                <Bot size={20} className="text-violet-600" />
              </div>
              <div>
                <h2 className="font-black text-sm flex items-center gap-1.5">
                  AI Task Assistant <Sparkles size={13} className="text-amber-500" />
                </h2>
                <p className="text-[11px] text-muted-foreground">Describe your task in plain English</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot size={13} className="text-violet-600" />
                  </div>
                )}
                <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed font-medium ${
                  msg.role === 'user'
                    ? 'rounded-br-sm text-white'
                    : 'bg-muted text-foreground rounded-bl-sm'
                }`}
                  style={msg.role === 'user' ? { background: 'linear-gradient(135deg, var(--donow-blue), #2563eb)' } : {}}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start gap-2">
                <div className="w-7 h-7 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                  <Bot size={13} className="text-violet-600" />
                </div>
                <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-violet-500" />
                  <span className="text-sm text-muted-foreground font-medium">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Pending Task Preview */}
          {pendingTask && (
            <div className="mx-3 mb-2 p-3.5 rounded-2xl border border-violet-500/30 bg-violet-500/5 flex-shrink-0">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-violet-600 uppercase tracking-wider mb-1">Task Ready ✨</p>
                  <p className="font-black text-sm truncate">{pendingTask.title}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full font-bold">{pendingTask.priority}</span>
                    <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full font-bold">{pendingTask.category}</span>
                    {pendingTask.dueDate && <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full font-bold">{pendingTask.dueDate}</span>}
                  </div>
                </div>
                <button
                  onClick={handleCreateTask}
                  disabled={creatingTask}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-violet-600 text-white rounded-2xl text-xs font-black hover:bg-violet-700 transition-colors disabled:opacity-50 flex-shrink-0"
                >
                  {creatingTask ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                  Create
                </button>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-border flex-shrink-0" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
            <div className="flex gap-2 items-end bg-background rounded-2xl border border-border focus-within:ring-2 focus-within:ring-violet-500/40 focus-within:border-violet-500 transition-all px-3 py-2">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px';
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => setTimeout(() => inputRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 300)}
                placeholder="Describe your task..."
                disabled={loading}
                className="flex-1 bg-transparent text-sm outline-none disabled:opacity-50 resize-none overflow-hidden font-medium placeholder:text-muted-foreground"
                style={{ minHeight: '36px', maxHeight: '96px' }}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="p-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-40 flex-shrink-0 self-end"
              >
                <Send size={15} />
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-1.5 hidden sm:flex items-center justify-center gap-1">
              <CornerDownLeft size={10} /> Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AIChatModal;
