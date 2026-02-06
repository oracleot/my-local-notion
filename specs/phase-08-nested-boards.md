# Phase 8 — Nested Boards (Boards as Children of Pages)

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
