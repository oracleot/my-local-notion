import { create } from "zustand";
import type { FocusSession, FocusSettings } from "@/types";

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

  // Focus mode
  activeSession: FocusSession | null;
  focusSettings: Pick<FocusSettings, "workMinutes" | "breakMinutes" | "audioEnabled">;
  startSession: (params: {
    cardId: string;
    cardTitle: string;
    boardName: string;
    pageId: string;
    timeBlockId?: string | null;
    durationSeconds: number;
  }) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  tickSession: () => void;
  endSession: () => void;
  extendSession: (additionalSeconds: number) => void;
  loadFocusSettings: (settings: Pick<FocusSettings, "workMinutes" | "breakMinutes" | "audioEnabled">) => void;

  // Zen mode
  zenMode: boolean;
  toggleZenMode: () => void;
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

    // Focus mode
    activeSession: null,
    focusSettings: { workMinutes: 60, breakMinutes: 10, audioEnabled: true },

    // Zen mode
    zenMode: false,
    toggleZenMode: () => {
      const session = get().activeSession;
      if (!session) return; // No-op if no active session
      set((s) => ({ zenMode: !s.zenMode }));
    },

    startSession: ({ cardId, cardTitle, boardName, pageId, timeBlockId, durationSeconds }) => {
      set({
        activeSession: {
          cardId,
          cardTitle,
          boardName,
          pageId,
          timeBlockId: timeBlockId ?? null,
          remainingSeconds: durationSeconds,
          isRunning: true,
        },
      });
    },

    pauseSession: () => {
      const session = get().activeSession;
      if (session) set({ activeSession: { ...session, isRunning: false } });
    },

    resumeSession: () => {
      const session = get().activeSession;
      if (session) set({ activeSession: { ...session, isRunning: true } });
    },

    tickSession: () => {
      const session = get().activeSession;
      if (!session || !session.isRunning) return;
      const next = session.remainingSeconds - 1;
      if (next <= 0) {
        set({ activeSession: { ...session, remainingSeconds: 0, isRunning: false } });
      } else {
        set({ activeSession: { ...session, remainingSeconds: next } });
      }
    },

    endSession: () => {
      set({ activeSession: null, zenMode: false });
    },

    extendSession: (additionalSeconds) => {
      const session = get().activeSession;
      if (session) {
        set({
          activeSession: {
            ...session,
            remainingSeconds: session.remainingSeconds + additionalSeconds,
            isRunning: true,
          },
        });
      }
    },

    loadFocusSettings: (settings) => {
      set({ focusSettings: settings });
    },
  };
});
