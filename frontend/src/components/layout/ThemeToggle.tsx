"use client";

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Laptop } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-9 w-9 rounded-lg bg-muted/40 animate-pulse" />;
  }

  const toggleTheme = () => {
    if (theme === 'dark') setTheme('light');
    else if (theme === 'light') setTheme('system');
    else setTheme('dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shadow-sm"
      title={`Theme: ${theme || 'system'} (Click to cycle)`}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Moon className="h-4 w-4 text-indigo-400" />
      ) : theme === 'light' ? (
        <Sun className="h-4 w-4 text-amber-500" />
      ) : (
        <Laptop className="h-4 w-4 text-muted-foreground" />
      )}
    </button>
  );
}
