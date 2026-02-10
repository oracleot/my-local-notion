# Unstarted Task Reminder Notifications

## Summary

When a user schedules a task on the focus calendar but doesn't start it, they should receive periodic in-app reminder notifications until the task's scheduled time elapses. This helps users stay accountable to their planned focus schedule without silently missing scheduled tasks.

The feature introduces a background polling mechanism that checks for unstarted scheduled tasks and displays toast notifications every 5 minutes (configurable) for any task that's past its scheduled start time but hasn't been started and hasn't expired yet.

## Goals

- Notify users when a scheduled task's start time has passed without the task being started.
- **Only notify for tasks in the current hour block** — not future hours, not past hours.
- Repeat reminders every N minutes (default 5, user-configurable) until the task's scheduled hour ends.
- Provide a non-intrusive in-app notification (toast) that allows users to:
  - Start the task directly
  - Dismiss/snooze the reminder
- Stop reminders when the task is started, completed, or its time slot expires (marked as "skipped").
- Allow users to customize the reminder interval via Focus Settings.

## Non-goals / Out of Scope

- Browser/OS push notifications (requires Service Worker and user permission).
- Notifications while the app is closed/backgrounded.
- Per-task reminder intervals (global setting only).
- Notifications for future hour blocks (only the current hour).
- Deep integration with OS calendar or external notification systems.

## User Experience / Flows

