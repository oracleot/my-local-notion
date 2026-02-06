import { create } from "zustand";

type Theme = "light" | "dark" | "system";

interface AppState {
  // Sidebar
  sidebarOpen: boolean;
  sidebarWidth: number;
  toggleSidebar: () => void;
  setSidebarWidth: (width: number) => void;

  // Active page
  activePageId: string | null;
  setActivePage: (id: string | null) => void;

  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;
  cycleTheme: () => void;
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  root.classList.toggle("dark", isDark);
  localStorage.setItem("theme", theme);
}

function getInitialTheme(): Theme {
  const stored = localStorage.getItem("theme") as Theme | null;
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "system";
}

// Listen for system theme changes when in "system" mode
let mediaQueryListener: (() => void) | null = null;

function setupSystemThemeListener(theme: Theme) {
  // Remove existing listener
  if (mediaQueryListener) {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .removeEventListener("change", mediaQueryListener);
    mediaQueryListener = null;
  }

  // Add new listener only if in system mode
  if (theme === "system") {
    mediaQueryListener = () => applyTheme("system");
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", mediaQueryListener);
  }
}

const initialTheme = getInitialTheme();

export const useAppStore = create<AppState>()((set, get) => {
  // Apply initial theme and setup listener
  applyTheme(initialTheme);
  setupSystemThemeListener(initialTheme);

  return {
    sidebarOpen: true,
    sidebarWidth: 260,
    toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
    setSidebarWidth: (width) => set({ sidebarWidth: width }),

    activePageId: null,
    setActivePage: (id) => set({ activePageId: id }),

    theme: initialTheme,
    setTheme: (theme) => {
      applyTheme(theme);
      setupSystemThemeListener(theme);
      set({ theme });
    },
    cycleTheme: () => {
      const current = get().theme;
      const next: Theme =
        current === "light" ? "dark" : current === "dark" ? "system" : "light";
      applyTheme(next);
      setupSystemThemeListener(next);
      set({ theme: next });
    },
  };
});
