# Phase 7 — Light/Dark Mode

- [x] **7.1** Add theme state to Zustand store (`src/stores/app-store.ts`)
  - `theme: "light" | "dark" | "system"` (default `"system"`)
  - `setTheme(theme)` action — applies/removes `.dark` class on `document.documentElement`, persists to `localStorage`
  - For `"system"`, resolve via `window.matchMedia("(prefers-color-scheme: dark)")` and listen for changes
  - Initialize from `localStorage` on store creation (fallback to `"system"`)
- [x] **7.2** Prevent flash of wrong theme (FOUC)
  - Add inline `<script>` in `index.html` that reads `localStorage("theme")` and sets `.dark` class on `<html>` before first paint
- [x] **7.3** Create `src/components/shared/theme-toggle.tsx`
  - Button or dropdown with `Sun`, `Moon`, `Monitor` icons from `lucide-react`
  - Cycles or selects between light / dark / system
  - Calls `useAppStore().setTheme(...)` on click
- [x] **7.4** Add theme toggle to sidebar (`src/components/layout/sidebar.tsx`)
  - Place `<ThemeToggle />` at the bottom of the sidebar
- [x] **7.5** Make BlockNote theme dynamic (`src/components/editor/page-editor.tsx`)
  - Replace hardcoded `theme="light"` with resolved value from store
  - Create `useResolvedTheme()` hook that returns `"light" | "dark"` (resolves `"system"` via `matchMedia`)
- [x] **7.6** Add `⌘+Shift+L` keyboard shortcut to cycle theme
