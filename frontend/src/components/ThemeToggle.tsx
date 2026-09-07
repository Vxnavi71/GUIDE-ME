import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('guideme_theme') === 'dark' ||
      (!('guideme_theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('guideme_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('guideme_theme', 'light');
    }
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className="p-2 rounded-lg bg-earth-100 hover:bg-earth-200 dark:bg-forest-800 dark:hover:bg-forest-700 text-earth-800 dark:text-sage-200 transition-colors"
      title={isDark ? "Switch to Calm Light mode" : "Switch to Low-energy Dark mode"}
      aria-label="Toggle visual theme"
    >
      {isDark ? <Sun className="w-5 h-5 text-amber-300" /> : <Moon className="w-5 h-5 text-forest-700" />}
    </button>
  );
};
