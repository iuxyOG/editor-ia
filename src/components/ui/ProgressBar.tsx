'use client';

import { cn } from '@/utils/cn';

interface ProgressBarProps {
  value: number;
  className?: string;
  animated?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ProgressBar({ value, className, animated = true, size = 'md' }: ProgressBarProps) {
  return (
    <div
      className={cn(
        'w-full bg-bg-tertiary rounded-full overflow-hidden',
        size === 'sm' && 'h-1.5',
        size === 'md' && 'h-2.5',
        size === 'lg' && 'h-4',
        className
      )}
    >
      <div
        className={cn(
          'h-full rounded-full transition-all duration-500 ease-out',
          animated ? 'progress-gradient' : 'bg-brand-blue'
        )}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
