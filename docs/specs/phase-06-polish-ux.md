# Phase 6 — Polish & UX

- [x] **6.1** Create `src/components/shared/empty-state.tsx`
  - Shown when no pages exist
  - "Create your first page" prompt with Document / Kanban options
- [x] **6.2** Create `src/components/shared/breadcrumbs.tsx`
  - Shows page hierarchy above editor (root → parent → current)
  - Each crumb is a link to that page
- [x] **6.3** Create `src/components/shared/search-dialog.tsx`
  - ⌘+K keyboard shortcut to open
  - Uses shadcn `Command` component (`pnpm dlx shadcn@latest add command`)
  - Fuzzy-searches page titles from Dexie
  - Select result → navigate to page
- [x] **6.4** Call `navigator.storage.persist()` on app init
  - Prevents browser from evicting IndexedDB data
- [x] **6.5** Add favicon and page `<title>` that updates to current page name
- [x] **6.6** Keyboard shortcuts
  - `⌘+K` — search
  - `⌘+\` — toggle sidebar
  - `⌘+N` — new page
