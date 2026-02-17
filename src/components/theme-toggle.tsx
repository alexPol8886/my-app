'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className="p-3 rounded-2xl bg-white/50 border border-border shadow-sm hover:shadow-md transition-all active:scale-95"
      aria-label="Toggle Theme"
    >
      <div className="relative h-6 w-6">
        <Sun className="absolute h-6 w-6 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-orange-400" />
        <Moon className="absolute h-6 w-6 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-purple-400" />
      </div>
    </button>
  );
}
