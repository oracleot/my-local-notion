# My Local Notion — Spec & Tasks

> A local, browser-only Notion clone built with React 19, TypeScript, Vite 7, BlockNote, Dexie (IndexedDB), and shadcn/ui.
> All data persists in the browser — no backend, no accounts, no cloud sync.

---

## Tech Stack

| Layer          | Library                                      | Purpose                          |
| -------------- | -------------------------------------------- | -------------------------------- |
| Framework      | React 19 + TypeScript 5.9                    | UI & type safety                 |
| Bundler        | Vite 7                                       | Dev server & builds              |
| Styling        | Tailwind CSS v4 + shadcn/ui                  | Utility-first CSS + components   |
| Block Editor   | BlockNote (shadcn variant)                   | Notion-like block editing        |
| Persistence    | Dexie 4 (IndexedDB)                          | Client-side database             |
| Routing        | React Router v7                              | SPA navigation                   |
| UI State       | Zustand 5                                    | Ephemeral/UI-only state          |
| Drag & Drop    | @dnd-kit (core + sortable)                   | Kanban card/column reordering    |

---

## Data Model

### `pages` table

| Field       | Type                          | Indexed | Notes                            |
| ----------- | ----------------------------- | ------- | -------------------------------- |
| `id`        | `string` (UUID)               | PK      |                                  |
| `title`     | `string`                      |         | Displayed in sidebar & header    |
| `parentId`  | `string \| null`              | Yes     | `null` = root-level page         |
| `content`   | `Block[]`                     |         | BlockNote JSON array             |
| `icon`      | `string \| null`              |         | Emoji icon                       |
| `pageType`  | `"document" \| "kanban"`      |         | Determines which view renders    |
| `columns`   | `KanbanColumn[]`              |         | Only used when `pageType=kanban` |
| `createdAt` | `Date`                        |         |                                  |
| `updatedAt` | `Date`                        | Yes     |                                  |

### `kanbanCards` table

| Field         | Type             | Indexed | Notes                                      |
| ------------- | ---------------- | ------- | ------------------------------------------ |
| `id`          | `string`         | PK      |                                            |
| `pageId`      | `string`         | Yes     | FK → parent Kanban page                    |
| `columnId`    | `string`         | Yes     | Which column the card is in                |
| `parentId`    | `string \| null` | Yes     | FK → parent card (null = top-level)        |
| `title`       | `string`         |         |                                            |
| `description` | `string`         |         |                                            |
| `order`       | `number`         |         | Sort position within column                |
| `createdAt`   | `Date`           |         |                                            |
| `updatedAt`   | `Date`           |         |                                            |

### `KanbanColumn` (embedded JSON on page)

| Field   | Type     | Notes                  |
| ------- | -------- | ---------------------- |
| `id`    | `string` |                        |
| `title` | `string` |                        |
| `order` | `number` | Sort position          |

### Zustand Store (ephemeral UI state only)

| Field          | Type               | Notes                      |
| -------------- | ------------------ | -------------------------- |
| `sidebarOpen`  | `boolean`          | Sidebar expanded/collapsed |
| `activePageId` | `string \| null`   | Currently viewed page      |
| `sidebarWidth` | `number`           | Resizable sidebar width    |

---

## File Structure (Target)

```
src/
├── main.tsx                          # App entry, router setup
├── App.tsx                           # Root component
├── index.css                         # Tailwind imports + BlockNote source
├── lib/
│   ├── db.ts                         # Dexie instance & schema
│   ├── db-helpers.ts                 # CRUD helpers (createPage, deletePage, etc.)
│   └── utils.ts                      # cn() and misc utilities
├── stores/
│   └── app-store.ts                  # Zustand UI state
├── components/
│   ├── ui/                           # shadcn/ui primitives (auto-generated)
│   ├── layout/
│   │   ├── app-layout.tsx            # Shell: sidebar + main content
│   │   └── sidebar.tsx               # Sidebar with page tree
│   ├── editor/
│   │   ├── page-editor.tsx           # BlockNote editor wrapper
│   │   └── page-header.tsx           # Title + icon above editor
│   ├── kanban/
│   │   ├── kanban-board.tsx          # Full board with DnD context
│   │   ├── kanban-column.tsx         # Single column (droppable)
│   │   └── kanban-card.tsx           # Single card (draggable)
│   └── shared/
│       ├── page-tree-item.tsx        # Recursive sidebar tree node
│       ├── breadcrumbs.tsx           # Page hierarchy breadcrumbs
│       ├── empty-state.tsx           # Welcome screen, no pages yet
│       └── search-dialog.tsx         # ⌘+K page search (shadcn Command)
└── types/
    └── index.ts                      # Shared TypeScript interfaces
```

