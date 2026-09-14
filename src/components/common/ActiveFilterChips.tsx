import React from 'react';
import { X, Filter, Sparkles, Tag, Star, Calendar, HardDrive, Smartphone, User } from 'lucide-react';

export interface FilterChipItem {
  id: string;
  label: string;
  value: string;
  icon?: React.ReactNode;
  onRemove: () => void;
}

interface ActiveFilterChipsProps {
  chips: FilterChipItem[];
  onClearAll?: () => void;
  className?: string;
  title?: string;
}

export default function ActiveFilterChips({
  chips,
  onClearAll,
  className = '',
  title = 'Filter Aktif:'
}: ActiveFilterChipsProps) {
  if (!chips || chips.length === 0) {
    return null;
  }

  return (
    <div
      id="active-filter-chips-container"
      className={`flex flex-wrap items-center gap-2 py-2 animate-fade-in select-none ${className}`}
    >
      {title && (
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mr-1">
          <Filter className="w-3 h-3 text-blue-500" />
          <span>{title}</span>
        </span>
      )}

      {chips.map((chip) => (
        <div
          key={chip.id}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/50 shadow-2xs group transition-all"
        >
          {chip.icon}
          <span className="text-slate-500 dark:text-slate-400 font-medium">{chip.label}:</span>
          <span className="font-bold text-slate-800 dark:text-white max-w-[140px] truncate">{chip.value}</span>
          <button
            type="button"
            onClick={chip.onRemove}
            aria-label={`Hapus filter ${chip.label}`}
            className="ml-0.5 p-0.5 rounded-md hover:bg-blue-200/70 dark:hover:bg-blue-800/80 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      ))}

      {chips.length > 1 && onClearAll && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs font-bold text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 underline underline-offset-2 px-2 py-1 transition-colors cursor-pointer"
        >
          Hapus Semua
        </button>
      )}
    </div>
  );
}
