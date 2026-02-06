# Phase 3 — Layout & Routing

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
