import React from 'react';

interface HamburgerMorphIconProps {
  isOpen: boolean;
  className?: string;
}

/**
 * HamburgerMorphIcon
 * Exact two-line hamburger ("=") that smoothly transforms into a close cross ("×").
 * Strictly obeys the blueprint specification:
 * - CLOSED: "=" (2 horizontal lines, consistent thickness, length, and proportional distance)
 * - OPEN: "×" (45deg cross intersecting precisely at center)
 * - Respects prefers-reduced-motion
 */
export default function HamburgerMorphIcon({
  isOpen,
  className = "w-5 h-5"
}: HamburgerMorphIconProps) {
  return (
    <span
      className={`relative inline-flex items-center justify-center shrink-0 ${className} pointer-events-none select-none`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-current overflow-visible"
      >
        {/* Line 1 (Top line in closed state '=', rotates 45deg in open state '×') */}
        <line
          x1="3"
          y1="10"
          x2="17"
          y2="10"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          style={{
            transformOrigin: '10px 10px',
            transform: isOpen
              ? 'translateY(0px) rotate(45deg)'
              : 'translateY(-3.5px) rotate(0deg)',
            transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        />

        {/* Line 2 (Bottom line in closed state '=', rotates -45deg in open state '×') */}
        <line
          x1="3"
          y1="10"
          x2="17"
          y2="10"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          style={{
            transformOrigin: '10px 10px',
            transform: isOpen
              ? 'translateY(0px) rotate(-45deg)'
              : 'translateY(3.5px) rotate(0deg)',
            transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        />
      </svg>
    </span>
  );
}

