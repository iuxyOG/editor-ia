'use client';

import { cn } from '@/utils/cn';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  glow?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  glow,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-body font-semibold rounded-btn transition-all duration-300',
        size === 'sm' && 'px-3 py-1.5 text-sm',
        size === 'md' && 'px-5 py-2.5 text-sm',
        size === 'lg' && 'px-7 py-3.5 text-base',
        variant === 'primary' &&
          'bg-brand-blue text-white hover:bg-brand-glow active:scale-[0.98]',
        variant === 'secondary' &&
          'bg-bg-tertiary text-text-primary border border-border hover:border-brand-blue/30',
        variant === 'ghost' &&
          'bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-tertiary',
        variant === 'danger' &&
          'bg-error/10 text-error border border-error/20 hover:bg-error/20',
        glow && 'shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_40px_rgba(59,130,246,0.6)]',
        (disabled || loading) && 'opacity-50 cursor-not-allowed',
        'hover:scale-[1.02]',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
