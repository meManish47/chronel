import { useState } from 'react';
import { format } from 'date-fns';
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  ListTodo,
  Plus,
  Search,
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import StatsCard from '@/components/StatsCard';
import TaskCard from '@/components/TaskCard';
import AddTaskModal from '@/components/AddTaskModal';
import { useAuth, useTasks } from '@/hooks/useChronel';
import { computeStats, filterTasks } from '@/lib/tasks';
import { FilterTab } from '@/types';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'All Tasks' },
  { id: 'today', label: 'Today' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'completed', label: 'Completed' },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { tasks, addTask, toggleComplete, deleteTask } = useTasks();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  if (!user) {
    navigate('/login');
    return null;
  }

  const stats = computeStats(tasks);
  const filtered = filterTasks(tasks, activeFilter).filter(t =>
    search
      ? t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.tags.some(tag => tag.name.toLowerCase().includes(search.toLowerCase()))
      : true
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar user={user} onLogout={() => { logout(); navigate('/login'); }} />

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 px-8 py-6 border-b border-border bg-background">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                {format(new Date(), 'EEEE, MMMM d, yyyy')}
              </p>
              <h1 className="text-xl font-semibold text-foreground">
                {getGreeting()}, {user.name.split(' ')[0]} 👋
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {stats.pending > 0
                  ? `You have ${stats.pending} pending task${stats.pending > 1 ? 's' : ''} to focus on.`
                  : 'All caught up! Great work.'}
              </p>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-glow transition-colors shadow-accent"
            >
              <Plus className="h-4 w-4" />
              Add Task
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-thin px-8 py-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard label="Total" value={stats.total} icon={ListTodo} variant="default" />
            <StatsCard label="Completed" value={stats.completed} icon={CheckSquare} variant="success" />
            <StatsCard label="Pending" value={stats.pending} icon={Clock} variant="primary" />
            <StatsCard label="Overdue" value={stats.overdue} icon={AlertTriangle} variant="danger" />
          </div>

          {/* Filters + Search */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* Tabs */}
            <div className="flex gap-0.5 p-1 rounded-lg bg-secondary border border-border">
              {FILTER_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={cn(
                    'px-3.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150',
                    activeFilter === tab.id
                      ? 'bg-background-elevated text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative flex-1 min-w-48 max-w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search tasks or tags..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-input bg-background-subtle text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
              />
            </div>
          </div>

          {/* Task List */}
          <div className="space-y-2.5">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                  <CheckSquare className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">No tasks here</p>
                <p className="text-xs text-muted-foreground">
                  {search ? 'No tasks match your search.' : 'Add a task to get started.'}
                </p>
              </div>
            ) : (
              filtered.map(task => (
                <div key={task.id} className="animate-fade-in">
                  <TaskCard
                    task={task}
                    onToggle={toggleComplete}
                    onDelete={deleteTask}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <AddTaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={addTask}
      />
    </div>
  );
}
