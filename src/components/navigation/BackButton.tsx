import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  onBack?: () => void;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  label?: string;
  className?: string;
  showText?: boolean;
  id?: string;
  disabled?: boolean;
}

/**
 * Reusable BackButton component for Mod Station.
 * Standardizes the browser navigation history with fallback, micro-animations,
 * and built-in protection against double clicks.
 */
export default function BackButton({ 
  onBack, 
  onClick, 
  label, 
  className = '', 
  showText = false,
  id,
  disabled: externalDisabled = false
}: BackButtonProps) {
  const [disabled, setDisabled] = useState(false);
  const [isPushing, setIsPushing] = useState(false);

  const handleBackClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (disabled || externalDisabled) return;
    
    setIsPushing(true);
    setTimeout(() => setIsPushing(false), 180);

    // Prevent double clicking rapidly to avoid history jumping too far
    setDisabled(true);
    setTimeout(() => {
      setDisabled(false);
    }, 450);

    if (onBack) {
      onBack();
    } else if (onClick) {
      onClick(e);
    } else {
      if (window.history && window.history.length > 1) {
        window.history.back();
      } else {
        window.location.hash = '';
      }
    }
  };

  return (
    <button
      id={id}
      onClick={handleBackClick}
      disabled={disabled || externalDisabled}
      type="button"
      aria-label={label || "Kembali ke halaman sebelumnya"}
      className={`group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-white/10 hover:text-blue-600 dark:hover:text-blue-400 btn-press-feedback cursor-pointer shadow-xs select-none shrink-0 ${disabled || externalDisabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      <ArrowLeft className={`w-4 h-4 stroke-[2.5] ${isPushing ? 'animate-icon-arrow-left' : 'group-hover:-translate-x-0.5 transition-transform'}`} />
      {(showText || label) && (
        <span className="text-xs font-black tracking-tight">{label || 'Kembali'}</span>
      )}
    </button>
  );
}
