// Types for Chronel

export type Priority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'completed' | 'overdue';

export interface Tag {
  id: number;
  name: string;
  color?: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  due_date: string; 
  status: TaskStatus;
  priority: Priority;
  tags: Tag[];
  user_id: number;
  createdAt: string;
  completedAt?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface UserPreferences {
  user_id: number;
  theme: 'dark' | 'light';
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
}

export type FilterTab = 'all' | 'today' | 'upcoming' | 'completed';
