import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  route?: string;
  onClick?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onHomeClick?: () => void;
}

export default function Breadcrumb({ items, onHomeClick }: BreadcrumbProps) {
  if (!items || items.length === 0) return null;

  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 my-2 overflow-x-auto py-1">
      <button 
        onClick={onHomeClick}
        className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
        title="Admin Dashboard"
      >
        <Home className="w-3.5 h-3.5" />
        <span className="font-medium">Admin</span>
      </button>
      
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
            {isLast || !item.onClick ? (
              <span className={`font-semibold shrink-0 ${isLast ? 'text-slate-900 dark:text-slate-100 font-bold' : ''}`}>
                {item.label}
              </span>
            ) : (
              <button
                onClick={item.onClick}
                className="hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors shrink-0 cursor-pointer"
              >
                {item.label}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
