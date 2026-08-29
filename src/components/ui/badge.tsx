import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'paid' | 'partial' | 'overdue' | 'draft' | 'issued' | 'neutral' | 'primary' | 'cancelled';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'neutral',
  size = 'md',
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center font-medium uppercase tracking-wider rounded-sm select-none';

  const variants = {
    paid: 'bg-emerald-50 text-[#0E7A55] border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300',
    partial: 'bg-amber-50 text-[#9A6608] border border-amber-200 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300',
    overdue: 'bg-rose-50 text-[#B22C22] border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300',
    draft: 'bg-zinc-100 text-zinc-600 border border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400',
    issued: 'bg-blue-50 text-[#2B49B8] border border-blue-200 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300',
    cancelled: 'bg-rose-100/90 text-[#B22C22] border border-rose-300 dark:bg-rose-950/60 dark:border-rose-700 dark:text-rose-300 font-bold',
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300',
    primary: 'bg-primary/10 text-primary border border-primary/20',
  };

  const sizes = {
    sm: 'text-[10px] px-1.5 py-0.5 leading-none',
    md: 'text-xs px-2.5 py-1 leading-tight',
  };

  return (
    <span className={cn(baseStyles, variants[variant], sizes[size], className)} {...props}>
      {children}
    </span>
  );
};
