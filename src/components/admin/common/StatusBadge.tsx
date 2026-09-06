import React from 'react';

export type StatusVariant = 
  | 'published' | 'active' | 'success' | 'healthy' | 'safe' | 'approved' | 'resolved'
  | 'pending' | 'investigating' | 'warning' | 'draft' | 'review' | 'in_progress'
  | 'critical' | 'failed' | 'error' | 'rejected' | 'archived' | 'offline' | 'high'
  | 'neutral' | 'info';

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export default function StatusBadge({ 
  status, 
  variant, 
  size = 'md',
  dot = true,
  className = '' 
}: StatusBadgeProps) {
  const normalized = (variant || status || 'neutral').toLowerCase();

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  let dotClass = 'bg-slate-400';

  if (['published', 'active', 'success', 'healthy', 'safe', 'approved', 'resolved'].includes(normalized)) {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60';
    dotClass = 'bg-emerald-500';
  } else if (['pending', 'investigating', 'warning', 'draft', 'review', 'in_progress', 'medium'].includes(normalized)) {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60';
    dotClass = 'bg-amber-500';
  } else if (['critical', 'failed', 'error', 'rejected', 'archived', 'offline', 'high', 'urgent'].includes(normalized)) {
    colorClasses = 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/60';
    dotClass = 'bg-red-500';
  } else if (['info', 'low'].includes(normalized)) {
    colorClasses = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/60';
    dotClass = 'bg-blue-500';
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  // Format label text
  const label = status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());

  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold border rounded-md whitespace-nowrap ${colorClasses} ${sizeClasses} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />}
      <span>{label}</span>
    </span>
  );
}
