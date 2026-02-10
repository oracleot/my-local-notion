# Focus Calendar: Horizontal Blocks, Time-Aware Reminders & Intra-Hour Reordering

## Summary

This feature request has three interconnected sub-features for the Daily view of the focus calendar:

1. **Horizontal task layout** — Tasks within an hour block render side-by-side (horizontally) instead of stacked vertically. Each task's width is proportional to its `durationMinutes` relative to the 60-minute block.
2. **Time-aware per-block reminders** — The unstarted-task reminder system becomes position-aware: it only fires for the block whose time window is _currently active_ within the hour, based on block order and cumulative offsets. Missed blocks receive the "Missed" tag and reschedule button.
3. **Block ordering & drag-to-reorder** — Blocks are added in insertion order and users can drag-and-drop to reorder them _within_ the same hour slot.

## Goals

- Improve visual density and time awareness in the Daily calendar view.
- Give users precise reminders only for the task they should be working on _right now_, not all tasks in the hour.
- Support user agency via drag-to-reorder within an hour block.

## Non-goals / Out of Scope

- Week calendar view changes (horizontal layout is Day-view only).
- Multi-hour blocks / blocks spanning across hour boundaries.
- Auto-advancing from one task to the next within an hour.
- Resizing blocks by dragging edges (duration stays set via the duration picker).

## User Experience / Flows

### Horizontal Layout (Daily View)

- Within each hour slot, task blocks render **left-to-right** in a single row.
- Each block's width = `(durationMinutes / 60) * 100%` of the slot content area.
- The block card is adapted for compact horizontal display: title truncated, duration badge visible, action buttons shown on hover.
- If the current hour has elapsed time, the elapsed-time overlay still stretches across the full row (as it does today).

### Time-Aware Reminders

- Each block in an hour has an _effective start minute_ derived from its position:
  - Block 0 starts at minute 0
  - Block 1 starts at minute = Block 0's duration
  - Block N starts at minute = sum of durations of blocks 0..N-1
- The reminder system fires only for the block whose effective time window contains the current minute.
- Once a block's time window elapses without being started, it is marked `skipped` (existing "Missed" tag + Reschedule button behavior).
- Example: Hour 2PM — Task A (20m, order 0), Task B (40m, order 1). At 2:06PM → remind for Task A. At 2:25PM → Task A is missed, remind for Task B.

### Drag-to-Reorder

- Blocks within the same hour slot can be dragged and repositioned (reordered).
- The existing cross-hour drag-and-drop (moving a block to a different hour) continues to work.
- When a block is dropped within the same hour, only the `order` values are updated (no hour change).
- New blocks are appended to the end (highest order value).

## Data Model

### Schema Change Required: YES (DB version 7)

Add an `order` field to the `TimeBlock` type:

```ts
export interface TimeBlock {
  // ... existing fields ...
  order: number; // Position within the hour slot (0-based)
}
```

**Migration (v6 → v7):**
- Add `order` field to all existing `TimeBlock` records, defaulting to 0.
- For hours with multiple existing blocks, assign order by `createdAt` ascending.

**Index change:** The `timeBlocks` store definition stays `"id, cardId, pageId, date"` — no new index needed since ordering is done in-memory after fetching by date.

## Technical Approach

### 1. Data Layer (`types/index.ts`, `lib/db.ts`, `lib/focus-helpers.ts`)

- Add `order: number` to `TimeBlock` interface.
- Add DB version 7 migration that sets `order` based on `createdAt` for existing blocks within each `(date, startHour)` group.
- Update `createTimeBlock()` to calculate `order` = max existing order in that slot + 1.
- Add `reorderBlocksInHour(date, hour, orderedIds: string[])` helper that batch-updates order values.
- Update `markSkippedBlocks()` to be position-aware: calculate effective minute offsets per block using order, only mark as skipped if the block's full time window has elapsed.

### 2. Reminder System (`lib/use-unstarted-reminders.tsx`)

- Fetch blocks for the current hour, sort by `order`.
- Calculate each block's effective start/end minutes from cumulative durations.
- Only remind for the block whose window contains `currentMinute`.
- Skip blocks already completed or actively running.

### 3. UI — Hour Slot (`components/focus/hour-slot.tsx`)

