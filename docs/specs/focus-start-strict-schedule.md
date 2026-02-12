# Spec: Safe Focus Timer Start (Strict Schedule)

## Summary
Currently, when a user starts a scheduled focus task late (e.g., starting a 10:00–10:30 task at 10:05), the timer starts with the full original duration (30 mins), pushing the session end time past the scheduled slot (to 10:35). This misalignment disrupts the day's schedule.

This spec proposes implementing **Strict Schedule Enforcement**: when a user starts a block, the system calculates the *scheduled end time* and reduces the timer duration if the current time is effectively "late".

## Goals
-   Ensure focus sessions respect their scheduled boundaries.
-   Prevent sessions from bleeding into subsequent time slots by default.
-   Provide visual feedback (toast/notification) when a session is shortened due to a late start.

## Non-goals / Out of Scope
-   Auto-starting tasks without user intervention (Idea 8 mentioned "automatically start", but we prioritize safe, user-initiated starts first to avoid UX surprises).
-   Changing how "past" blocks are handled (they remain disabled/skipped).

## User Experience / Flows

1.  **Standard Start (On Time)**
    -   A task is scheduled for 10:00–10:30.
    -   User clicks "Play" at 10:00.
    -   Timer starts with 30:00 remaining.

2.  **Late Start**
    -   A task is scheduled for 10:00–10:30.
    -   User clicks "Play" at 10:05.
    -   System calculates remaining time as 25 minutes.
    -   **Toast Notification**: "Session adjusted to 25m to match scheduled end time (10:30)."
    -   Timer starts with 25:00 remaining.

## Technical Approach

### 1. Calculate Effective Time Range
Since blocks stack sequentially within an hour (based on `order` and `duration`), we cannot rely solely on `block.startMinute`. We must compute the effective start/end for the target block dynamically.

New helper in `focus-helpers.ts`:
```typescript
async function getEffectiveBlockTime(block: TimeBlock): Promise<{ start: Date, end: Date } | null>
```
-   Fetches all blocks for `block.date` + `block.startHour`.
-   Sorts by `order`.
-   Simulates the stacking logic (same as `HourSlot` rendering) to find the effective `startMinute` and `endMinute` for the specific `block.id`.
-   Returns `Date` objects for start and end.

### 2. Update `handleStartBlock` in `useFocusView.ts`
-   Call `getEffectiveBlockTime`.
-   Compare `scheduledEnd` with `Date.now()`.
-   `adjustedDuration = scheduledEnd - Date.now()`.
-   `finalDuration = min(originalDuration, adjustedDuration)`.
-   If `finalDuration <= 0`: Show error, abort.
-   If `finalDuration < originalDuration`: Show info toast, use `finalDuration`.
-   Call `store.startSession` with `finalDuration`.

### 3. UI Feedback
-   Add `toast` (from `sonner` or `use-toast`) to `FocusView` or `useFocusView`.

## Impacted Areas
-   **Logic**: `src/lib/use-focus-view.ts` (`handleStartBlock`).
-   **Helpers**: `src/lib/focus-helpers.ts`.
-   **Store**: No changes to store structure, just the value passed to it.
-   **UI**: No visual component changes, just behavior.

## Edge Cases & Risks
-   **Drift**: Small drift between client time and "scheduled" time is acceptable.
-   **Stacked Blocks**: If Block A (10:00-10:20) and Block B (10:20-10:40) exist.
    -   User ignores A.
    -   At 10:25, user starts B.
    -   Block B is "late" (5 mins into its slot). It gets 15 mins. Correct.
    -   What about Block A? It is "skipped" by the auto-skipper eventually.
-   **User Clock**: Relies on user's system clock being reasonably correct (standard for client-side apps).

## Feasibility Assessment
-   **Availability**: High. All data is local in IndexedDB.
-   **Complexity**: Low. Logic is straightforward math.

## Size
-   **Small**
