import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  LogOut,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { User } from '@/types';

interface SidebarProps {
  user: User;
  onLogout: () => void;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: CheckSquare, label: 'Tasks', href: '/tasks' },
];

export default function Sidebar({ user, onLogout }: SidebarProps) {
  const location = useLocation();

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 py-6 border-b border-sidebar-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Zap className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-lg font-semibold tracking-tight text-foreground">
          Chronel
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ icon: Icon, label, href }) => {
          const active = location.pathname === href;
          return (
            <Link
              key={href}
              to={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <Icon
                className={cn(
                  'h-4 w-4 flex-shrink-0',
                  active ? 'text-primary' : 'text-sidebar-foreground'
                )}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary text-sm font-semibold flex-shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-sidebar-accent-foreground truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
