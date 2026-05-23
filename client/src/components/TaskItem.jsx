import React, { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Edit2, Trash2, CheckCircle, Circle, UserPlus, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import clsx from "clsx";

const TaskItem = ({ task, onEdit, onDelete, onToggleStatus, onManage, onCollaborators }) => {
  const [expanded, setExpanded] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  const isCompleted = task.status === "completed";
  const priorityColors = {
    High: "bg-red-500/10 text-red-500",
    Medium: "bg-amber-500/10 text-amber-500",
    Low: "bg-emerald-500/10 text-emerald-500",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        "rounded-xl border transition-colors mb-2",
        isCompleted ? "bg-muted/40 border-transparent" : "bg-card border-border",
        isDragging && "shadow-xl border-primary",
      )}
    >
      {/* Main row */}
      <div className="flex items-center gap-2 p-3">
        {/* Drag handle - hidden on mobile */}
        <div
          {...attributes}
          {...listeners}
          className="hidden md:flex cursor-grab p-1 text-muted-foreground hover:text-foreground active:cursor-grabbing flex-shrink-0"
        >
          <GripVertical size={18} />
        </div>

        {/* Check */}
        <button
          onClick={() => onToggleStatus(task)}
          className={clsx("flex-shrink-0 transition-colors", isCompleted ? "text-primary" : "text-muted-foreground hover:text-primary")}
        >
          {isCompleted ? <CheckCircle size={22} /> : <Circle size={22} />}
        </button>

        {/* Title area - tappable to navigate */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onManage?.(task)}>
          <h3 className={clsx("font-medium text-sm truncate", isCompleted && "line-through text-muted-foreground")}>
            {task.title}
          </h3>
          {/* Tags row */}
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <span className={clsx("text-[10px] px-1.5 py-0.5 rounded-full", priorityColors[task.priority])}>
              {task.priority}
            </span>
            <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">{task.category}</span>
            {task.type === "project" && (
              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">Project</span>
            )}
            {task.dueDate && (
              <span className="text-[10px] text-muted-foreground">{new Date(task.dueDate).toLocaleDateString()}</span>
            )}
          </div>
        </div>

        {/* Expand toggle on mobile / actions on desktop */}
        <div className="flex items-center gap-1">
          {/* Desktop action buttons */}
          <div className="hidden md:flex items-center gap-1">
            <button onClick={(e) => { e.stopPropagation(); onCollaborators?.(task); }} className="p-1.5 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors" title="Collaborators">
              <UserPlus size={16} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onEdit(task); }} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Edit">
              <Edit2 size={16} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onManage?.(task); }} className="p-1.5 text-muted-foreground hover:text-indigo-500 hover:bg-indigo-500/10 rounded-lg transition-colors" title="View">
              <ExternalLink size={16} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(task._id); }} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors" title="Delete">
              <Trash2 size={16} />
            </button>
          </div>

          {/* Mobile: expand for actions */}
          <button
            className="md:hidden p-1.5 text-muted-foreground rounded-lg"
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          >
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {/* Progress bar for projects */}
      {task.type === "project" && (
        <div className="px-3 pb-2">
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary" style={{ width: `${task.progress ?? 0}%` }} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">{task.progress ?? 0}% complete</p>
        </div>
      )}

      {/* Collaborator avatars */}
      {task.collaborators?.length > 0 && (
        <div className="px-3 pb-2 flex items-center gap-1.5">
          {task.collaborators.slice(0, 3).map((c) => (
            <div key={c._id} className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-bold" title={c.name}>
              {c.name?.charAt(0)}
            </div>
          ))}
          <span className="text-[10px] text-muted-foreground">{task.collaborators.length} collaborator{task.collaborators.length > 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Mobile expanded actions */}
      {expanded && (
        <div className="md:hidden flex items-center gap-2 px-3 pb-3 pt-1 border-t border-border mt-1">
          <button
            onClick={() => { onManage?.(task); setExpanded(false); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium"
          >
            <ExternalLink size={14} /> View
          </button>
          <button
            onClick={() => { onEdit(task); setExpanded(false); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-muted text-foreground text-xs font-medium"
          >
            <Edit2 size={14} /> Edit
          </button>
          <button
            onClick={() => { onCollaborators?.(task); setExpanded(false); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-amber-500/10 text-amber-600 text-xs font-medium"
          >
            <UserPlus size={14} /> Team
          </button>
          <button
            onClick={() => { onDelete(task._id); setExpanded(false); }}
            className="flex items-center justify-center p-2 rounded-lg bg-destructive/10 text-destructive"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskItem;
