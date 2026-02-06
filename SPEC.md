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

| Field         | Type     | Indexed | Notes                         |
| ------------- | -------- | ------- | ----------------------------- |
| `id`          | `string` | PK      |                               |
| `pageId`      | `string` | Yes     | FK → parent Kanban page       |
| `columnId`    | `string` | Yes     | Which column the card is in   |
| `title`       | `string` |         |                               |
| `description` | `string` |         |                               |
| `order`       | `number` |         | Sort position within column   |
| `createdAt`   | `Date`   |         |                               |
| `updatedAt`   | `Date`   |         |                               |

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

## Tasks

### Phase 1 — Project Scaffolding & Tooling

- [x] **1.1** Install Tailwind CSS v4 (`tailwindcss`, `@tailwindcss/vite`)
  - Add `@tailwindcss/vite` plugin to `vite.config.ts`
  - Replace `src/index.css` contents with `@import "tailwindcss"`
- [x] **1.2** Configure path aliases (`@/*` → `./src/*`)
  - Update `tsconfig.app.json` with `paths`
  - Add `resolve.alias` in `vite.config.ts`
- [x] **1.3** Initialize shadcn/ui (`pnpm dlx shadcn@latest init`)
  - Generates `components.json`, installs `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`
  - Creates `src/lib/utils.ts` with `cn()` helper
