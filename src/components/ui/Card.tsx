'use client';

import { cn } from '@/utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className, hover }: CardProps) {
  return (
    <div
      className={cn(
        'glass-card p-6 animate-fade-in',
        hover && 'hover:border-brand-blue/30 hover:scale-[1.01] transition-all duration-300 cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}
