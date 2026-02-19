import { useState, useEffect } from "react";
import { Task, User } from "@/types";
import { applyOverdueLogic } from "@/lib/tasks";

const AUTH_KEY = "chronel_user";
const API = "http://localhost:5000/api/tasks";


export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(AUTH_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  const login = (email: string, name: string) => {
    const u: User = { id: "u1", name, email };
    localStorage.setItem(AUTH_KEY, JSON.stringify(u));
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    setUser(null);
  };

  return { user, login, logout };
}



export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);

  
  const fetchTasks = async () => {
    try {
      const res = await fetch(API);
      const data = await res.json();
      setTasks(applyOverdueLogic(data));
    } catch (err) {
      console.error("Fetch Tasks Failed:", err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  
  const addTask = async (
    task: Omit<Task, "id" | "userId" | "createdAt">
  ) => {
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: "u1",
          ...task,
        }),
      });

      const newTask = await res.json();

      setTasks((prev) =>
        applyOverdueLogic([newTask, ...prev])
      );
    } catch (err) {
      console.error("Add Task Failed:", err);
    }
  };

  
  const updateTask = async (
    id: string,
    updates: Partial<Task>
  ) => {
    try {
      const res = await fetch(`${API}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      const updated = await res.json();

      setTasks((prev) =>
        applyOverdueLogic(
          prev.map((t) => (t.id === id ? updated : t))
        )
      );
    } catch (err) {
      console.error("Update Task Failed:", err);
    }
  };

  
  const deleteTask = async (id: string) => {
    try {
      await fetch(`${API}/${id}`, {
        method: "DELETE",
      });

      setTasks((prev) =>
        prev.filter((t) => t.id !== id)
      );
    } catch (err) {
      console.error("Delete Task Failed:", err);
    }
  };


  const toggleComplete = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const completed = task.status !== "completed";

    try {
      const res = await fetch(`${API}/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: completed ? "completed" : "pending",
          completedAt: completed
            ? new Date().toISOString()
            : null,
        }),
      });

      const updated = await res.json();

      setTasks((prev) =>
        prev.map((t) => (t.id === id ? updated : t))
      );
    } catch (err) {
      console.error("Toggle Failed:", err);
    }
  };

  return {
    tasks,
    fetchTasks,
    addTask,
    updateTask,
    deleteTask,
    toggleComplete,
  };
}
