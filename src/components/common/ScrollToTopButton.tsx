import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

interface ScrollToTopButtonProps {
  threshold?: number;
  className?: string;
}

export default function ScrollToTopButton({
  threshold = 400,
  className = ''
}: ScrollToTopButtonProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      setIsVisible(scrollY > threshold);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Check initial position on mount
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [threshold]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <button
      onClick={scrollToTop}
      type="button"
      id="scroll-to-top-button"
      aria-label="Kembali ke atas halaman"
      title="Scroll ke atas"
      className={`fixed bottom-6 right-5 sm:bottom-8 sm:right-8 z-40 p-3 rounded-full bg-slate-900/90 dark:bg-blue-600/90 text-white hover:bg-slate-900 dark:hover:bg-blue-500 shadow-xl shadow-slate-900/20 dark:shadow-blue-500/20 backdrop-blur-md border border-white/20 transition-all duration-300 transform hover:-translate-y-1 active:scale-95 flex items-center justify-center group cursor-pointer animate-fade-in ${className}`}
    >
      <ArrowUp className="w-5 h-5 stroke-[2.5] group-hover:animate-bounce-subtle transition-transform" />
    </button>
  );
}
