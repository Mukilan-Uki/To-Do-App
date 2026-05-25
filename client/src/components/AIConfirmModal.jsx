import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { formatActionSummary } from '../services/actionParser';

const AIConfirmModal = ({ isOpen, actions, onConfirm, onCancel, loading }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm bg-card border border-border rounded-3xl shadow-2xl p-6"
        >
          <div className="flex items-start gap-3 mb-4">
            <div className="w-11 h-11 rounded-2xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={22} className="text-destructive" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Confirm action</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                This action cannot be undone. Do you want to proceed?
              </p>
            </div>
            <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-muted ml-auto">
              <X size={18} />
            </button>
          </div>
          <ul className="space-y-2 mb-6">
            {actions?.map((a, i) => (
              <li
                key={i}
                className="text-sm font-semibold px-3 py-2 rounded-xl bg-destructive/5 text-destructive border border-destructive/15"
              >
                {formatActionSummary(a)}
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 py-3 rounded-2xl bg-muted text-foreground font-bold text-sm hover:bg-muted/80 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 py-3 rounded-2xl bg-destructive text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Working...' : 'Proceed'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AIConfirmModal;
