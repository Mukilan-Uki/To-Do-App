import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X, Send, Bot, Sparkles, Loader2, Zap, CheckCircle2, AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAIAssistant } from '../context/AIAssistantContext';
import { streamUnifiedMessage, sendUnifiedMessage } from '../services/aiService';
import { parseActionsFromResponse, DESTRUCTIVE_ACTIONS, formatActionSummary } from '../services/actionParser';
import { executeActions } from '../services/actionExecutor';
import AIConfirmModal from './AIConfirmModal';

const WELCOME =
  "I'm your DoNow AI — I control tasks, projects, subtasks, and daily routines. Try:\n\n• \"Add subtask under School Work: finish essay\"\n• \"Move wake up routine to 6 AM\"\n• \"Mark Fitness project 50% complete\"\n• \"What should I do today?\"";

const AIUnifiedChat = () => {
  const { isOpen, closeAssistant, refreshContext, notifyDataChanged, getContext } =
    useAIAssistant();

  const [messages, setMessages] = useState([{ role: 'assistant', content: WELCOME }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [pendingDestructive, setPendingDestructive] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, streaming]);

  useEffect(() => {
    if (!isOpen) {
      setMessages([{ role: 'assistant', content: WELCOME }]);
      setInput('');
    } else {
      refreshContext();
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen, refreshContext]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const runActions = useCallback(
    async (actions) => {
      const ctx = await refreshContext();
      const results = await executeActions(actions, {
        tasks: ctx.tasks,
        routine: ctx.routine,
      });
      const failed = results.filter((r) => r.success === false);
      const ok = results.filter((r) => r.success && !r.skipped);
      if (ok.length) {
        notifyDataChanged();
        toast.success(ok.map((r) => r.message).join(' · '));
      }
      if (failed.length) {
        toast.error(failed.map((r) => r.message).join(' · '));
      }
      return results;
    },
    [refreshContext, notifyDataChanged]
  );

  const processAIResponse = useCallback(
    async (fullText) => {
      const { cleanText, actions, invalid } = parseActionsFromResponse(fullText);
      const safe = actions.filter((a) => !DESTRUCTIVE_ACTIONS.includes(a.action));
      const destructive = actions.filter((a) => DESTRUCTIVE_ACTIONS.includes(a.action));

      let actionNote = '';
      if (invalid?.length) {
        toast.error(
          `Could not run action(s): ${invalid.map((a) => a.action).join(', ')}. Try rephrasing.`,
        );
      }
      if (safe.length) {
        const results = await runActions(safe);
        const done = results.filter((r) => r.success && !r.skipped);
        if (done.length) {
          actionNote = `\n\n✅ Done: ${done.map((r) => r.message).join(' · ')}`;
        }
      }
      if (destructive.length) {
        setPendingDestructive(destructive);
        actionNote += '\n\n⚠️ Destructive action needs your confirmation.';
      }

      return (cleanText || 'Done.') + actionNote;
    },
    [runActions]
  );

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim() };
    const history = [...messages.filter((m) => m.role !== 'system'), userMsg];
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setStreaming(true);

    const context = getContext();

    setMessages((prev) => [
      ...prev,
      { role: 'assistant', content: '', streaming: true },
    ]);

    const updateStreaming = (text) => {
      setMessages((prev) => {
        const next = [...prev];
        const last = next.length - 1;
        if (next[last]?.role === 'assistant') {
          next[last] = { role: 'assistant', content: text, streaming: true };
        }
        return next;
      });
    };

    const setAssistantFinal = (text) => {
      setMessages((prev) => {
        const next = [...prev];
        const last = next.length - 1;
        if (next[last]?.role === 'assistant') {
          next[last] = { role: 'assistant', content: text };
        }
        return next;
      });
    };

    try {
      let fullText = '';
      try {
        fullText = await streamUnifiedMessage({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
          context,
          onChunk: (accumulated) => updateStreaming(accumulated),
        });
      } catch {
        const { content } = await sendUnifiedMessage({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
          context,
        });
        fullText = content;
        updateStreaming(fullText);
      }

      const finalContent = await processAIResponse(fullText);
      setAssistantFinal(finalContent);
    } catch (err) {
      toast.error(err.message || 'AI unavailable');
      setAssistantFinal("I couldn't connect right now. Please try again.");
    } finally {
      setLoading(false);
      setStreaming(false);
    }
  };

  const handleConfirmDestructive = async () => {
    if (!pendingDestructive?.length) return;
    setConfirmLoading(true);
    try {
      await runActions(pendingDestructive);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '✅ Confirmed and completed.' },
      ]);
    } finally {
      setConfirmLoading(false);
      setPendingDestructive(null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeAssistant}
          className="fixed inset-0 z-[200] bg-black/55 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.98 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="fixed inset-0 z-[201] flex items-end sm:items-center justify-center sm:p-4 pointer-events-none"
        >
          <div
            className="pointer-events-auto bg-card w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-border flex flex-col overflow-hidden"
            style={{ height: 'min(92dvh, 680px)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0 bg-gradient-to-r from-violet-500/5 to-blue-500/5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shadow-lg">
                  <Zap size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="font-black text-base flex items-center gap-1.5">
                    DoNow AI
                    <Sparkles size={14} className="text-amber-500" />
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    Talk naturally — I&apos;ll run actions in your app
                  </p>
                </div>
              </div>
              <button
                onClick={closeAssistant}
                className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-violet-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot size={15} className="text-violet-600" />
                    </div>
                  )}
                  <div
                    className={`max-w-[88%] px-4 py-3 rounded-2xl text-sm leading-relaxed font-medium whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'rounded-br-md text-white shadow-md'
                        : 'bg-muted text-foreground rounded-bl-md'
                    }`}
                    style={
                      msg.role === 'user'
                        ? { background: 'linear-gradient(135deg, var(--donow-blue), #2563eb)' }
                        : {}
                    }
                  >
                    {msg.content}
                    {msg.streaming && (
                      <span className="inline-block w-1.5 h-4 ml-0.5 bg-violet-500/60 animate-pulse rounded-sm align-middle" />
                    )}
                    {msg.actionResults?.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border/50 space-y-1">
                        {msg.actionResults.map((r, j) => (
                          <div key={j} className="flex items-center gap-1.5 text-xs">
                            {r.success ? (
                              <CheckCircle2 size={12} className="text-emerald-500" />
                            ) : (
                              <AlertCircle size={12} className="text-destructive" />
                            )}
                            {formatActionSummary({ action: r.action })}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {loading && !streaming && (
                <div className="flex gap-2 items-center text-muted-foreground text-sm px-2">
                  <Loader2 size={16} className="animate-spin text-violet-500" />
                  Thinking...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div
              className="p-3 border-t border-border flex-shrink-0 bg-card/80"
              style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
            >
              <div className="flex gap-2 items-end rounded-2xl border border-border bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-violet-500/30 transition-all">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask or command anything..."
                  disabled={loading}
                  className="flex-1 bg-transparent text-sm outline-none resize-none font-medium min-h-[36px] max-h-[100px]"
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className="p-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white disabled:opacity-40 flex-shrink-0"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <AIConfirmModal
        isOpen={!!pendingDestructive?.length}
        actions={pendingDestructive}
        onConfirm={handleConfirmDestructive}
        onCancel={() => setPendingDestructive(null)}
        loading={confirmLoading}
      />
    </>
  );
};

export default AIUnifiedChat;
