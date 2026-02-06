# Phase 2 — Data Layer

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