- Change block container from `space-y-1.5` (vertical) to `flex flex-row gap-1` (horizontal).
- Each `TimeBlockCard` receives a `style={{ width: \`${(block.durationMinutes / 60) * 100}%\` }}` or equivalent flex-basis.
- The "Add task" / "Add break" buttons move below the horizontal row (or appear as a small `+` at the end if there's remaining capacity).
- Sort blocks by `order` before rendering.

### 4. UI — TimeBlockCard (`components/focus/time-block-card.tsx`)

- Adapt to a more compact horizontal layout: vertical stacking of title/metadata inside, constrained width.
- The drag handle remains; it now supports both intra-hour reorder and cross-hour move.

### 5. DnD System (`components/focus/day-calendar.tsx`)

- Integrate `@dnd-kit/sortable` for intra-hour reordering alongside the existing `DndContext` for cross-hour moves.
- Each hour slot becomes a `SortableContext` with its blocks.
- On drag end: if source hour === target hour → reorder (update `order` fields). If different hour → move (existing behavior + assign order at end of target).
- Need to check if `@dnd-kit/sortable` is already installed; if not, add it.

### 6. File Sizes / Composition Risk

Current file sizes:
- `hour-slot.tsx`: ~120 lines → will grow with horizontal layout + sortable wrapper. May approach 150 lines; plan to extract a `HourSlotBlockRow` sub-component if needed.
- `time-block-card.tsx`: ~140 lines → compact variant may push close to limit. Consider extracting `TimeBlockCardCompact` if horizontal layout needs significant divergence.
- `day-calendar.tsx`: ~120 lines → sortable integration adds ~20-30 lines. Should stay under 150.
- `use-unstarted-reminders.tsx`: ~170 lines → logic change is a refactor of the inner loop, not a size increase.
- `focus-helpers.ts`: ~140 lines → adding `reorderBlocksInHour` + updated `markSkippedBlocks` adds ~30 lines. May need to extract ordering helpers to a separate file.

## Impacted Areas

### UI / Components
- `components/focus/hour-slot.tsx` — horizontal flex layout, sortable context
- `components/focus/time-block-card.tsx` — compact horizontal rendering
- `components/focus/day-calendar.tsx` — sortable DnD integration

### State / Store
- `stores/app-store.ts` — no changes expected

### Data Layer / DB
- `lib/db.ts` — version 7 migration for `order` field
- `lib/focus-helpers.ts` — `createTimeBlock` order assignment, `reorderBlocksInHour`, position-aware `markSkippedBlocks`

### Types
- `types/index.ts` — `order` field on `TimeBlock`

### Import / Export
- `lib/data-transfer.ts` — ensure `order` is included in export/import of `TimeBlock` records

### Tests / Docs
- No existing test files found; no test impact.

## Edge Cases & Risks

1. **Blocks exceeding 60 minutes in total** — Already prevented by capacity checks. No change needed.
2. **Reorder during active session** — If a running block is reordered, the session continues unaffected (session references `timeBlockId`, not position).
3. **Elapsed-time indicator in current hour** — The time progress overlay spans the full row. The currently-expected block receives a pulsing primary-colored border to indicate it's the one the user should be working on.
4. **Migration for existing data** — Users with multiple blocks in the same hour need stable ordering post-migration. Sorting by `createdAt` is deterministic and matches insertion order.
5. **DnD library compatibility** — `@dnd-kit/sortable` must be compatible with the existing `@dnd-kit/core` version. Check package versions.
6. **Narrow blocks** — A 5-minute block in a 60-minute slot = 8.3% width. Content must gracefully truncate. The compact styling and minimum width constraints are important.
7. **Reminder race condition** — If blocks are reordered while a reminder interval is pending, the next tick will use the updated order. No stale data risk since blocks are fetched fresh each tick.
8. **Position-aware skipping granularity** — Currently `markSkippedBlocks` skips by hour. The new logic skips by effective minute offset within the hour. This is more granular and correct, but means blocks are skipped mid-hour. Need to ensure the 60s interval tick catches transitions promptly.

## Verification Checklist

- [ ] Blocks render horizontally in Daily view, proportional to duration.
- [ ] Blocks are sorted by `order` field left-to-right.
- [ ] New blocks appear at the rightmost position (end of the row).
- [ ] Drag-to-reorder within the same hour updates order and re-renders.
- [ ] Cross-hour drag still works; moved block gets appended at end of target hour.
- [ ] Reminder only fires for the block whose time window covers the current minute.
- [ ] Missed blocks (past their window, not started) get "Missed" tag.
- [ ] Reschedule button works on missed blocks.
- [ ] Blocks with < 15 minutes duration render with truncated but readable content.
- [ ] DB migration from v6 → v7 assigns correct order to existing blocks.
- [ ] Export/import preserves block order.
- [ ] `pnpm build` passes with no errors.
- [ ] No file exceeds 200 lines.

## Feasibility Assessment

**Feasible**: Yes. All three sub-features build on existing patterns and infrastructure. The main complexity is in the DnD sortable integration and position-aware reminder logic, both of which are well-supported by the existing DnD kit and the 60s polling loop.

## Size: Large

- Requires a **DB schema migration** (new `order` field on `TimeBlock`).
- Touches **multiple major surfaces**: hour slot layout, time block card, DnD system, reminder system, skip logic.
- Affects **export/import** compatibility.
- Requires potential new dependency (`@dnd-kit/sortable`).

## Open Questions / Assumptions

1. **Minimum block width**: What is the minimum visual width for a block? Assumed ~8% (≈5 minutes). Blocks shorter than this may need a tooltip or expandable behavior. _Needs UX decision._
2. **Active-block indicator**: Confirmed — the currently-expected block gets a pulsing primary-colored border highlight.
3. **Partial-hour filled slots**: If only 40 of 60 minutes are filled, should the remaining 20 minutes show as empty space or should blocks stretch to fill? _Assumed empty space with the "+ Add task" button filling the gap._
4. **`@dnd-kit/sortable` installation**: Is it already a dependency? If not, it needs to be added. _Needs verification at implementation time._