### Flow 1: Scheduled task not started
1. User schedules a task for 10:00 AM (60-minute block).
2. At 10:00 AM, user is in the app but doesn't start the task.
3. At 10:00 AM (immediately when the hour starts): First toast appears — "Task 'Project Review' was scheduled for 10:00 AM. Start now?"
4. User dismisses or ignores the toast.
5. At 10:05 AM (or per user's configured interval): Second reminder toast appears.
6. This continues every N minutes as configured.
7. At 11:00 AM: Task's hour has elapsed. Block is auto-marked "skipped". No more reminders for this block.

### Flow 2: User starts the task
1. User sees reminder toast, clicks "Start".
2. Focus session begins for that task.
3. No further reminders for this block (it's now active).

### Flow 3: User dismisses reminder
1. User clicks "Dismiss" on the toast.
2. Toast closes.
3. Reminder reappears in 5 minutes if task still not started and time hasn't elapsed.

### Flow 4: App opened after scheduled time
1. User scheduled a task for 10:00 AM but opened the app at 10:15 AM.
2. If the task's hour hasn't elapsed (before 11:00 AM), a reminder toast appears immediately.
3. Continues every 5 minutes until task is started or hour elapses.

### Flow 5: No scheduled tasks or all tasks started
1. No toasts appear. System runs silently in background.

## Data Model

**Minor schema addition to FocusSettings — no migration required.**

Existing `TimeBlock` model has all necessary fields:
- `date: string` — ISO date (YYYY-MM-DD)
- `startHour: number` — 0–23
- `durationMinutes: number` — how long the block is scheduled for
- `status: "scheduled" | "completed" | "skipped"` — current state

The reminder system derives "unstarted" status from:
- `status === "scheduled"` — not completed or skipped
- No active `FocusSession` with matching `timeBlockId` or `cardId`
- `startHour === currentHour` — **only the current hour block**

**New field on `FocusSettings`**:
- `reminderIntervalMinutes: number` — default `5`, range 1–15 minutes

This field is added to the existing `FocusSettings` interface and handled via Dexie's schema-less flexibility (no version bump needed for optional fields with defaults).

**Runtime state** (not persisted):
- `lastNotifiedAt: Map<string, number>` — tracks last notification timestamp per blockId to enforce interval. Resets on page refresh (acceptable).

## Technical Approach

### 1. Add Sonner Toast Infrastructure

Install and configure Sonner for in-app notifications:

```bash
pnpm add sonner
```

- Add `<Toaster />` to `app-layout.tsx` (below the main layout, respects theme)
- Use `toast()` function from Sonner to show notifications
- Configure position (bottom-right), theme (inherit from app), and styling

### 2. Create Reminder Hook: `useUnstartedTaskReminders`

New hook in `src/lib/use-unstarted-reminders.ts`:

```ts
export function useUnstartedTaskReminders() {
  // Polls every 60 seconds to check for unstarted tasks
  // Tracks last notification time per blockId in a Map
  // Shows toast with task title and "Start" / "Dismiss" actions
}
```

**Logic flow**:
1. If `zenMode === true` → skip all checks (user is actively focusing)
2. Query `db.timeBlocks` for today's date with `status === "scheduled"`
3. Filter blocks where:
   - `startHour === currentHour` — **only current hour block**
4. For each qualifying block:
   - Check if an active FocusSession exists for this cardId/timeBlockId → skip if yes
   - Check `lastNotifiedAt.get(blockId)` — if more than `reminderIntervalMinutes` ago (or never), show toast
5. Toast actions:
   - "Start" → triggers `startSession()` for that block
   - "Dismiss" → closes toast (block will be re-notified after interval)

### 3. Integrate Hook in App Layout

Mount `useUnstartedTaskReminders()` in `app-layout.tsx` so it runs globally whenever the app is open:

```tsx
export function AppLayout() {
  useUnstartedTaskReminders(); // Always running in background
  // ...
}
```

### 4. Toast Notification Design

Compact, non-intrusive toast:
- **Icon**: Clock or bell
- **Title**: "Scheduled task overdue"
- **Description**: "{Task Title} was scheduled for {HH:MM}"
- **Actions**: [Start] [Dismiss]
- **Auto-dismiss**: None (persists until action or 5 min passes)
- **Position**: Bottom-right (default Sonner position)

## Impacted Areas

### UI / Components
- `src/components/layout/app-layout.tsx` — mount reminder hook + Sonner `<Toaster />`
- `src/components/focus/focus-settings-dialog.tsx` — add reminder interval setting (slider or number input)

### State / Store
- `src/stores/app-store.ts` — no changes needed; existing `startSession()` is reused

### Data Layer / DB
- `src/lib/db.ts` — no changes
- `src/lib/focus-helpers.ts` — update `DEFAULT_SETTINGS` to include `reminderIntervalMinutes: 5`

### Lib / Hooks
- New: `src/lib/use-unstarted-reminders.ts` — core reminder logic

### Types
- `src/types/index.ts` — add `reminderIntervalMinutes?: number` to `FocusSettings` interface

### Import / Export
- Not affected

### Tests / Docs
- Update `docs/ideas_backlog.md` to mark feature as addressed

## Edge Cases & Risks

| Edge Case | Handling |
|---|---|
| Multiple unstarted tasks at same hour | Show one toast per task, staggered by a few seconds to avoid overwhelming |
| User is in Zen mode | **No reminders** — Zen mode means user is actively working on a task; no interruptions |
| Task duration crosses hour boundaries | Only notify during `startHour === currentHour`; once the hour passes, auto-skip handles it |
| User has no scheduled tasks | Hook silently no-ops; no toasts shown |
| App refreshed mid-hour | `lastNotifiedAt` resets, but the 60s polling will re-check and notify. Acceptable for user awareness. |
| Task block partially overlaps with a currently running session for a different task | Show reminder — user has multiple tasks scheduled and one isn't started |
| Past days' blocks | Only check today's date. Past days are ignored. |
| Notification shown after user manually marked block as skipped | No reminder — `status !== "scheduled"` check filters it out |
| User changes reminder interval mid-hour | New interval takes effect on next poll cycle |

## Verification Checklist

- [ ] Schedule a task for the current hour, don't start it → toast appears within 60 seconds
- [ ] Dismiss the toast → same toast reappears 5 minutes later
- [ ] Click "Start" on toast → focus session starts for that task, no more reminders
- [ ] Start a task via the Focus calendar (not via toast) → no reminders for that block
- [ ] Task's hour fully elapses → block becomes "skipped", no more reminders
- [ ] Enter Zen mode → no reminder toasts shown
- [ ] Multiple unstarted tasks at same hour → multiple toasts appear (reasonable limit)
- [ ] App reload mid-hour → reminders resume correctly after a brief delay
- [ ] `pnpm build` passes, `pnpm lint` passes
- [ ] Toast styling matches app theme (light/dark mode)
- [ ] Change reminder interval in settings → new interval takes effect
- [ ] Set interval to 0 → reminders disabled entirely

## Feasibility Assessment

**Feasible with moderate complexity.** The core logic is straightforward polling + filtering, but this feature requires:
1. Setting up a toast infrastructure (new UI component or new dependency)
2. Creating a background polling hook with memory-based rate limiting
3. Wiring up toast actions to existing session-start logic

No database migrations. No schema changes. The biggest decision is whether to use Sonner (simpler, adds a dependency) or build a minimal Radix Toast (more code, no new dependency).

## Size: Medium

- **Multiple buckets affected**: UI (toaster), lib (new hook), layout (integration)
- **New dependency or component**: Toast system
- **Coordinated changes**: Hook logic + UI + app-level mounting
- **No DB schema changes**: Correct, keeps it from being Large
- **Estimated files**: 3–4 new/modified files, total ~150–200 lines added

## Open Questions / Assumptions

1. **Resolved**: Reminders are shown even on Focus view — user may have it open but be distracted. ✓

2. **Resolved**: Reminder interval is customizable via `FocusSettings.reminderIntervalMinutes`. Setting to `0` disables reminders. ✓

3. **Assumption**: A single dismissed toast is enough to "snooze" for the configured interval. No separate snooze duration UI needed.

4. **Resolved**: Sonner is the chosen toast library. ✓

5. **Resolved**: Zen mode suppresses all reminders — user is actively focusing on a task. ✓

6. **Assumption**: Toast includes board name for context (e.g., "Project Review · Work Board").

7. **Assumption**: Default interval is 5 minutes; range 1–15 minutes (or 0 to disable).