---

## Phases

Each phase is documented in a separate file for detailed task tracking:

### Core Application
- [Phase 1 — Project Scaffolding & Tooling](phase-01-scaffolding.md) ✅
- [Phase 2 — Data Layer](phase-02-data-layer.md) ✅
- [Phase 3 — Layout & Routing](phase-03-layout-routing.md) ✅
- [Phase 4 — Page Editor](phase-04-page-editor.md) ✅
- [Phase 5 — Kanban Boards](phase-05-kanban-boards.md) ✅
- [Phase 6 — Polish & UX](phase-06-polish-ux.md) ✅
- [Phase 7 — Light/Dark Mode](phase-07-light-dark-mode.md) ✅
- [Phase 8 — Nested Boards](phase-08-nested-boards.md) ✅

### Video Walkthrough (Remotion)
- [Phase 9 — Remotion Project Setup](phase-09-video-remotion-setup.md)
- [Phase 10 — Asset Capture](phase-10-video-asset-capture.md)
- [Phase 11 — Script & Copy](phase-11-video-script-copy.md)
- [Phase 12 — Build Scenes](phase-12-video-build-scenes.md)
- [Phase 13 — Shared Components](phase-13-video-shared-components.md)
- [Phase 14 — Polish & Render](phase-14-video-polish-render.md)

### Advanced Features
- [Phase 15 — Kanban Subtasks](phase-15-kanban-subtasks.md) ✅
- [Phase 16 — Export/Import with Timestamp Merge](phase-16-export-import.md) ✅
- [Phase 17 — Focus Mode & Pomodoro Timer](phase-17-focus-mode.md)

---

## Verification Checklist

- [x] Create a document page, add rich content (headings, lists, code blocks, toggles), refresh browser → content persists
- [x] Create nested sub-pages 3 levels deep, verify sidebar tree renders correctly
- [x] Delete a parent page → all children and their kanban cards are cascade-deleted
- [x] Create a Kanban page, add 3 columns with cards, drag cards between columns → order persists after refresh
- [x] Navigate between pages via sidebar, ⌘+K search, and breadcrumbs → URL updates, correct content loads
- [x] Open DevTools → Application → IndexedDB → `NotionCloneDB` tables contain expected data
- [x] Resize sidebar, toggle it closed/open → state preserved during session
- [x] Empty state renders when all pages are deleted
- [x] Works in Chrome, Firefox, Safari (IndexedDB + BlockNote compatibility)
- [x] Toggle between light, dark, and system — UI updates immediately including sidebar, editor, kanban boards, and all shadcn components
- [x] Refresh browser — theme persists with no flash of wrong theme
- [x] Change OS appearance while set to "system" — app follows automatically
- [x] BlockNote editor adapts correctly in dark mode
- [x] `⌘+Shift+L` cycles the theme
- [x] Create a card, add subtasks from card detail → subtasks appear in same column with parent indicator
- [x] Move subtask to different column than parent → subtask appears in new column, parent shows updated progress (e.g., "1/2 done")
- [x] Delete parent card → all subtasks are cascade-deleted
- [x] Open subtask detail → shows "Parent: [title]" link, clicking navigates to parent
- [x] Attempting to add subtask to a subtask is prevented (one level only)
- [x] Create pages and kanban boards on device A, export → import on device B (fresh install) → all data appears
- [x] Make edits on both devices independently, export A, import on B → newer edits from A merge in, B's newer edits preserved
- [x] Delete a page on device A, export, import on B → page is removed on B
- [x] Edit a page on device B, delete it on device A (before the edit), import on B → page is kept (edit wins)
- [x] Export file is valid JSON and reasonable size
- [x] Build passes with no lint errors

---

## Architecture Notes

- **Single source of truth**: Dexie (IndexedDB) owns all persisted data. Zustand is only for transient UI state. Never duplicate Dexie data into Zustand.
- **Reactive reads**: Use `useLiveQuery` everywhere you read from Dexie. It auto-updates when data changes (even from other tabs).
- **`useLiveQuery` returns `undefined` initially** — always use optional chaining (`pages?.map(...)`) or loading states.
- **BlockNote is uncontrolled**: Set `initialContent` once. To switch pages, remount via `key={pageId}`. Don't try to make it controlled.
- **BlockNote + shadcn Portals**: If passing custom shadcn components via `shadCNComponents` prop, remove Portal usage from DropdownMenu, Popover, Select.
- **@dnd-kit sortable v10**: Verify peer dependency compatibility with `@dnd-kit/core` v6 before installing.
