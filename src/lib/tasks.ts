import { Task, TaskStats, FilterTab } from "@/types";

export const SAMPLE_TAGS = [
  { id: 1, name: "exam" },
  { id: 2, name: "assignment" },
  { id: 3, name: "gym" },
  { id: 4, name: "placement" },
  { id: 5, name: "project" },
  { id: 6, name: "reading" },
  { id: 7, name: "revision" },
];


function toLocalDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d); // local midnight
}


export async function getTasks(pool) {
  const { rows } = await pool.query(`
    SELECT id, title, description, due_date, status, priority, user_id, created_at, completed_at
    FROM tasks
    ORDER BY due_date ASC
  `);

  return rows.map((task) => ({
    ...task,
    due_date: task.due_date
      ? task.due_date.toISOString().split("T")[0]
      : null,
    createdAt: task.created_at?.toISOString(),
    completedAt: task.completed_at?.toISOString() ?? null,
    tags: [], // keeping static tags for now
  }));
}


export function computeStats(tasks: Task[]): TaskStats {
  return {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === "completed").length,
    pending: tasks.filter((t) => t.status === "pending").length,
    overdue: tasks.filter((t) => t.status === "overdue").length,
  };
}


export function applyOverdueLogic(tasks: Task[]): Task[] {

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return tasks.map((task) => {

    if (task.status === "pending" && task.due_date) {

      const dueDay = toLocalDate(task.due_date);

      if (dueDay < today) {
        return { ...task, status: "overdue" as const };
      }
    }

    return task;
  });
}


export function filterTasks(tasks: Task[], filter: FilterTab): Task[] {

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return tasks.filter((t) => {

    if (!t.due_date) return false;

    const dueDay = toLocalDate(t.due_date);

    switch (filter) {

      case "today":
        return dueDay.getTime() === today.getTime();

      case "upcoming":
        return dueDay > today && t.status !== "completed";

      case "completed":
        return t.status === "completed";

      default:
        return true;
    }
  });
}