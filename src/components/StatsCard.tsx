import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  variant?: 'default' | 'primary' | 'success' | 'danger';
}

const variantStyles = {
  default: {
    card: 'border-border',
    icon: 'bg-secondary text-secondary-foreground',
    value: 'text-foreground',
  },
  primary: {
    card: 'border-primary/20 bg-primary/5',
    icon: 'bg-primary/20 text-primary',
    value: 'text-primary',
  },
  success: {
    card: 'border-status-completed/20 bg-status-completed/5',
    icon: 'bg-status-completed/15 text-status-completed',
    value: 'text-status-completed',
  },
  danger: {
    card: 'border-status-overdue/20 bg-status-overdue/5',
    icon: 'bg-status-overdue/15 text-status-overdue',
    value: 'text-status-overdue',
  },
};

export default function StatsCard({ label, value, icon: Icon, variant = 'default' }: StatsCardProps) {
  const styles = variantStyles[variant];

  return (
    <div className={cn('rounded-xl border p-5 bg-card transition-all duration-200 hover:bg-background-elevated', styles.card)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', styles.icon)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className={cn('text-3xl font-bold tracking-tight', styles.value)}>{value}</p>
    </div>
  );
}
