import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Send, Heart, Loader2, Sparkles, CheckCircle, SkipForward } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const extractSuggestions = (text) => {
  const match = text.match(/<suggestions>([\s\S]*?)<\/suggestions>/);
  if (match) {
    try {
      return JSON.parse(match[1].trim());
    } catch {
      return null;
    }
  }
  return null;
};

const cleanMessage = (text) => text.replace(/<suggestions>[\s\S]*?<\/suggestions>/g, '').trim();

const RoutineHealthAssistant = ({ isOpen, onClose, routineItems, onApplySuggestions }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        "Hey! I noticed you're building a health-focused routine. I'd love to help you make it sustainable and effective. What's your main goal right now — fitness, weight management, energy, or something else?",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingSuggestions, setPendingSuggestions] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, pendingSuggestions]);

  useEffect(() => {
    if (!isOpen) {
      setMessages([
        {
          role: 'assistant',
          content:
            "Hey! I noticed you're building a health-focused routine. I'd love to help you make it sustainable and effective. What's your main goal right now — fitness, weight management, energy, or something else?",
        },
      ]);
      setInput('');
      setPendingSuggestions(null);
    } else {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const sendMessage = async (textOverride) => {
    const content = (textOverride ?? input).trim();
    if (!content || loading) return;
    const userMsg = { role: 'user', content };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    try {
      const { data } = await api.post('/ai/routine-health', {
        messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        routineItems: routineItems?.map((i) => ({
          title: i.title,
          time: i.time,
          category: i.category,
        })),
      });
      const aiText = data.content || '';
      const suggestions = extractSuggestions(aiText);
      const cleaned = cleanMessage(aiText);
      if (suggestions) setPendingSuggestions(suggestions);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: cleaned || (suggestions ? suggestions.message : 'Tell me more when you are ready!'),
        },
      ]);
    } catch {
      toast.error('AI coach is unavailable right now');
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "I'm having trouble connecting — try again in a moment." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (pendingSuggestions?.improvedItems?.length) {
      onApplySuggestions?.(pendingSuggestions);
      toast.success('Routine updated with AI suggestions!');
    }
    setPendingSuggestions(null);
    onClose();
  };

  const handleSkip = () => {
    setPendingSuggestions(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full sm:max-w-lg bg-card border border-border rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[min(92vh,640px)] safe-area-pb"
        >
          <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
                <Heart size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Health & Routine Coach</h3>
                <p className="text-[10px] text-muted-foreground">Personalized wellness tips</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted text-muted-foreground">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[88%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[var(--donow-blue)] text-white rounded-br-md'
                      : 'bg-muted text-foreground rounded-bl-md'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <Sparkles size={12} className="inline mr-1 text-rose-500 mb-0.5" />
                  )}
                  {msg.content}
                </div>
              </motion.div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm px-2">
                <Loader2 size={16} className="animate-spin" />
                Thinking...
              </div>
            )}
            {pendingSuggestions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 space-y-3"
              >
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Suggested improvements</p>
                {pendingSuggestions.improvedItems?.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="text-xs bg-card rounded-xl p-2.5 border border-border">
                    <span className="font-bold">{item.time}</span> — {item.title}
                    {item.note && <p className="text-muted-foreground mt-0.5">{item.note}</p>}
                  </div>
                ))}
                {pendingSuggestions.tips?.length > 0 && (
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                    {pendingSuggestions.tips.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                )}
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    onClick={handleApply}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors"
                  >
                    <CheckCircle size={16} /> Apply Suggestions
                  </button>
                  <button
                    onClick={handleSkip}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-muted text-muted-foreground text-sm font-bold hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <SkipForward size={16} /> Skip
                  </button>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {!pendingSuggestions && (
            <div className="p-4 border-t border-border flex gap-2 flex-shrink-0">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Share your goals, sleep, experience..."
                className="flex-1 px-4 py-3 rounded-2xl bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                disabled={loading}
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className="p-3 rounded-2xl bg-[var(--donow-blue)] text-white disabled:opacity-50 transition-opacity"
              >
                <Send size={18} />
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RoutineHealthAssistant;
