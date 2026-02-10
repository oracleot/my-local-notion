# Phase 19 — Focus Calendar: Break Blocks & Quick-Add Task

## Summary

This feature adds two new capabilities to the Focus Calendar:

1. **Break Blocks** — Users can schedule "break time" directly on the calendar, visually distinct from task blocks, with a configurable duration. Breaks occupy capacity in an hour slot just like task blocks but do not start a focus session or timer.

2. **Quick-Add Task from Calendar** — When a user clicks an empty slot (or uses a new "Add new task" option in the task picker), they can create a brand-new kanban card *and* schedule it in one flow. The card is inserted into the **first column** (typically "To Do") of a user-selected project board.

Both features integrate with the existing hour-slot capacity system, drag-and-drop, and duration picker.

## Goals

- Allow users to deliberately schedule rest periods in their focus calendar to promote sustainable productivity.
- Let users capture new tasks directly from the focus calendar without switching to a kanban board first.
- Maintain visual clarity — breaks and tasks should look distinct at a glance.

## Non-goals / Out of Scope

- Break timer / break notification sounds — breaks are passive calendar entries (no timer runs).
- Recurring/auto-scheduled breaks (e.g. "break every 2 hours") — manual only for now.
- Creating a *new board* from the focus calendar — only adding to existing boards.
- Editing break descriptions or attaching notes to breaks.

## User Experience / Flows

### A. Adding a Break Block

1. User clicks an empty slot or the "+ Add task (Xm free)" button.
2. Instead of (or in addition to) the Task Picker Dialog, user sees a secondary option: **"Add break"**.
   - *Option A*: Add a "Break" tab/button at the top of the Task Picker Dialog.
   - *Option B*: Add an "Add break" button directly in the hour slot alongside "+ Add task".
   - **Recommended: Option B** — keeps the flow lightweight and avoids polluting the task picker.
3. Clicking "Add break" opens the Duration Picker (reused) pre-populated with "Break" as the title.
4. A break block is created for that slot with the chosen duration.
5. The break block renders with a distinct visual style (e.g. muted/dashed border, coffee icon, different accent color).
6. Breaks can be deleted and drag-and-dropped like task blocks, but **cannot be started** (no Play button).

### B. Quick-Add Task from Calendar

1. In the Task Picker Dialog, below the search/filter bar, add a **"+ Create new task"** row/button.
2. Clicking it opens an inline form or small dialog:
   - Text input for the task title (required).
   - Board selector dropdown (lists all kanban boards).
3. On submit:
   - A new `KanbanCard` is created in the first column (lowest `order`) of the selected board.
   - The flow continues into the Duration Picker as usual, then the time block is created.
4. The new card also appears in the kanban board's "To Do" column.

## Data Model

### Break Blocks

Breaks reuse the existing `TimeBlock` table with a sentinel/marker approach — **no schema migration needed**:

- `cardId`: set to a well-known constant, e.g. `"__break__"`.
- `pageId`: set to `"__break__"` (no real board association).
- All other fields (`date`, `startHour`, `durationMinutes`, `status`) work identically.

A type-guard helper `isBreakBlock(block: TimeBlock): boolean` checks `block.cardId === "__break__"`.

**Alternative considered**: Adding a `type: "task" | "break"` column to `TimeBlock`. This would require a DB migration (version 7). The sentinel approach avoids this entirely and is sufficient since breaks carry no card/page payload.

**Schema changes required**: **None** — no Dexie version bump or migration.

### Quick-Add Task

Uses existing `createCard()` from `db-helpers.ts` to insert the card into the first column of the chosen board. The resulting card ID is then passed to `createTimeBlock()`. No new tables or fields.

## Technical Approach

### 1. Break Block Support

| Bucket | File(s) | Change |
|--------|---------|--------|
| Lib/helpers | `focus-helpers.ts` | Add `BREAK_CARD_ID = "__break__"`, `BREAK_PAGE_ID = "__break__"` constants. Add `createBreakBlock(date, startHour, durationMinutes)` helper. Add `isBreakBlock(block)` guard. |
| UI | `hour-slot.tsx` | Add "+ Add break" button alongside existing "+ Add task" button for slots with remaining capacity. |
| UI | `time-block-card.tsx` | Detect break blocks via `isBreakBlock()`. Render with distinct style (dashed border, coffee/cup icon, muted color). Hide Play button and board/card name. Show "Break" label. |
| UI | `day-calendar.tsx` | Pass a new `onAddBreak(hour)` callback to `HourSlot`. |
| Hook | `use-focus-view.ts` | Add `handleAddBreak(hour)` — opens duration picker with break-specific context. Add `handleBreakDurationSelected(minutes)` to create the break block. |
| UI | `focus-view.tsx` | Wire new break-related callbacks. |
| UI | `session-complete-dialog.tsx` | No change — breaks never start sessions. |
| Store | `app-store.ts` | No change — breaks don't interact with `activeSession`. |

### 2. Quick-Add Task from Calendar

| Bucket | File(s) | Change |
|--------|---------|--------|
| UI (new) | `create-task-dialog.tsx` (~80 lines) | New dialog with title input + board selector dropdown. Returns `{ title, pageId, columnId }`. |
| UI | `task-picker-dialog.tsx` | Add "+ Create new task" button at top of list. On click, open `CreateTaskDialog`. On task created, continue to duration picker flow. |
| Hook | `use-focus-view.ts` | Add `handleCreateAndSchedule(title, pageId, columnId)` — calls `createCard()`, then feeds result into existing `handleSchedule()` flow. |
| Lib | `db-helpers.ts` | No change — reuses existing `createCard()`. |
| Lib | `focus-helpers.ts` | May need a helper to get the first column of a board: `getFirstColumn(pageId)`. |

