'use client';

import { cn } from '@/utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'blue';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variant === 'default' && 'bg-bg-tertiary text-text-secondary border border-border',
        variant === 'success' && 'bg-success/10 text-success border border-success/20',
        variant === 'warning' && 'bg-warning/10 text-warning border border-warning/20',
        variant === 'error' && 'bg-error/10 text-error border border-error/20',
        variant === 'blue' && 'bg-brand-blue/10 text-brand-light border border-brand-blue/20',
        className
      )}
    >
      {children}
    </span>
  );
}
