import { useState } from "react";
import { X, Plus, Calendar, AlignLeft, Tag } from "lucide-react";
import { Task, Priority, Tag as TagType } from "@/types";
import { SAMPLE_TAGS } from "@/lib/tasks";
import { cn } from "@/lib/utils";

interface AddTaskModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (task: Omit<Task, "id" | "userId" | "createdAt">) => void;
}

const PRIORITIES: { value: Priority; label: string; class: string }[] = [
  {
    value: "low",
    label: "Low",
    class:
      "text-priority-low border-priority-low/40 bg-priority-low/10 data-[active=true]:bg-priority-low/20 data-[active=true]:border-priority-low",
  },
  {
    value: "medium",
    label: "Medium",
    class:
      "text-priority-medium border-priority-medium/40 bg-priority-medium/10 data-[active=true]:bg-priority-medium/20 data-[active=true]:border-priority-medium",
  },
  {
    value: "high",
    label: "High",
    class:
      "text-priority-high border-priority-high/40 bg-priority-high/10 data-[active=true]:bg-priority-high/20 data-[active=true]:border-priority-high",
  },
];

export default function AddTaskModal({
  open,
  onClose,
  onAdd,
}: AddTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [due_date, setDueDate] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [selectedTags, setSelectedTags] = useState<TagType[]>([]);

  if (!open) return null;

  const toggleTag = (tag: TagType) => {
    setSelectedTags((prev) =>
      prev.some((t) => t.id === tag.id)
        ? prev.filter((t) => t.id !== tag.id)
        : [...prev, tag],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !due_date) return;
    // console.log("Adding Task:", {
    //   title,
    //   description,
    //   due_date,
    //   priority,
    //   selectedTags,
    // });

    onAdd({
      title: title.trim(),
      description: description.trim() || undefined,
      due_date,
      status: "pending",
      priority,
      tags: selectedTags,
    });
    setTitle("");
    setDescription("");
    setDueDate("");
    setPriority("medium");
    setSelectedTags([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg animate-scale-in rounded-2xl border border-border bg-card shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold text-foreground">
              New Task
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Task Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Study for Data Structures exam"
              required
              className="w-full rounded-lg border border-input bg-background-subtle px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <AlignLeft className="h-3 w-3" />
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes or details..."
              rows={2}
              className="w-full resize-none rounded-lg border border-input bg-background-subtle px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
            />
          </div>

          {/* Due Date */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <Calendar className="h-3 w-3" />
              Due Date *
            </label>
            <input
              type="date"
              value={due_date}
              onChange={(e) => setDueDate(e.target.value)}
              required
              min={new Date().toISOString().split("T")[0]}
              className="w-full rounded-lg border border-input bg-background-subtle px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all [color-scheme:dark]"
            />
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Priority
            </label>
            <div className="flex gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  data-active={priority === p.value}
                  onClick={() => setPriority(p.value)}
                  className={cn(
                    "flex-1 py-1.5 text-xs font-medium rounded-lg border transition-all",
                    p.class,
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <Tag className="h-3 w-3" />
              Tags
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_TAGS.map((tag) => {
                const active = selectedTags.some((t) => t.id === tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs border transition-all",
                      active
                        ? "bg-primary/20 border-primary/50 text-primary"
                        : "bg-secondary border-border text-muted-foreground hover:border-primary/30 hover:text-foreground",
                    )}
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !due_date}
              className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-glow transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
