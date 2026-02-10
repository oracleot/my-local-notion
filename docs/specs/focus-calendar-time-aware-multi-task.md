# Focus Calendar: Time-Aware Hour Blocks & Multi-Task Slots

## Summary

This feature improves how tasks are added to the focus calendar in two connected ways:

1. **Time-aware scheduling within the current hour:** When a user assigns a task to the current hour block, the system shows how much time remains in that hour and offers duration options (e.g., 25 min, 40 min, actual remaining time). A visual indicator on the current hour block shows elapsed/remaining time, updated every ~2 minutes.

2. **Multiple tasks per hour block:** Instead of limiting each hour to a single task, users can stack multiple tasks into one hour slot. For example, if a user selects 25 minutes for a task, the remaining 35 minutes of that hour are still available for additional tasks (up to 2–3 more 25-minute tasks if the hour started fresh).

These two features are tightly coupled — time awareness enables intelligent multi-task stacking by surfacing remaining capacity per slot.

## Goals

- Let users see at a glance how much time remains in the current hour block.
- Allow users to choose a task duration (e.g., 25 min, 40 min, remaining time) instead of always defaulting to `workMinutes`.
- Support multiple tasks within a single hour slot, as long as total duration ≤ 60 min.
- Preserve existing drag-and-drop, reschedule, and skip/complete behaviors.

## Non-goals / Out of Scope

- Sub-minute precision or second-level scheduling.
- Overlapping blocks across hour boundaries (a 40 min task at 10:30 spilling into 11:00 — tasks stay within their assigned hour).
- Changing the underlying `TimeBlock` schema (the current schema already supports `durationMinutes` and `startHour` — multiple blocks can share the same `startHour`).
- Pomodoro-style automatic break insertion between stacked tasks.

## User Experience / Flows

### Flow 1: Scheduling to the current hour

1. User clicks "+ Add task" on the **current** hour slot (e.g., 10 AM, current time is 10:15).
2. After picking a task from `TaskPickerDialog`, a **duration picker** appears showing:
   - Remaining time in the hour (e.g., "45 min remaining").
   - User-configured preset duration buttons (e.g., 25 min, 40 min — managed in Focus Settings) plus the actual remaining time.
   - Custom input option for arbitrary minutes (no enforced minimum).
3. User selects a duration → time block is created with that `durationMinutes`.

### Flow 2: Scheduling to a future/non-current hour

1. User clicks "+ Add task" on a future hour slot.
2. After picking a task, the **duration picker** shows:
   - Available capacity in that hour (60 min if empty, less if other tasks exist).
   - User-configured preset buttons (filtered to only show durations ≤ available capacity).
3. User selects a duration → time block is created.

### Flow 3: Multiple tasks in one slot

1. An hour slot already has a 25 min task. The slot shows "35 min available".
2. User clicks "+Add" within that partially-filled slot.
3. `TaskPickerDialog` → duration picker (capped at 35 min) → new block created.
4. The hour slot now renders both task cards stacked vertically, each showing its duration.

### Flow 4: Visual time indicator on current hour

- The current hour slot shows a **shaded gradient overlay** indicating how much of the hour has passed (e.g., left portion shaded = elapsed time).
- Updated every ~2 minutes (re-uses the existing 60s interval in `DayCalendar`).

## Data Model

**No schema changes or migrations required.**

The existing `TimeBlock` type already supports this feature:
- `startHour: number` — multiple blocks can share the same `startHour`.
- `durationMinutes: number` — already exists, currently defaults to `settings.workMinutes` (60).

The key constraint is enforced in application logic: `SUM(durationMinutes) for blocks at the same (date, startHour) ≤ 60`.

### Affected types
- `TimeBlock` — no changes needed.
- `FocusSettings` — **add `durationPresets: number[]`** field (e.g., `[25, 40, 60]`). Users configure their preferred preset durations in the settings dialog. Default: `[25, 40, 60]`.

## Technical Approach

### 1. Helper changes (`focus-helpers.ts`)

- **`getRemainingCapacity(date, hour)`** — new function. Returns `60 - SUM(durationMinutes)` for blocks at that (date, hour). For the current hour on today, also factors in elapsed minutes within the hour.
- **`findAvailableHour()`** — update to consider capacity (hour is "available" if remaining capacity > 0, not just "no blocks exist").
- **`createTimeBlock()`** — add validation: reject if requested duration > remaining capacity for that slot.

