import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, TrendingUp, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';

export function getTaskProgress(task) {
  if (!task) return 0;
  if (task.type === 'project') {
    if (typeof task.progress === 'number') return task.progress;
    const total = task.subtasks?.length ?? 0;
    if (total === 0) return 0;
    const done = task.subtasks.filter((s) => s.completed).length;
    return Math.round((done / total) * 100);
  }
  return task.status === 'completed' ? 100 : 0;
}

const STATUS_CONFIG = {
  low: {
    Icon: AlertCircle,
    ring: 'ring-red-500/30',
    bg: 'bg-red-500/15',
    icon: 'text-red-500',
    label: 'Getting started',
  },
  mid: {
    Icon: TrendingUp,
    ring: 'ring-amber-500/30',
    bg: 'bg-amber-500/15',
    icon: 'text-amber-500',
    label: 'In progress',
  },
  done: {
    Icon: CheckCircle2,
    ring: 'ring-emerald-500/30',
    bg: 'bg-emerald-500/15',
    icon: 'text-emerald-500',
    label: 'Complete',
  },
};

function getStatusKey(progress) {
  if (progress >= 100) return 'done';
  if (progress >= 40) return 'mid';
  return 'low';
}

const TaskProgressIndicator = ({ task, size = 'md', showLabel = false, className }) => {
  const progress = useMemo(() => getTaskProgress(task), [task]);
  const statusKey = getStatusKey(progress);
  const config = STATUS_CONFIG[statusKey];
  const { Icon } = config;

  const sizeMap = {
    sm: { wrap: 'w-7 h-7', icon: 14 },
    md: { wrap: 'w-9 h-9', icon: 18 },
    lg: { wrap: 'w-11 h-11', icon: 22 },
  };
  const s = sizeMap[size] || sizeMap.md;

  return (
    <div className={clsx('flex items-center gap-2 flex-shrink-0', className)} title={`${progress}% — ${config.label}`}>
      <motion.div
        key={statusKey}
        initial={{ scale: 0.85, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 22 }}
        className={clsx(
          'rounded-xl ring-2 flex items-center justify-center transition-colors duration-300',
          s.wrap,
          config.ring,
          config.bg
        )}
      >
        <motion.div
          animate={statusKey === 'mid' ? { rotate: [0, 5, -5, 0] } : {}}
          transition={{ duration: 2, repeat: statusKey === 'mid' ? Infinity : 0, repeatDelay: 3 }}
        >
          <Icon size={s.icon} className={config.icon} strokeWidth={2.5} />
        </motion.div>
      </motion.div>
      {showLabel && (
        <span className={clsx('text-[10px] font-bold', config.icon)}>{progress}%</span>
      )}
    </div>
  );
};

export default TaskProgressIndicator;
