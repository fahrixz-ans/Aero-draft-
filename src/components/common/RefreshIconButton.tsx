import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';

interface RefreshIconButtonProps {
  onRefresh?: () => void | Promise<any>;
  isLoading?: boolean;
  label?: string;
  className?: string;
  iconClassName?: string;
  id?: string;
}

export default function RefreshIconButton({
  onRefresh,
  isLoading = false,
  label = 'Segarkan',
  className = '',
  iconClassName = 'w-3.5 h-3.5',
  id
}: RefreshIconButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);
    if (onRefresh) {
      await onRefresh();
    }
  };

  return (
    <button
      id={id}
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl btn-press-feedback transition-colors cursor-pointer select-none ${isLoading ? 'opacity-70 cursor-not-allowed' : ''} ${className}`}
      title={label}
      aria-label={label}
    >
      <RefreshCw
        className={`${iconClassName} ${
          isLoading ? 'animate-spin' : isAnimating ? 'animate-icon-refresh' : ''
        }`}
      />
      {label && <span>{label}</span>}
    </button>
  );
}