### 2. New UI component: Duration Picker Dialog

- **`duration-picker-dialog.tsx`** — new component (~80–100 lines).
- Shows: remaining capacity, user-configured preset buttons (from `settings.durationPresets`), plus a "remaining time" button and custom input.
- Preset buttons are dynamically filtered to only show options ≤ available capacity.
- No enforced minimum duration — the user decides.
- For the current hour, shows a "Time left in this hour: Xm" notice.

### 3. `HourSlot` changes (`hour-slot.tsx`)

- Change `block: TimeBlock | undefined` prop to `blocks: TimeBlock[]`.
- Render multiple `TimeBlockCard` components stacked vertically when multiple blocks exist.
- Show remaining capacity text (e.g., "+35 min available") below existing blocks when the slot isn't full.
- When partially filled, show "+ Add task" button alongside existing cards.
- Add a **shaded gradient overlay** (CSS `linear-gradient` with a semi-transparent fill from left to right) for the current hour showing elapsed time proportion.

### 4. `DayCalendar` changes (`day-calendar.tsx`)

- Change `blocksByHour` from `Map<number, TimeBlock>` to `Map<number, TimeBlock[]>`.
- Update droppable logic: allow dropping onto a slot if remaining capacity ≥ dragged block's duration.
- Pass `blocks` (array) instead of `block` (single) to `HourSlot`.
- Extend the existing 60s interval to also update a `currentMinute` state for the time progress indicator.

### 5. `TimeSlotPicker` changes (`time-slot-picker.tsx`)

- Change from fully disabling occupied hours to showing remaining capacity per hour.
- Disable an hour only if remaining capacity is 0 (fully booked).
- Show capacity text next to each hour button (e.g., "10:00 AM — 35m free").

### 6. `use-focus-view.ts` hook changes

- Update `handleSchedule` and `handleTimeSlotSelected` to open the new Duration Picker Dialog after task/slot selection.
- Add state: `durationPickerOpen`, `pendingDuration`, `availableCapacity`.
- In the scheduling flow: TaskPicker → TimeSlotPicker (if needed) → **DurationPicker** → `createTimeBlock(...)`.

### 7. `TimeBlockCard` changes (`time-block-card.tsx`)

- Minor: ensure the duration badge is always visible (currently it shows `{block.durationMinutes}m`; this becomes more important when blocks have different durations).

### 8. `FocusView` changes (`focus-view.tsx`)

- Wire up the new `DurationPickerDialog`.

## Impacted Areas

### UI / Components
- `hour-slot.tsx` — multi-block rendering, progress indicator, capacity display
- `day-calendar.tsx` — `blocksByHour` becomes 1:many, droppable capacity validation
- `time-slot-picker.tsx` — capacity-aware hour buttons instead of binary occupied/available
- `time-block-card.tsx` — minor (duration badge prominence)
- `focus-view.tsx` — wire up DurationPickerDialog
- **NEW** `duration-picker-dialog.tsx` — duration selection UI

### State / Store
- `use-focus-view.ts` — new state for duration picker, updated scheduling flow

### Data Layer / DB
- `focus-helpers.ts` — new `getRemainingCapacity()`, update `findAvailableHour()`, validate `createTimeBlock()`
- `db.ts` — **no changes**

### Types
- `types/index.ts` — add `durationPresets: number[]` to `FocusSettings`

### Import / Export
- `data-transfer.ts` — **no changes** (TimeBlock shape unchanged)

### Tests / Docs
- Verification via manual testing (see checklist below)

## Edge Cases & Risks

1. **Race condition on capacity checks:** Two rapid "Add task" clicks could both read 35 min remaining and both try to add 25 min tasks (total 50 > 35). Mitigation: validate inside `createTimeBlock()` with a read-then-write pattern. Dexie transactions can help here.

2. **Current-hour elapsed time vs. scheduled duration:** If 40 minutes of the current hour have passed, the remaining capacity is only 20 minutes. But what if a 25-min task was originally scheduled at the start? It's "running" logically but time has passed. Decision: remaining capacity for the current hour = `60 - elapsed_minutes - SUM(durations of other incomplete blocks)`, but only if the user is adding a NEW block. Existing blocks aren't retroactively shortened.

