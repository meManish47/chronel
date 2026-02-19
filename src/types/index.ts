// Types for Chronel

export type Priority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'completed' | 'overdue';

export interface Tag {
  id: string;
  name: string;
  color?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string; 
  status: TaskStatus;
  priority: Priority;
  tags: Tag[];
  userId: string;
  createdAt: string;
  completedAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface UserPreferences {
  userId: string;
  theme: 'dark' | 'light';
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
}

export type FilterTab = 'all' | 'today' | 'upcoming' | 'completed';
