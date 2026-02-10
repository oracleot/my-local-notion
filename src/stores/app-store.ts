import { create } from "zustand";
import type { FocusSession, FocusSettings } from "@/types";

// ─── Session persistence ────────────────────────────────────────────────────
const SESSION_KEY = "focus-session";

function persistSession(session: FocusSession | null) {
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

function loadPersistedSession(): FocusSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as FocusSession;
    // Keep running sessions as-is. getRemainingSeconds() uses wall-clock math
    // to compute correct remaining time, even after app restart. If the session
    // completed while the app was closed, remaining time will be 0.
    return session;
  } catch {
    return null;
  }
}

/** Compute remaining seconds from a session snapshot */
export function getRemainingSeconds(session: FocusSession): number {
  let elapsed = session.elapsedBeforePause;
  if (session.isRunning) {
    elapsed += (Date.now() - session.startedAt) / 1000;
  }
  return Math.max(0, Math.ceil(session.totalSeconds - elapsed));
}

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
    activeSession: loadPersistedSession(),
    focusSettings: { workMinutes: 60, breakMinutes: 10, audioEnabled: true },

    // Zen mode
    zenMode: false,
    toggleZenMode: () => {
      const session = get().activeSession;
      if (!session) return; // No-op if no active session
      set((s) => ({ zenMode: !s.zenMode }));
    },

    startSession: ({ cardId, cardTitle, boardName, pageId, timeBlockId, durationSeconds }) => {
      const session: FocusSession = {
        cardId,
        cardTitle,
        boardName,
        pageId,
        timeBlockId: timeBlockId ?? null,
        totalSeconds: durationSeconds,
        startedAt: Date.now(),
        elapsedBeforePause: 0,
        isRunning: true,
      };
      persistSession(session);
      set({ activeSession: session });
    },

    pauseSession: () => {
      const session = get().activeSession;
      if (!session || !session.isRunning) return;
      const elapsed = session.elapsedBeforePause + (Date.now() - session.startedAt) / 1000;
      const updated: FocusSession = {
        ...session,
        elapsedBeforePause: Math.min(elapsed, session.totalSeconds),
        isRunning: false,
        startedAt: 0,
      };
      persistSession(updated);
      set({ activeSession: updated });
    },

    resumeSession: () => {
      const session = get().activeSession;
      if (!session) return;
      const updated: FocusSession = {
        ...session,
        startedAt: Date.now(),
        isRunning: true,
      };
      persistSession(updated);
      set({ activeSession: updated });
    },

    endSession: () => {
      persistSession(null);
      set({ activeSession: null, zenMode: false });
    },

    extendSession: (additionalSeconds) => {
      const session = get().activeSession;
      if (!session) return;

      const runningElapsed = session.isRunning
        ? (Date.now() - session.startedAt) / 1000
        : 0;
      const elapsed = session.elapsedBeforePause + runningElapsed;

      const nextTotal = Math.max(elapsed, session.totalSeconds + additionalSeconds);

      const updated: FocusSession = {
        ...session,
        totalSeconds: nextTotal,
      };
      persistSession(updated);
      set({ activeSession: updated });
    },

    loadFocusSettings: (settings) => {
      set({ focusSettings: settings });
    },
  };
});
