# Title
Direct Links to Child Pages/Boards on Parent Page View

## Summary
Today, child pages/boards (pages with `parentId` pointing at the parent) are discoverable primarily from the sidebar tree, which is collapsed/expanded manually. When viewing a parent page, there is no in-page list of its direct children, so navigating to sub-resources requires interacting with the sidebar.

This change adds an always-available, in-page section on a parent page that lists its direct child resources (only document pages and kanban boards) as clickable links, so users can quickly jump to sub-pages/boards without needing to expand/collapse the sidebar tree.

## Goals
- When viewing any page, show a clear list of its direct children (where `child.parentId === currentPage.id`).
- Each child item is a direct navigation link to that child (`/page/:id`).
- Include both child document pages and child kanban boards in the list.
- Keep the UI lightweight and consistent with existing design tokens/components.

## Non-goals / Out of Scope
- Showing grandchildren or a fully recursive tree inside the page view.
- Changing the sidebar behavior, expand/collapse state, or navigation patterns.
- Adding new creation flows (e.g., “Create sub-page” buttons) unless explicitly requested.
- Re-ordering, drag-and-drop, or custom sorting of child links.

## User Experience / Flows
### View parent → open child
1. User opens a parent page.
2. Under the page header, a “Sub-resources” section appears.
3. The section shows:
   - A list of child items, each with an icon (emoji if set, otherwise doc/board icon) and title.
   - Clicking an item navigates directly to the child page/board.

### Empty children state
- If there are no children, the section is hidden (minimal).

## Data Model
- Existing model already supports this:
  - `Page.parentId` establishes parent/child relationships.
  - `Page.pageType` distinguishes documents vs boards.
- No schema changes or migrations are required.

## Technical Approach
- In the page view route (`/page/:pageId`), query direct children only for the current page:
  - Dexie query: `db.pages.where("parentId").equals(page.id)`
  - Sort: match sidebar behavior (`sortBy("createdAt")`) for consistency.
  - Use `useLiveQuery` so the list updates instantly after creating/moving pages.
- Render a compact, reusable UI section (new small component), placed:
  - For document pages: between `PageHeader` and the editor.
  - For kanban pages: near the top header area, above the board content.
- Use existing tokens/components (e.g., `Button`, `Separator`, `ScrollArea`) and existing icon rules:
  - If `child.icon` exists, render emoji.
  - Else render `LayoutGrid` for `pageType === "kanban"`, else `FileText`.

### Component/file size constraint
- Keep any new UI component under 200 LOC.
- If the “Sub-resources” UI approaches ~150 LOC, split into:
  - a small presentational list component
  - a small hook for fetching/sorting children

## Impacted Areas
### UI / Components
- Update page view to include the child-links section.
- Add a new small shared component for rendering the list of child links.

Candidate files:
- `src/components/pages/page-view.tsx`
- (new) `src/components/shared/sub-resources.tsx` (name TBD)

### State / Store
- None expected.

### Data layer / DB
- None (read-only query).

### Types
- None.

### Import / Export
- None; uses existing stored `parentId`.

### Tests / Docs
- Optional: add a short note to the user guide if there is one section about navigation.
- No existing automated UI test harness appears in-repo; keep untested unless there is a pattern already used.

## Edge Cases & Risks
- Large child counts: render performance and vertical space; consider a max-height with scroll if needed.
- Untitled children: ensure the list displays “Untitled” consistent with sidebar.
- Deleted/missing child pages: `useLiveQuery` should naturally reconcile; ensure stable keys.
- Kanban parent pages: ensure layout doesn’t push the board too far down; keep the section compact.
- Ordering expectations: users might expect “most recently updated” rather than “createdAt”. (Default to current sidebar ordering unless clarified.)

## Verification Checklist
- Creating a child document under a parent makes it appear in the parent’s “Sub-resources” list without reload.
- Creating a child board under a parent makes it appear in the list.
- Clicking a child item navigates to `/page/:childId`.
- The list renders on both document pages and kanban pages.
- No changes to IndexedDB schema versions.
- No new colors or theme tokens introduced.

## Feasibility Assessment
- High feasibility: parent/child relationship already exists (`parentId`) and sidebar already performs the same query.
- Low complexity: primarily a UI addition plus a Dexie live query.

## Size: Small | Medium | Large
**Small**

Rationale: UI-only enhancement with a straightforward IndexedDB query; no schema migrations and limited blast radius.

## Open Questions / Assumptions
- All clarified:
  - Direct children only.
  - Sort by `createdAt`.
  - Hide the section when there are no children.