- [x] **1.4** Install application dependencies
  - `react-router`
  - `@blocknote/core @blocknote/react @blocknote/shadcn`
  - `dexie dexie-react-hooks`
  - `zustand`
  - `@dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
- [x] **1.5** Add BlockNote shadcn source directive to `src/index.css`
  - `@source "../node_modules/@blocknote/shadcn";`
- [x] **1.6** Remove default Vite scaffold code from `App.tsx`, `App.css`
- [x] **1.7** Create `src/types/index.ts` with shared interfaces (`Page`, `KanbanCard`, `KanbanColumn`)

### Phase 2 — Data Layer

- [x] **2.1** Create `src/lib/db.ts`
  - Dexie singleton with `pages` and `kanbanCards` tables
  - Type-safe schema using `EntityTable`
- [x] **2.2** Create `src/lib/db-helpers.ts`
  - `createPage(title, parentId?, pageType?)` — generates UUID, sets timestamps
  - `updatePageContent(id, content)` — debounced (300ms) write of BlockNote JSON
  - `updatePageTitle(id, title)` — title change
  - `deletePage(id)` — cascade-deletes all descendant pages and their kanban cards
  - `movePage(id, newParentId)` — re-parent a page
  - `createCard(pageId, columnId, title)` — new Kanban card
  - `updateCard(id, changes)` — partial update
  - `moveCard(id, targetColumnId, newOrder)` — reposition after drag
  - `deleteCard(id)`
- [x] **2.3** Create `src/stores/app-store.ts`
  - Zustand store: `sidebarOpen`, `activePageId`, `sidebarWidth`
  - Actions: `toggleSidebar()`, `setActivePage(id)`, `setSidebarWidth(px)`

### Phase 3 — Layout & Routing

- [x] **3.1** Set up React Router v7 in `src/main.tsx`
  - Routes: `/` (redirect), `/page/:pageId` (editor or kanban based on `pageType`)
- [x] **3.2** Add shadcn components needed for layout
  - `pnpm dlx shadcn@latest add button scroll-area tooltip dialog input dropdown-menu`
- [x] **3.3** Create `src/components/layout/app-layout.tsx`
  - Sidebar (resizable) + main content area
  - Sidebar slots: workspace name, "New Page" button, page tree, settings
- [x] **3.4** Create `src/components/layout/sidebar.tsx`
  - Renders recursive page tree via `useLiveQuery`
  - "New Page" button (document or kanban picker)
  - Collapse/expand toggle
- [x] **3.5** Create `src/components/shared/page-tree-item.tsx`
  - Single tree node: icon, title, expand chevron, child count
  - Click → navigate to `/page/:id`
  - Right-click context menu (rename, delete, add sub-page, change icon)
  - Recursive rendering of children

### Phase 4 — Page Editor

- [x] **4.1** Create `src/components/editor/page-header.tsx`
  - Large editable title input
  - Emoji icon picker (hover to reveal "Add icon" button)
  - Saves to Dexie on change
- [x] **4.2** Create `src/components/editor/page-editor.tsx`
  - Loads `page.content` from Dexie via `useLiveQuery`
  - Passes content as `initialContent` to `useCreateBlockNote`
  - `<BlockNoteView>` from `@blocknote/shadcn` with `style.css` import
  - `onChange` → debounced save of `editor.document` to Dexie
  - **Key behavior**: use `key={pageId}` on the editor component to force remount on page switch (BlockNote is uncontrolled)
- [x] **4.3** Wire up page route
  - `/page/:pageId` renders `<PageHeader>` + `<PageEditor>` or `<KanbanBoard>` based on `page.pageType`

### Phase 5 — Kanban Boards

- [x] **5.1** Create `src/components/kanban/kanban-board.tsx`
  - Horizontal flex layout, overflow-x scroll
  - `DndContext` from `@dnd-kit/core` wrapping all columns
  - Loads columns from `page.columns` and cards from `kanbanCards` table via `useLiveQuery`
  - "Add column" button at end
  - Handles `onDragEnd` → calls `moveCard()` helper
- [x] **5.2** Create `src/components/kanban/kanban-column.tsx`
  - Editable column title
  - `SortableContext` for cards within column
  - Droppable area
  - "Add card" button at bottom
  - Column menu (rename, delete, color)
- [x] **5.3** Create `src/components/kanban/kanban-card.tsx`
  - `useSortable` hook for drag handle
  - Displays title, optional description preview
  - Click → opens edit modal/side panel
- [x] **5.4** Add card detail dialog
  - shadcn `Dialog` or `Sheet` for editing card title + description
  - Saves changes to Dexie on close

### Phase 6 — Polish & UX

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

### Phase 7 — Light/Dark Mode

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

### Phase 8 — Nested Boards (Boards as Children of Pages)

- [x] **8.1** Update `handleAddChild` in `src/components/shared/page-tree-item.tsx`
  - Accept a `PageType` parameter (`"document" | "kanban"`)
  - Pass type to `createPage(title, parentId, pageType)`
- [x] **8.2** Replace the "+" button with a `DropdownMenu` in `page-tree-item.tsx`
  - Wrap existing button in `DropdownMenuTrigger`
  - Add `DropdownMenuContent` with two items:
    - **Document** (with `FileText` icon)
    - **Board** (with `LayoutGrid` icon)
  - Reuse compact styling from existing "More" menu
- [x] **8.3** Import `PageType` from `@/types` in `page-tree-item.tsx`
- [x] **8.4** Verify nested board functionality
  - Create a board under an existing document page
  - Confirm board appears nested in sidebar with correct icon
  - Navigate to nested board → Kanban view renders
  - Check breadcrumbs show correct parent → child path

---

## Verification Checklist

- [ ] Create a document page, add rich content (headings, lists, code blocks, toggles), refresh browser → content persists
- [ ] Create nested sub-pages 3 levels deep, verify sidebar tree renders correctly
- [ ] Delete a parent page → all children and their kanban cards are cascade-deleted
- [ ] Create a Kanban page, add 3 columns with cards, drag cards between columns → order persists after refresh
- [ ] Navigate between pages via sidebar, ⌘+K search, and breadcrumbs → URL updates, correct content loads
- [ ] Open DevTools → Application → IndexedDB → `NotionCloneDB` tables contain expected data
- [ ] Resize sidebar, toggle it closed/open → state preserved during session
- [ ] Empty state renders when all pages are deleted
- [ ] Works in Chrome, Firefox, Safari (IndexedDB + BlockNote compatibility)
- [ ] Toggle between light, dark, and system — UI updates immediately including sidebar, editor, kanban boards, and all shadcn components
- [ ] Refresh browser — theme persists with no flash of wrong theme
- [ ] Change OS appearance while set to "system" — app follows automatically
- [ ] BlockNote editor adapts correctly in dark mode
- [ ] `⌘+Shift+L` cycles the theme

---

## Architecture Notes

- **Single source of truth**: Dexie (IndexedDB) owns all persisted data. Zustand is only for transient UI state. Never duplicate Dexie data into Zustand.
- **Reactive reads**: Use `useLiveQuery` everywhere you read from Dexie. It auto-updates when data changes (even from other tabs).
- **`useLiveQuery` returns `undefined` initially** — always use optional chaining (`pages?.map(...)`) or loading states.
- **BlockNote is uncontrolled**: Set `initialContent` once. To switch pages, remount via `key={pageId}`. Don't try to make it controlled.
- **BlockNote + shadcn Portals**: If passing custom shadcn components via `shadCNComponents` prop, remove Portal usage from DropdownMenu, Popover, Select.
- **@dnd-kit sortable v10**: Verify peer dependency compatibility with `@dnd-kit/core` v6 before installing.
