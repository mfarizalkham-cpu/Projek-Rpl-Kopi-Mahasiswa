'use client';

import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check saved theme or system preference
    const savedTheme = localStorage.getItem('kopi_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme ? savedTheme === 'dark' : prefersDark;

    setIsDark(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);

    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('kopi_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('kopi_theme', 'light');
    }

    window.dispatchEvent(new CustomEvent('theme-changed', { detail: { isDark: nextDark } }));
  };

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-full bg-coffee-100 dark:bg-espresso-850 animate-pulse border border-coffee-200 dark:border-coffee-700/50" />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className="relative p-2.5 rounded-full transition-all duration-300 shadow-sm border focus:outline-none focus:ring-2 focus:ring-amber-500/50 group bg-coffee-100 hover:bg-coffee-200 border-coffee-200 text-coffee-800 dark:bg-espresso-850 dark:hover:bg-espresso-800 dark:border-amber-500/30 dark:text-amber-400 dark:shadow-[0_0_15px_rgba(245,158,11,0.15)] active:scale-95"
      title={isDark ? 'Beralih ke Mode Terang (Light Mode)' : 'Beralih ke Mode Gelap (Espresso Dark Mode)'}
      aria-label="Toggle Dark/Light Mode"
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-5 h-5 text-amber-400 transition-all duration-500 rotate-0 scale-100 group-hover:rotate-45 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]" />
        ) : (
          <Moon className="w-5 h-5 text-coffee-800 transition-all duration-500 rotate-0 scale-100 group-hover:-rotate-12" />
        )}
      </div>

      <span className="sr-only">{isDark ? 'Mode Terang' : 'Mode Gelap'}</span>
    </button>
  );
}

