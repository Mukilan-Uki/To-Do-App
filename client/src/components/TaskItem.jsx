import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Edit2,
  Trash2,
  CheckCircle,
  Circle,
  Users,
} from "lucide-react";
import clsx from "clsx";

const TaskItem = ({ task, onEdit, onDelete, onToggleStatus, onManage }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task._id });

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
        "group flex items-center gap-4 p-4 mb-3 rounded-xl border transition-colors",
        isCompleted
          ? "bg-muted/50 border-transparent"
          : "bg-card border-border hover:border-primary/50",
        isDragging && "shadow-xl border-primary",
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab p-1 text-muted-foreground hover:text-foreground active:cursor-grabbing"
      >
        <GripVertical size={20} />
      </div>

      <button
        onClick={() => onToggleStatus(task)}
        className={clsx(
          "flex-shrink-0 transition-colors",
          isCompleted
            ? "text-primary"
            : "text-muted-foreground hover:text-primary",
        )}
      >
        {isCompleted ? <CheckCircle size={24} /> : <Circle size={24} />}
      </button>

      <div className="flex-1 min-w-0">
        <h3
          className={clsx(
            "font-medium truncate transition-all",
            isCompleted && "line-through text-muted-foreground",
          )}
        >
          {task.title}
        </h3>
        {task.description && (
          <p className="text-sm text-muted-foreground truncate">
            {task.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span
            className={clsx(
              "text-xs px-2 py-0.5 rounded-full",
              priorityColors[task.priority],
            )}
          >
            {task.priority}
          </span>
          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
            {task.category}
          </span>
          {task.dueDate && (
            <span className="text-xs text-muted-foreground">
              {new Date(task.dueDate).toLocaleDateString()}
            </span>
          )}
        </div>

        {task.type === "project" && (
          <div className="mt-3">
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${task.progress ?? 0}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {task.progress ?? 0}% complete
            </p>
          </div>
        )}

        {task.collaborators?.length > 0 && (
          <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
            {task.collaborators.slice(0, 3).map((collaborator) => (
              <div
                key={collaborator._id}
                className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold"
              >
                {collaborator.name?.charAt(0) || collaborator.email?.charAt(0)}
              </div>
            ))}
            <span>
              {task.collaborators.length === 1
                ? "1 collaborator"
                : `${task.collaborators.length} collaborators`}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 opacity-100 transition-opacity">
        <button
          onClick={() => onManage?.(task)}
          className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
          title="Manage task"
        >
          <Users size={18} />
        </button>
        <button
          onClick={() => onEdit(task)}
          className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
        >
          <Edit2 size={18} />
        </button>
        <button
          onClick={() => onDelete(task._id)}
          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

export default TaskItem;
