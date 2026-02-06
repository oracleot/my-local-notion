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

### Phase 9 — Video Walkthrough: Remotion Project Setup

> **Goal**: Create a ~60-90 second programmatic YouTube video using Remotion (React-based video).
> Targets general users — highlights privacy, productivity, and key features.
> Animated text captions over stylized app screenshots, smooth transitions, background music. No screen recording or voiceover.

- [ ] **9.1** Initialize Remotion project in `video/` directory at repo root
  - Run `npx create-video@latest` (TypeScript template)
  - Configure Tailwind CSS for Remotion (per `rules/tailwind.md`)
  - Add to `.gitignore`: `video/out/`, `video/node_modules/`
- [ ] **9.2** Set up project structure inside `video/`
  - `video/src/Root.tsx` — Register all compositions
  - `video/src/compositions/` — One folder per scene
  - `video/src/components/` — Shared animated components
  - `video/src/assets/` — Screenshots, music, icons
  - `video/src/lib/` — Timing constants, color tokens, font config
- [ ] **9.3** Configure video composition with Zod schema (per `rules/parameters.md`)
  - Props: `title`, `tagline`, `features[]`, `themeColors`
  - Register single `MainVideo` composition: **1920×1080 @ 30fps**, ~85 seconds
- [ ] **9.4** Load fonts (per `rules/fonts.md`)
  - Use `@remotion/google-fonts` for a distinctive display font (e.g., Space Grotesk)
  - Clean body font for captions
- [ ] **9.5** Define shared timing constants and color tokens in `video/src/lib/`
  - Scene durations, transition durations, frame breakpoints
  - Brand colors matching the app's theme

### Phase 10 — Video Walkthrough: Asset Capture

- [ ] **10.1** Take high-quality app screenshots (1920×1080, 2x retina)
  - Light mode: empty state, rich editor with sample content, kanban board, sidebar expanded, ⌘+K search dialog, emoji picker
  - Dark mode: editor view, kanban board
- [ ] **10.2** Source royalty-free background music (~90 seconds)
  - Upbeat lo-fi or minimal electronic track
  - Must be YouTube-safe (Creative Commons or purchased license)
  - Trim to match video duration

### Phase 11 — Video Walkthrough: Script & Copy

> Use **copywriting skill** for benefit-driven, concise animated text captions.

- [ ] **11.1** Write intro hook caption
  - e.g., "Your notes. Your device. Your rules."
- [ ] **11.2** Write problem frame caption
  - e.g., "Tired of cloud apps owning your data?"
- [ ] **11.3** Write solution reveal caption
  - App name + tagline with personality
- [ ] **11.4** Write feature highlight captions (5 rapid-fire)
  - "Rich documents with slash commands"
  - "Kanban boards with drag & drop"
  - "Nested pages, infinite depth"
  - "Lightning-fast search with ⌘+K"
  - "Dark mode, naturally"
- [ ] **11.5** Write privacy punch caption
  - "100% local. No accounts. No cloud. No tracking."
- [ ] **11.6** Write CTA/outro caption
  - "Try it free → [URL]" + GitHub star prompt

### Phase 12 — Video Walkthrough: Build Scenes

> Use **frontend design skill** for distinctive visuals. Use **Remotion best practices** for animations, sequencing, and transitions.

- [ ] **12.1** Build Scene 1 — Intro/Hook (0–8s)
  - Animated text reveal of hook line against gradient mesh background
  - `spring()` entrance animation (per `rules/animations.md`, `rules/text-animations.md`)
  - Transition out with slide/wipe (per `rules/transitions.md`)
- [ ] **12.2** Build Scene 2 — Problem (8–14s)
  - Pain-point text animates in with subtle glitch/shake effect
  - Dark, moody background tone
- [ ] **12.3** Build Scene 3 — App Reveal (14–22s)
  - App name/logo scales up with spring bounce
  - Tagline fades in below
  - Background shifts to brand colors
- [ ] **12.4** Build Scene 4 — Feature Showcase (22–60s)
  - 5 feature cards, ~7–8 seconds each
  - Each card: text caption slides in from left, framed screenshot scales in from right
  - Use `<Sequence>` / `<Series>` (per `rules/sequencing.md`)
  - Scene transitions between features (per `rules/transitions.md`)
  - Screenshots inside a `BrowserFrame` mockup component
- [ ] **12.5** Build Scene 5 — Privacy Punch (60–72s)
  - Bold, large text: "100% local." — staggered word entrance
  - Icons for "No accounts", "No cloud", "No tracking" with spring animations
- [ ] **12.6** Build Scene 6 — CTA/Outro (72–85s)
  - App name, URL, GitHub star prompt
  - Fade out with music

### Phase 13 — Video Walkthrough: Shared Components

> Keep every component under **200 lines** (per project guidelines).

- [ ] **13.1** Build `TextReveal` component
  - Staggered letter/word entrance animation using `interpolate()` + `spring()`
- [ ] **13.2** Build `FeatureCard` component
  - Screenshot + caption layout with entrance animation
- [ ] **13.3** Build `BrowserFrame` component
  - Styled mock browser chrome wrapping screenshots (traffic lights, address bar)
- [ ] **13.4** Build `GradientBackground` component
  - Animated gradient mesh or noise-textured background
- [ ] **13.5** Build `IconBadge` component
  - Animated icon + label (for privacy feature callouts)

