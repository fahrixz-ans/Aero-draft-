import React from 'react';
import { Menu, X } from 'lucide-react';

interface HamburgerMorphIconProps {
  isOpen: boolean;
  className?: string;
}

export default function HamburgerMorphIcon({ isOpen, className = "w-5 h-5" }: HamburgerMorphIconProps) {
  return (
    <div className={`relative ${className} flex items-center justify-center shrink-0`}>
      <Menu
        className={`absolute inset-0 w-full h-full transition-all duration-[220ms] cubic-bezier(0.16, 1, 0.3, 1) transform ${
          isOpen ? 'opacity-0 rotate-90 scale-75' : 'opacity-100 rotate-0 scale-100'
        }`}
      />
      <X
        className={`absolute inset-0 w-full h-full transition-all duration-[220ms] cubic-bezier(0.16, 1, 0.3, 1) transform ${
          isOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-75'
        }`}
      />
    </div>
  );
}
