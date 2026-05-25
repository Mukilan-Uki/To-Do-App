import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit2, Trash2, CheckCircle, Circle, UserPlus, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import clsx from 'clsx';
import TaskProgressIndicator from './TaskProgressIndicator';

const TaskItem = ({ task, onEdit, onDelete, onToggleStatus, onManage, onCollaborators }) => {
  const [expanded, setExpanded] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  const isCompleted = task.status === 'completed';
  const priorityConfig = {
    High:   { cls: 'bg-red-500/10 text-red-600',     dot: 'bg-red-500' },
    Medium: { cls: 'bg-amber-500/10 text-amber-600', dot: 'bg-amber-500' },
    Low:    { cls: 'bg-emerald-500/10 text-emerald-600', dot: 'bg-emerald-500' },
  };
  const p = priorityConfig[task.priority] || priorityConfig.Medium;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        'rounded-2xl border transition-all mb-2',
        isCompleted ? 'bg-muted/30 border-transparent' : 'bg-card border-border hover:border-blue-300 dark:hover:border-blue-700',
        isDragging && 'shadow-xl border-blue-400'
      )}
    >
      <div className="flex items-center gap-2.5 p-3.5">
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="hidden md:flex cursor-grab p-1 text-muted-foreground hover:text-foreground active:cursor-grabbing flex-shrink-0"
        >
          <GripVertical size={16} />
        </div>

        <TaskProgressIndicator task={task} size="sm" className="flex-shrink-0" />

        {/* Checkbox */}
        <button
          onClick={() => onToggleStatus(task)}
          className={clsx('flex-shrink-0 transition-colors', isCompleted ? 'text-emerald-500' : 'text-muted-foreground hover:text-blue-600')}
        >
          {isCompleted ? <CheckCircle size={22} /> : <Circle size={22} />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onManage?.(task)}>
          <h3 className={clsx('font-bold text-sm truncate', isCompleted && 'line-through text-muted-foreground')}>
            {task.title}
          </h3>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <span className={clsx('text-[10px] px-2 py-0.5 rounded-full font-bold', p.cls)}>
              {task.priority}
            </span>
            <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-semibold">{task.category}</span>
            {task.type === 'project' && (
              <span className="text-[10px] bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-full font-bold">Project</span>
            )}
            {task.dueDate && (
              <span className="text-[10px] text-muted-foreground font-semibold">
                📅 {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-1">
          <button onClick={() => onCollaborators?.(task)} className="p-1.5 text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10 rounded-xl transition-colors" title="Team">
            <UserPlus size={15} />
          </button>
          <button onClick={() => onEdit(task)} className="p-1.5 text-muted-foreground hover:text-blue-600 hover:bg-blue-500/10 rounded-xl transition-colors" title="Edit">
            <Edit2 size={15} />
          </button>
          <button onClick={() => onManage?.(task)} className="p-1.5 text-muted-foreground hover:text-violet-600 hover:bg-violet-500/10 rounded-xl transition-colors" title="View">
            <ExternalLink size={15} />
          </button>
          <button onClick={() => onDelete(task._id)} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors" title="Delete">
            <Trash2 size={15} />
          </button>
        </div>

        {/* Mobile expand */}
        <button
          className="md:hidden p-1.5 text-muted-foreground rounded-xl"
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Project progress */}
      {task.type === 'project' && (
        <div className="px-4 pb-3">
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-700" style={{ width: `${task.progress ?? 0}%` }} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 font-semibold">{task.progress ?? 0}% complete</p>
        </div>
      )}

      {/* Collaborators */}
      {task.collaborators?.length > 0 && (
        <div className="px-4 pb-3 flex items-center gap-1.5">
          {task.collaborators.slice(0, 3).map(c => (
            <div key={c._id} className="w-5 h-5 rounded-full bg-[var(--donow-blue)] text-white flex items-center justify-center text-[9px] font-bold" title={c.name}>
              {c.name?.charAt(0)}
            </div>
          ))}
          {task.collaborators.length > 3 && (
            <span className="text-[10px] text-muted-foreground font-semibold">+{task.collaborators.length - 3} more</span>
          )}
        </div>
      )}

      {/* Mobile expanded actions */}
      {expanded && (
        <div className="md:hidden flex items-center gap-2 px-3.5 pb-3.5 pt-2 border-t border-border">
          <button onClick={() => { onManage?.(task); setExpanded(false); }} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-500/10 text-blue-600 text-xs font-bold">
            <ExternalLink size={13} /> View
          </button>
          <button onClick={() => { onEdit(task); setExpanded(false); }} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-muted text-foreground text-xs font-bold">
            <Edit2 size={13} /> Edit
          </button>
          <button onClick={() => { onCollaborators?.(task); setExpanded(false); }} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-amber-500/10 text-amber-600 text-xs font-bold">
            <UserPlus size={13} /> Team
          </button>
          <button onClick={() => { onDelete(task._id); setExpanded(false); }} className="p-2.5 rounded-xl bg-destructive/10 text-destructive">
            <Trash2 size={15} />
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskItem;