### 3. Export/Import Compatibility

Break blocks export as normal `TimeBlock` rows (with `cardId: "__break__"`). On import they are restored as-is. No changes to `data-transfer.ts`.

## Impacted Areas

### UI / Components
- `hour-slot.tsx` — Add break button
- `time-block-card.tsx` — Break block rendering
- `day-calendar.tsx` — Pass break callback
- `focus-view.tsx` — Wire new handlers
- `task-picker-dialog.tsx` — Add "Create new task" entry point
- **New file**: `create-task-dialog.tsx` (~80 lines)

### State / Store
- No changes to `app-store.ts`

### Data Layer / DB
- `focus-helpers.ts` — Break constants, `createBreakBlock()`, `isBreakBlock()`
- `db.ts` — **No changes** (no migration)
- `db-helpers.ts` — No changes (reuses `createCard()`)

### Types
- `types/index.ts` — **No changes** (sentinel approach avoids new fields)

### Import / Export
- `data-transfer.ts` — **No changes** (break blocks serialize as normal TimeBlocks)

### Tests / Docs
- `ideas_backlog.md` — Mark task as spec'd

## Edge Cases & Risks

1. **Break blocks in queries**: `getAllEligibleCards()` and `getUnscheduledCards()` filter by real kanban cards, so breaks won't appear there. However, `getTimeBlocksForDate()` returns all blocks including breaks — consumers (e.g. `todayBlocks` stats in header) will count break minutes in `totalMinutes`. **Decision needed**: should break minutes be included in the "X tasks, Ym scheduled" header stats, or excluded?

2. **Drag-and-drop**: Break blocks use the same `TimeBlock` shape, so DnD should work out-of-the-box. The `useDraggable` hook in `TimeBlockCard` will function normally.

3. **Auto-skip for past breaks**: `markSkippedBlocks()` will mark past break blocks as "skipped". This is harmless but the "Missed" badge + "Reschedule" button would appear on an expired break. We should suppress the "Missed" badge and "Reschedule" for break blocks since they're passive.

4. **Session start on break**: Must ensure clicking a break block does NOT trigger `handleStartBlock`. The Play button is hidden, but `onStart` should also be guarded.

5. **Quick-add task — board with no columns**: Edge case if a kanban board has zero columns. Guard with a check; only show boards that have at least one column in the selector.

6. **200-line file limit**: `task-picker-dialog.tsx` is currently ~120 lines. Adding the "+ Create new task" button adds ~10 lines; the creation dialog is a separate file. `time-block-card.tsx` is ~120 lines; break rendering adds ~15 lines of conditional logic — still under 150. `use-focus-view.ts` is ~100 lines; adding break + create-task handlers adds ~30 lines — still under 150. All files remain within the 200-line ceiling.

7. **Capacity accounting**: Break blocks consume slot capacity identically to task blocks. This is correct behavior — a 15-minute break in a slot leaves 45 minutes for tasks.

## Verification Checklist

- [ ] Break block can be added to any non-past hour slot with remaining capacity
- [ ] Break block renders with distinct visual style (no Play button, "Break" label, icon)
- [ ] Break block can be deleted
- [ ] Break block can be drag-and-dropped to another slot
- [ ] Break block respects hour capacity limits
- [ ] Break blocks do not trigger focus session/timer
- [ ] Past break blocks do NOT show "Missed" badge or "Reschedule" button
- [ ] New task can be created from Task Picker Dialog
- [ ] New task appears in the selected board's first column
- [ ] After creation, duration picker flow works normally and time block is scheduled
- [ ] Board selector only shows boards with at least one column
- [ ] Export/import works with break blocks present
- [ ] No file exceeds 200 lines
- [ ] `pnpm build` passes with no errors
- [ ] `pnpm lint` passes

## Feasibility Assessment

**Highly feasible.** Both sub-features build on existing patterns (TimeBlock CRUD, duration picker, card creation) with minimal new surface area. The sentinel approach for breaks avoids a DB migration entirely. The quick-add task flow reuses `createCard()` and only needs a small new dialog component.

## Size: Medium

- Touches multiple buckets (UI components, focus-helpers, hook), but **no DB migration**.
- ~6 files modified, 1 new file created.
- Coordinated changes across hour-slot → day-calendar → focus-view → use-focus-view pipeline.
- No store changes, no type changes, no export/import changes.

## Open Questions / Assumptions

1. **Break stats**: Should break minutes be **included** or **excluded** from the focus header stats ("X tasks, Ym scheduled")? Assumption: **excluded** — they're rest, not work.

2. **Break visual style**: Dashed border + coffee icon + a neutral/warm accent color (e.g. `bg-orange-500/5`). Any preference on color/icon?

3. **Board selector default**: When creating a new task from the calendar, should the board selector default to the **currently active board** (the one whose kanban view triggered focus mode)? Assumption: **yes**.

4. **Column placement**: New tasks go into the board's first column (lowest `order`). Should this always be the case, or should the user pick a column? Assumption: **always first column** ("To Do") to keep the flow fast.
