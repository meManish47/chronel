import { applyOverdueLogic } from "@/lib/tasks";
import { Task } from "@/types";
import { useAuth, useUser } from "@clerk/clerk-react";
import { createContext, useEffect, useState, useContext } from "react";
import { toast } from "sonner";

interface TaskContextType {
  tasks: Task[];
  fetchTasks: () => Promise<void>;
  addTask: (task: Omit<Task, "id" | "userId" | "createdAt">) => Promise<void>;
  updateTask: (id: number, updates: Partial<Task>) => Promise<void>;
  toggleComplete: (id: number) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
  loadingTasks: boolean;
}

export const TaskContext = createContext<TaskContextType | null>(null);

const API = `${import.meta.env.VITE_API_URL}/api/tasks`;

export const TaskProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoaded } = useUser();
  // const {getToken} = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  const fetchTasks = async () => {
    if (!user) return;
    // const token = getToken;
    try {
      setLoadingTasks(true);
      const res = await fetch(API + `?clerk_id=${user.id}`);
      const data = await res.json();
      setTasks(applyOverdueLogic(data));
    } catch (err) {
      console.error("Fetch Tasks Failed:", err);
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    if (!isLoaded || !user) return;
    fetchTasks();
  }, [isLoaded, user]);

  const addTask = async (task: Omit<Task, "id" | "user_id" | "createdAt">) => {
    // 1. Create a temporary optimistic task
    const optimisticId = Date.now();
    const optimisticTask: Task = {
      ...task,
      id: optimisticId,
      user_id: -1,
      createdAt: new Date().toISOString(),
      status: task.status || "pending",
      priority: task.priority || "medium",
      tags: task.tags || [],
    };

    // 2. Immediately update the UI
    setTasks((prev) => applyOverdueLogic([optimisticTask, ...prev]));

    try {
      // 3. Send to backend
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...task, clerk_id: user?.id }),
      });

      if (!res.ok) {
        throw new Error("Server returned an error");
      }

      const newTask = await res.json();
      
      // 4. Replace the temporary task with the real one from the DB
      setTasks((prev) =>
        applyOverdueLogic(prev.map((t) => (t.id === optimisticId ? newTask : t)))
      );
      
    } catch (err) {
      console.error("Add Task Failed:", err);
      // 5. Rollback on failure and notify the user
      setTasks((prev) => prev.filter((t) => t.id !== optimisticId));
      toast.error("Failed to add task. Please try again.");
    }
  };

  const updateTask = async (id: number, updates: Partial<Task>) => {
    try {
      const res = await fetch(`${API}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      const updated = await res.json();

      setTasks((prev) =>
        applyOverdueLogic(prev.map((t) => (t.id === id ? updated : t))),
      );
    } catch (err) {
      console.error("Update Task Failed:", err);
    }
  };

  const deleteTask = async (id: number) => {
    try {
      await fetch(`${API}/${id}`, { method: "DELETE" });
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Delete Task Failed:", err);
    }
  };

  const toggleComplete = async (id: number) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const completed = task.status !== "completed";

    try {
      const res = await fetch(`${API}/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: completed ? "completed" : "pending",
          completedAt: completed ? new Date().toISOString() : null,
        }),
      });

      const updated = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (err) {
      console.error("Toggle Failed:", err);
    }
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        fetchTasks,
        addTask,
        updateTask,
        deleteTask,
        toggleComplete,
        loadingTasks,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};
