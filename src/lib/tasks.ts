import { Task, TaskStats, FilterTab } from '@/types';
import { isToday, isFuture, isPast, parseISO } from 'date-fns';

export const SAMPLE_TAGS = [
  { id: '1', name: 'exam' },
  { id: '2', name: 'assignment' },
  { id: '3', name: 'gym' },
  { id: '4', name: 'placement' },
  { id: '5', name: 'project' },
  { id: '6', name: 'reading' },
  { id: '7', name: 'revision' },
];
  
export const SAMPLE_TASKS: Task[] = [
  {
    id: '1',
    title: 'Complete Linear Algebra Problem Set',
    description: 'Chapter 5 – Eigenvalues & Eigenvectors. 20 problems.',
    dueDate: new Date().toISOString().split('T')[0],
    status: 'pending',
    priority: 'high',
    tags: [{ id: '2', name: 'assignment' }],
    userId: 'u1',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Study for Data Structures Exam',
    description: 'Cover Trees, Graphs, and Dynamic Programming.',
    dueDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    status: 'pending',
    priority: 'high',
    tags: [{ id: '1', name: 'exam' }, { id: '7', name: 'revision' }],
    userId: 'u1',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Submit Internship Application – Google',
    description: 'Resume + Cover letter for SWE Intern role.',
    dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    status: 'pending',
    priority: 'medium',
    tags: [{ id: '4', name: 'placement' }],
    userId: 'u1',
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'Morning Workout – Chest & Shoulders',
    description: 'Gym session 7:00 AM',
    dueDate: new Date().toISOString().split('T')[0],
    status: 'completed',
    priority: 'low',
    tags: [{ id: '3', name: 'gym' }],
    userId: 'u1',
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  },
  {
    id: '5',
    title: 'Read "Clean Code" – Chapter 4',
    description: 'Focus on functions and comments.',
    dueDate: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    status: 'overdue',
    priority: 'low',
    tags: [{ id: '6', name: 'reading' }],
    userId: 'u1',
    createdAt: new Date().toISOString(),
  },
  {
    id: '6',
    title: 'Build Portfolio Project – Weather App',
    description: 'React + TypeScript. Use OpenWeatherMap API.',
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    status: 'pending',
    priority: 'medium',
    tags: [{ id: '5', name: 'project' }],
    userId: 'u1',
    createdAt: new Date().toISOString(),
  },
];

export function computeStats(tasks: Task[]): TaskStats {
  return {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    pending: tasks.filter(t => t.status === 'pending').length,
    overdue: tasks.filter(t => t.status === 'overdue').length,
  };
}

export function applyOverdueLogic(tasks: Task[]): Task[] {
  return tasks.map(task => {
    if (task.status === 'pending') {
      const due = parseISO(task.dueDate);
      if (isPast(due) && !isToday(due)) {
        return { ...task, status: 'overdue' as const };
      }
    }
    return task;
  });
}

export function filterTasks(tasks: Task[], filter: FilterTab): Task[] {
  switch (filter) {
    case 'today':
      return tasks.filter(t => isToday(parseISO(t.dueDate)));
    case 'upcoming':
      return tasks.filter(t => isFuture(parseISO(t.dueDate)) && !isToday(parseISO(t.dueDate)) && t.status !== 'completed');
    case 'completed':
      return tasks.filter(t => t.status === 'completed');
    default:
      return tasks;
  }
}
