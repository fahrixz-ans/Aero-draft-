import { useState, useEffect } from 'react';

/**
 * Hook to reliably detect viewport breakpoint (default: 768px for md breakpoint)
 * Ensures desktop and mobile navigation elements are strictly conditionally rendered.
 */
export function useResponsive(breakpoint = 768) {
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= breakpoint;
    }
    return true;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= breakpoint);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return {
    isDesktop,
    isMobile: !isDesktop
  };
}
