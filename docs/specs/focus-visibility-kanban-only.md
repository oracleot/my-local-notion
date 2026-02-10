# Focus Feature: Kanban-Only Visibility

## Summary

The Focus feature currently appears everywhere in the app—sidebar, header badge, and via keyboard shortcut—regardless of whether the user is viewing a Kanban board or a document. This can cause confusion since Focus is inherently tied to Kanban cards/tasks.

This change restricts the Focus **entry points** (sidebar button, badge shortcut, `⌘⇧F`) to only appear when the user is viewing a Kanban board. The timer badge remains visible when a session is active, regardless of current page type, so users can always control their running session.

## Goals

- Hide Focus entry points when viewing document pages to reduce confusion
- Keep timer badge visible when a focus session is running (regardless of page type)
- Maintain existing Focus behavior when on Kanban boards

## Non-goals / Out of Scope

- Blocking direct URL navigation to `/focus` (users can still type the URL)
- Changing Focus view functionality itself
- Any changes to how Focus sessions work

## User Experience / Flows

### When viewing a Kanban board (no active session)
- Sidebar shows "Focus" button
- Header badge shows "Focus" shortcut button
- `⌘⇧F` navigates to Focus view

### When viewing a Document page (no active session)
- Sidebar does NOT show "Focus" button  
- Header badge does NOT show "Focus" shortcut button
- `⌘⇧F` does nothing (or could show a toast "Focus only available from Kanban boards")

### When a focus session IS running (any page)
- Timer badge always visible with card title and countdown
- User can pause/resume/stop/enter Zen mode from badge controls
- After session ends, badge returns to context-dependent visibility

## Data Model

**No schema changes required.**

Minimal store addition:
- Add `activePageType: PageType | null` to `AppState` in `app-store.ts`
- Set alongside `activePageId` when page context changes

## Technical Approach

### 1. Store Changes (`app-store.ts`)

Add `activePageType` field to track current page type:
```ts
activePageType: PageType | null;
setActivePage: (id: string | null, type?: PageType | null) => void;
```

### 2. PageView Updates (`page-view.tsx`)

Update `setActivePage` call to include page type:
```ts
useEffect(() => {
  if (pageId && page) {
    setActivePage(pageId, page.pageType);
  }
  return () => setActivePage(null, null);
}, [pageId, page?.pageType, setActivePage]);
```

### 3. Sidebar Updates (`sidebar.tsx`)

Conditionally render Focus button:
```tsx
const activePageType = useAppStore((s) => s.activePageType);
// ...
{activePageType === "kanban" && (
  <Button onClick={() => navigate("/focus")}>
    <Target /> Focus
  </Button>
)}
```

### 4. FocusTimerBadge Updates (`focus-timer-badge.tsx`)

When no session active, conditionally render:
```tsx
const activePageType = useAppStore((s) => s.activePageType);

if (!session) {
  if (activePageType !== "kanban") return null;
  // ... render Focus shortcut button
}
// ... render timer badge (always when session exists)
```

### 5. Global Shortcuts Updates (`use-global-shortcuts.ts`)

Make `⌘⇧F` conditional:
```ts
const activePageType = useAppStore((s) => s.activePageType);

// ⌘⇧F → Focus view (only from Kanban)
if (meta && e.shiftKey && e.key.toLowerCase() === "f") {
  e.preventDefault();
  if (activePageType === "kanban") {
    navigate("/focus");
  }
  return;
}
```

## Impacted Areas

### UI/Components
- [sidebar.tsx](../src/components/layout/sidebar.tsx) — conditional Focus button
- [focus-timer-badge.tsx](../src/components/focus/focus-timer-badge.tsx) — conditional shortcut (when no session)

### State/Store  
- [app-store.ts](../src/stores/app-store.ts) — add `activePageType` field

### Lib/Hooks
- [use-global-shortcuts.ts](../src/lib/use-global-shortcuts.ts) — conditional `⌘⇧F`

### Pages
- [page-view.tsx](../src/components/pages/page-view.tsx) — pass page type to store

### Not impacted
- Types (no new types needed)
- Data layer / DB (no schema changes)
- Import/export
- Focus view itself
- Tests/docs

## Edge Cases & Risks

1. **Direct URL navigation**: User can still navigate to `/focus` by typing URL. This is acceptable—the view works fine, we just don't surface entry points from documents.

2. **Session started from Kanban, user navigates to document**: Timer badge remains visible. User can still control session. ✓

3. **Session ends while viewing document**: Badge disappears entirely (no session + not on kanban). ✓

4. **No Kanban boards exist**: Focus button never shows. Acceptable—nothing to focus on anyway.

5. **Nested pages under Kanban**: The immediate page type is what matters. If user is on a document that's nested under a kanban board, Focus still won't show (because current view is document).

## Verification Checklist

- [ ] Viewing Kanban board → Focus button visible in sidebar
- [ ] Viewing Kanban board → Focus badge visible in header (when no session)
- [ ] Viewing Kanban board → `⌘⇧F` navigates to Focus
- [ ] Viewing Document → Focus button hidden in sidebar  
- [ ] Viewing Document → Focus badge hidden in header (when no session)
- [ ] Viewing Document → `⌘⇧F` does nothing
- [ ] Active session + viewing Document → Timer badge visible with controls
- [ ] Active session ends while on Document → Badge disappears
- [ ] Direct navigation to `/focus` URL still works

## Feasibility Assessment

**Fully feasible.** All changes are straightforward conditional rendering based on a single store value. No complex state management, no async concerns, no DB changes.

## Size: Small

- Isolated UI visibility changes (conditional rendering)
- No IndexedDB/Dexie schema changes or migrations
- Minimal store addition (one field)
- Limited blast radius (4 files, all related to Focus entry points)
- No cross-feature coupling beyond reading page type

## Open Questions / Assumptions

1. **Assumed**: Timer badge always visible when session active (confirmed by user)
2. **Assumed**: No toast/feedback when `⌘⇧F` pressed on document—silent no-op is acceptable
3. **Assumed**: `/focus` route remains accessible via direct URL (acceptable edge case)
