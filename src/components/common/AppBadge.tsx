import React from 'react';
import { 
  Star, 
  Flame, 
  CheckCircle2, 
  Sparkles, 
  RefreshCw, 
  ArrowUpCircle,
  ShieldCheck, 
  Wrench,
  LucideIcon 
} from 'lucide-react';

export type AppBadgeType = 
  | 'featured' 
  | 'popular' 
  | 'verified' 
  | 'new' 
  | 'updated' 
  | 'downloaded' 
  | 'safe' 
  | 'mod'
  | 'custom';

export interface AppBadgeProps {
  key?: React.Key;
  type?: AppBadgeType;
  label?: string;
  icon?: LucideIcon | React.ReactNode;
  iconColorClass?: string;
  title?: string;
  size?: 'sm' | 'md';
  className?: string;
  id?: string;
}

/**
 * Redesigned Unified AppBadge Component
 * Rules:
 * - Neutral white/dark background across all badge types
 * - Black text & border in Light mode, White text & border in Dark mode
 * - Accent color ONLY on the icon matching its specific semantic meaning
 */
export function AppBadge({
  type = 'custom',
  label,
  icon,
  iconColorClass,
  title,
  size = 'sm',
  className = '',
  id
}: AppBadgeProps) {
  // Resolve default label, icon, and icon accent color based on type
  let defaultLabel = label || '';
  let DefaultIcon: LucideIcon | null = null;
  let defaultIconColor = 'text-blue-500 dark:text-blue-400';

  switch (type) {
    case 'featured':
      defaultLabel = label || 'Featured';
      DefaultIcon = Star;
      defaultIconColor = 'text-amber-500 fill-amber-500/20';
      break;
    case 'popular':
      defaultLabel = label || 'Populer';
      DefaultIcon = Flame;
      defaultIconColor = 'text-orange-500 fill-orange-500/20';
      break;
    case 'verified':
      defaultLabel = label || 'Terverifikasi';
      DefaultIcon = CheckCircle2;
      defaultIconColor = 'text-blue-500 dark:text-blue-400';
      break;
    case 'new':
      defaultLabel = label || 'Baru';
      DefaultIcon = Sparkles;
      defaultIconColor = 'text-emerald-500 dark:text-emerald-400';
      break;
    case 'updated':
      defaultLabel = label || 'Update';
      DefaultIcon = RefreshCw;
      defaultIconColor = 'text-indigo-500 dark:text-indigo-400';
      break;
    case 'downloaded':
      defaultLabel = label || 'Terunduh';
      DefaultIcon = CheckCircle2;
      defaultIconColor = 'text-emerald-500 dark:text-emerald-400';
      break;
    case 'safe':
      defaultLabel = label || 'Aman';
      DefaultIcon = ShieldCheck;
      defaultIconColor = 'text-emerald-500 dark:text-emerald-400';
      break;
    case 'mod':
      defaultLabel = label || 'MOD';
      DefaultIcon = Wrench;
      defaultIconColor = 'text-purple-500 dark:text-purple-400';
      break;
    default:
      defaultLabel = label || '';
      break;
  }

  const finalIconColor = iconColorClass || defaultIconColor;

  // Size styling classes
  const sizeClasses = size === 'md'
    ? 'px-3 py-1 text-xs gap-1.5 rounded-xl h-7 sm:h-8'
    : 'px-2.5 py-0.5 text-[11px] gap-1.5 rounded-lg h-6 sm:h-6.5';

  const iconSize = size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3';

  // Render icon
  const renderIcon = () => {
    if (React.isValidElement(icon)) {
      return icon;
    }
    if (icon && typeof icon !== 'string') {
      const CustomIconComp = icon as LucideIcon;
      return <CustomIconComp className={`${iconSize} ${finalIconColor} shrink-0`} />;
    }
    if (DefaultIcon) {
      return <DefaultIcon className={`${iconSize} ${finalIconColor} shrink-0`} />;
    }
    return null;
  };

  return (
    <span
      id={id}
      title={title || defaultLabel}
      className={`inline-flex items-center font-semibold tracking-tight transition-all duration-200 select-none bg-white text-slate-900 border border-slate-900/80 dark:bg-[#0b0f19] dark:text-white dark:border-white/80 shadow-xs ${sizeClasses} ${className}`}
    >
      {renderIcon()}
      <span className="truncate">{defaultLabel}</span>
    </span>
  );
}

export default AppBadge;