3. **Drag-and-drop to a nearly-full slot:** If a user drags a 60-min block onto a slot with 25 min remaining, the drop should be rejected (visually — slot doesn't highlight as droppable). Need to pass block duration info to the droppable validation.

4. **`workMinutes` setting interaction:** Currently `settings.workMinutes` is the default duration. With this feature, it becomes one of the duration presets (and the first/default selection in the picker), but users can override per-block via their configured presets or custom input. No conflict, but worth noting.

5. **200-line file limit:** `hour-slot.tsx` (currently ~88 lines) will grow with multi-block rendering + progress indicator. Should stay under 150 lines. `day-calendar.tsx` (currently ~110 lines) is fine. The new `duration-picker-dialog.tsx` should target ~80–100 lines.

6. **Visual clutter with many small tasks:** An hour with 4×15-min tasks could look cramped. Mitigation: compact card variant for blocks < 30 min (smaller padding, single-line).

8. **Duration presets persistence:** The `durationPresets` field is added to `FocusSettings`. Since this uses Dexie's schema-less document model, no DB migration is needed — the field defaults to `[25, 40, 60]` when absent. The upgrade path is handled in `getFocusSettings()` by merging defaults.

7. **Week calendar view:** The `WeekCalendar` component shows daily summaries and isn't directly affected by multi-task slots, but block count per day should remain accurate.

## Verification Checklist

- [ ] Current hour slot shows elapsed time progress indicator, updating every ~2 min.
- [ ] Clicking "+ Add task" on the current hour shows remaining time and correct duration options.
- [ ] Duration picker prevents selecting a duration > available capacity.
- [ ] Multiple tasks can be stacked in a single hour slot (verify 2, 3, 4 tasks).
- [ ] Total duration of tasks in a slot never exceeds 60 minutes.
- [ ] Hour slot visually renders all stacked tasks with their individual durations.
- [ ] Partially-filled slots show "+ Add task" with remaining capacity.
- [ ] `TimeSlotPicker` shows per-hour capacity instead of binary occupied/available.
- [ ] Drag-and-drop respects capacity constraints at the target slot.
- [ ] Drag-and-drop of a block from a multi-task slot correctly frees capacity.
- [ ] Rescheduling a block from a multi-task slot works correctly.
- [ ] Deleting a block from a multi-task slot frees its capacity.
- [ ] Skipped-block marking still works with multiple blocks per hour.
- [ ] `findAvailableHour()` considers partial capacity (doesn't skip slots with room).
- [ ] No component exceeds 200 lines.
- [ ] Build passes (`pnpm build`), no lint errors.

## Feasibility Assessment

**Fully feasible.** No schema migration, no new DB tables, no breaking changes to existing data. The `TimeBlock` model already supports variable `durationMinutes` and multiple blocks per `startHour` — the constraint was only in the UI/helper layer (1:1 mapping in `blocksByHour`).

The main complexity is in the UX flow refinement (duration picker, capacity display, current-hour time awareness) and updating the `Map<number, TimeBlock>` → `Map<number, TimeBlock[]>` assumption across ~5 files.

## Size: Medium

- Touches multiple buckets: UI (6 files), state/hooks (1 file), helpers (1 file).
- No DB schema changes or migrations.
- New component needed (DurationPickerDialog).
- Coordinated changes across the scheduling flow (TaskPicker → TimeSlotPicker → DurationPicker → createTimeBlock).

## Open Questions / Assumptions

1. **Should the remaining-time indicator on the current hour factor in running timer state?** Assumed: no — it shows wall-clock time remaining in the hour, independent of whether a focus session is active.

2. ~~**Duration presets:**~~ **Resolved:** Presets are user-configurable via Focus Settings. Default: `[25, 40, 60]`. A "remaining time" option is always shown alongside user presets.

3. ~~**Minimum task duration:**~~ **Resolved:** No enforced minimum — the user decides.

4. **Compact card variant threshold:** At what duration should tasks switch to a compact rendering? Assumed: < 30 min uses compact layout. Left as a design decision for implementation.
