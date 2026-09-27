import { Moon, Sun } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';

export function ThemeToggle() {
  const { darkMode, toggleDarkMode } = useUIStore();

  return (
    <button
      onClick={toggleDarkMode}
      className="w-10 h-10 rounded-lg flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
      aria-label="Toggle dark mode"
    >
      {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
