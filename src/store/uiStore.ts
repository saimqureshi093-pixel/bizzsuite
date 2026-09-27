import { create } from 'zustand';

export type Toast = {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
};

export type ThemeMode = 'light' | 'dark' | 'system';

type UIState = {
  darkMode: boolean;
  themeMode: ThemeMode;
  sidebarCollapsed: boolean;
  toasts: Toast[];
  setThemeMode: (mode: ThemeMode) => void;
  toggleDarkMode: () => void;
  initDarkMode: () => void;
  toggleSidebar: () => void;
  addToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
};

function applyTheme(mode: ThemeMode): boolean {
  let isDark: boolean;
  if (mode === 'dark') isDark = true;
  else if (mode === 'light') isDark = false;
  else isDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (typeof window !== 'undefined') {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }
  return isDark;
}

export const useUIStore = create<UIState>((set, get) => ({
  darkMode: false,
  themeMode: 'system',
  sidebarCollapsed: false,
  toasts: [],

  setThemeMode: (mode) => {
    const isDark = applyTheme(mode);
    if (typeof window !== 'undefined') localStorage.setItem('bizzsuite-theme', mode);
    set({ themeMode: mode, darkMode: isDark });
  },

  toggleDarkMode: () => {
    const newMode = !get().darkMode;
    set({ darkMode: newMode, themeMode: newMode ? 'dark' : 'light' });
    if (typeof window !== 'undefined') {
      localStorage.setItem('bizzsuite-theme', newMode ? 'dark' : 'light');
      if (newMode) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    }
  },

  initDarkMode: () => {
    if (typeof window === 'undefined') return;
    const stored = (localStorage.getItem('bizzsuite-theme') as ThemeMode | null) ?? 'system';
    const isDark = applyTheme(stored);
    set({ themeMode: stored, darkMode: isDark });
  },

  toggleSidebar: () => set((state) => {
    const collapsed = !state.sidebarCollapsed;
    if (typeof window !== 'undefined') localStorage.setItem('bizzsuite-sidebar-collapsed', String(collapsed));
    return { sidebarCollapsed: collapsed };
  }),

  addToast: (message, type = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => {
      get().removeToast(id);
    }, 4000);
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));
