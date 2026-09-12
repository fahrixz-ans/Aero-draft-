import React from 'react';
import { MOD_STATION_LOGO, BRAND_NAME } from '../../config/branding';

interface BrandLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  showText?: boolean;
  textClassName?: string;
  onClick?: () => void;
  id?: string;
}

const SIZE_MAP = {
  xs: 'w-5 h-5',
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
  xl: 'w-16 h-16',
  custom: ''
};

export default function BrandLogo({
  className = '',
  size = 'md',
  showText = true,
  textClassName = '',
  onClick,
  id
}: BrandLogoProps) {
  const sizeClasses = size === 'custom' ? '' : SIZE_MAP[size];

  return (
    <div
      id={id}
      onClick={onClick}
      className={`flex items-center gap-2.5 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <img
        src={MOD_STATION_LOGO}
        alt={`${BRAND_NAME} Logo`}
        className={`${sizeClasses} object-contain shrink-0`}
        referrerPolicy="no-referrer"
      />
      {showText && (
        <span
          className={`font-extrabold tracking-tight text-slate-900 dark:text-white ${
            textClassName || 'text-[15px]'
          }`}
        >
          {BRAND_NAME.toUpperCase()}
        </span>
      )}
    </div>
  );
}