### Phase 14 — Video Walkthrough: Polish & Render

- [ ] **14.1** Add music track to composition
  - Import audio, set volume, sync timing (per `rules/audio.md`)
  - Apply short fade-in at start and fade-out at end
- [ ] **14.2** Wire all scenes into `Root.tsx`
  - Register as single `<Composition>` using `<Series>` to chain scenes
  - Verify total duration is 80–90 seconds
- [ ] **14.3** Preview and iterate
  - Run `npx remotion preview` in `video/` directory
  - Scrub through all scenes — verify timing, transitions, text readability
- [ ] **14.4** Render final video
  - Run `npx remotion render MainVideo out/walkthrough.mp4 --codec h264`
  - Verify output: 1080p, 30fps, correct duration, audio synced
- [ ] **14.5** Final QA
  - Confirm `pnpm build` in main project root still passes (video workspace doesn't interfere)
  - Test video playback in multiple players
  - Verify text is readable at 720p (YouTube's most common quality)

### Phase 15 — Kanban Subtasks (Card-in-Card)

> **Goal**: Allow cards to contain subtasks (child cards) that can move independently across columns while maintaining a parent link. Subtasks appear in their actual column with a visual indicator of their parent.

- [x] **15.1** Extend `KanbanCard` interface in `src/types/index.ts`
  - Add `parentId: string | null` field
  - Top-level cards: `parentId = null`
  - Subtasks: `parentId = <parent card id>`
- [x] **15.2** Update Dexie schema in `src/lib/db.ts`
  - Increment schema version
  - Add `parentId` index to `kanbanCards` table
  - Add migration: set `parentId: null` for existing cards
- [x] **15.3** Add subtask helpers in `src/lib/db-helpers.ts`
  - `createSubtask(parentCardId, columnId, title)` — creates subtask in specified column (can differ from parent)
  - `getSubtasks(parentCardId)` — returns subtasks across all columns
  - `getParentCard(cardId)` — fetch parent info for badge display
  - Modify `deleteCard(id)` — cascade-delete all subtasks when deleting parent
- [x] **15.4** Update `KanbanCard` component in `src/components/kanban/kanban-card.tsx`
  - **For parent cards**: Show subtask summary badge (e.g., "2/3 done")
  - **For subtask cards**: Show parent link indicator (small icon + truncated parent title on hover)
  - Use conditional rendering based on `parentId` presence
- [x] **15.5** Update `KanbanColumn` rendering in `src/components/kanban/kanban-column.tsx`
  - Show ALL cards in column (parents + subtasks)
  - No filtering by `parentId` — subtasks appear where they belong
- [x] **15.6** Enhance `KanbanCardDetail` in `src/components/kanban/kanban-card-detail.tsx`
  - **For parent cards**: Section listing subtasks with column status, click to open subtask, "Add subtask" button
  - **For subtask cards**: Show "Parent: [Card Title]" link at top, click navigates to parent detail
  - Subtask list shows which column each subtask is in
- [x] **15.7** Add subtask creation UX
  - In card detail: "Add subtask" opens quick-create inline input
  - New subtask defaults to same column as parent (user can move later via drag or detail modal)
- [x] **15.8** Add promotion/demotion actions (optional enhancement)
  - Allow converting a regular card to a subtask (assign parent)
  - Allow promoting subtask to standalone card (clear parent)

#### Subtasks Data Model Extension

| Field      | Type            | Notes                                   |
| ---------- | --------------- | --------------------------------------- |
| `parentId` | `string \| null`| `null` = top-level card, else = subtask |

#### Subtasks Behavior Rules

- **Independent movement**: Subtasks can move to any column independent of their parent (e.g., parent in "To Do", subtask in "Done")
- **Visual linkage**: Subtask cards display a small parent indicator badge
- **Progress tracking**: Parent cards show subtask completion summary (e.g., "2/3 done" based on subtasks in final column)
- **Cascade delete**: Deleting a parent card deletes all its subtasks
- **One level only**: Subtasks cannot have their own subtasks (enforced in `createSubtask`)

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
- [ ] Create a card, add subtasks from card detail → subtasks appear in same column with parent indicator
- [ ] Move subtask to different column than parent → subtask appears in new column, parent shows updated progress (e.g., "1/2 done")
- [ ] Delete parent card → all subtasks are cascade-deleted
- [ ] Open subtask detail → shows "Parent: [title]" link, clicking navigates to parent
- [ ] Attempting to add subtask to a subtask is prevented (one level only)

---

## Architecture Notes

- **Single source of truth**: Dexie (IndexedDB) owns all persisted data. Zustand is only for transient UI state. Never duplicate Dexie data into Zustand.
- **Reactive reads**: Use `useLiveQuery` everywhere you read from Dexie. It auto-updates when data changes (even from other tabs).
- **`useLiveQuery` returns `undefined` initially** — always use optional chaining (`pages?.map(...)`) or loading states.
- **BlockNote is uncontrolled**: Set `initialContent` once. To switch pages, remount via `key={pageId}`. Don't try to make it controlled.
- **BlockNote + shadcn Portals**: If passing custom shadcn components via `shadCNComponents` prop, remove Portal usage from DropdownMenu, Popover, Select.
- **@dnd-kit sortable v10**: Verify peer dependency compatibility with `@dnd-kit/core` v6 before installing.
