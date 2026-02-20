import { Task } from "@/types";
import { format } from "date-fns";
import { Calendar, Tag, Trash2, Circle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
}

function toLocalDate(dateStr: string) {
  const d = new Date(dateStr);

  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

const priorityConfig = {
  low: {
    label: "Low",
    class: "text-priority-low border-priority-low/30 bg-priority-low/10",
  },
  medium: {
    label: "Medium",
    class:
      "text-priority-medium border-priority-medium/30 bg-priority-medium/10",
  },
  high: {
    label: "High",
    class: "text-priority-high border-priority-high/30 bg-priority-high/10",
  },
};

const statusConfig = {
  pending: { dot: "bg-status-pending", text: "text-status-pending" },
  completed: { dot: "bg-status-completed", text: "text-status-completed" },
  overdue: { dot: "bg-status-overdue", text: "text-status-overdue" },
};

export default function TaskCard({ task, onToggle, onDelete }: TaskCardProps) {
  const isCompleted = task.status === "completed";
  const isOverdue = task.status === "overdue";
  const priority = priorityConfig[task.priority];
  const status = statusConfig[task.status];
  return (
    <div
      className={cn(
        "group relative flex items-start gap-4 rounded-xl border p-4 transition-all duration-200",
        "bg-card hover:bg-background-elevated",
        isCompleted
          ? "border-border/40 opacity-60"
          : "border-border hover:border-border-subtle",
        isOverdue &&
          !isCompleted &&
          "border-status-overdue/20 bg-status-overdue/5",
      )}
    >
      <button
        onClick={() => onToggle(task.id)}
        className="mt-0.5 flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
      >
        {isCompleted ? (
          <CheckCircle2 className="h-5 w-5 text-status-completed" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3
            className={cn(
              "text-sm font-medium leading-snug",
              isCompleted
                ? "line-through text-muted-foreground"
                : "text-foreground",
            )}
          >
            {task.title}
          </h3>
          <span
            className={cn(
              "flex-shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded border",
              priority.class,
            )}
          >
            {priority.label}
          </span>
        </div>

        {task.description && (
          <p className="text-xs text-muted-foreground mb-2 leading-relaxed line-clamp-1">
            {task.description}
          </p>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <span
            className={cn(
              "flex items-center gap-1 text-xs",
              isOverdue ? "text-status-overdue" : "text-muted-foreground",
            )}
          >
            <Calendar className="h-3 w-3" />
            {task.due_date
              ? format(toLocalDate(task.due_date), "MMM d, yyyy")
              : "No due date"}
          </span>

          <span className={cn("flex items-center gap-1 text-xs", status.text)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
            {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
          </span>

          {task.tags
            ? task.tags.length > 0 && (
                <div className="flex items-center gap-1">
                  <Tag className="h-3 w-3 text-muted-foreground" />
                  <div className="flex gap-1 flex-wrap">
                    {task.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag.id}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20"
                      >
                        {tag.name}
                      </span>
                    ))}
                    {task.tags.length > 2 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        +{task.tags.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              )
            : null}
        </div>
      </div>

      <button
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 rounded text-muted-foreground hover:text-destructive transition-all duration-150 mt-0.5"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
