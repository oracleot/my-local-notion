# Focus Timer Persistence Across App Restart

## Summary

When a user refreshes, closes, or restarts the app while a focus timer is running, the timer currently **pauses** and requires the user to manually resume it and potentially adjust the elapsed time. This is a poor UX because the user may not notice the pause and loses accurate tracking of their focus session.

The requested behavior is for the timer to **continue counting down based on wall-clock time**, automatically resuming from where it should be when the app reopens. If the session should have completed while the app was closed, it should show the completion state immediately.

The existing codebase already persists the session to `localStorage` and uses wall-clock timestamps (`startedAt`, `elapsedBeforePause`) for drift-free timing. The core change is to stop auto-pausing on reload and instead let the timer resume running.

## Goals

- When the app is refreshed/reopened with a **running** session, the timer should **continue running** (not pause), correctly reflecting elapsed wall-clock time.
- If the timer would have reached zero while the app was closed, show the **completion state** immediately (including the audio chime).
- No manual intervention required from the user to "catch up" the timer.

## Non-goals / Out of Scope

- Persisting timer across different devices or browsers (this is local-only).
- Background notifications / push notifications when the timer completes while the app is closed.
- Service Worker–based background timer execution.
- Changes to the Zen Mode behavior.
- Changes to the session log or journal persistence.

## User Experience / Flows

### Flow 1: Refresh while running, time remaining
1. User starts a 60-minute focus session and works for 20 minutes.
2. User refreshes the page (or browser crashes/restarts).
3. App reopens — the timer automatically shows ~40 minutes remaining and is **running** (pulsing dot visible, countdown active).
4. No user action needed.

### Flow 2: Refresh while running, timer would have completed
1. User starts a 25-minute focus session and works for 30 minutes (leaving the app closed for the final 5+ minutes).
2. User reopens the app.
3. Timer immediately shows the **completion state** (00:00, green badge, chime plays).
4. User can stop/dismiss as normal.

### Flow 3: Refresh while paused
1. User pauses their session, then refreshes.
2. App reopens — session is still **paused** at the same remaining time. No change from current behavior.

## Data Model

**No schema changes or migrations required.**

The `FocusSession` type already contains all necessary fields:
- `startedAt: number` — Unix ms timestamp when timer was last started/resumed
- `elapsedBeforePause: number` — accumulated seconds from previous runs
- `isRunning: boolean` — whether the timer is actively counting
- `totalSeconds: number` — total session duration

These are persisted to `localStorage` under the key `"focus-session"`. The wall-clock math in `getRemainingSeconds()` already correctly computes remaining time from these fields regardless of when it's called.

## Technical Approach

### Core Change (1 function edit)

The **only** required change is in `loadPersistedSession()` in `src/stores/app-store.ts` (lines 18–31). Currently this function detects a running session and force-pauses it:

```ts
// Current behavior — REMOVE THIS
if (session.isRunning) {
  const elapsed = session.elapsedBeforePause + (Date.now() - session.startedAt) / 1000;
  session.elapsedBeforePause = Math.min(elapsed, session.totalSeconds);
  session.isRunning = false;
  session.startedAt = 0;
}
```

**Replace with**: Leave `isRunning: true` and `startedAt` untouched. The existing `getRemainingSeconds()` will naturally compute the correct remaining time using the original `startedAt` timestamp. If the elapsed time exceeds `totalSeconds`, it clamps to 0 (completion).

```ts
// New behavior — keep running, no mutation needed
// getRemainingSeconds() handles wall-clock math correctly
// If session completed while away, remainingSeconds will be 0
// and the completion flow (chime + UI) triggers automatically
```

That's it. The rest of the system already handles this correctly:
- `getRemainingSeconds()` uses `Date.now() - session.startedAt` — works across restarts.
- `useFocusTimer` hook starts its `requestAnimationFrame` loop when `activeSession?.isRunning` is true.
- The chime effect fires when `remainingSeconds <= 0 && audioEnabled`.
- The badge UI shows the correct state based on `isRunning` and `isComplete`.

### Edge Case: Extremely long absence

If a user leaves the app closed for hours/days with a running timer, `getRemainingSeconds()` returns `0` and `isComplete` becomes true. The session stays in this state until the user explicitly stops it. This is acceptable — same as the current completion behavior.

## Impacted Areas

### UI / Components
- None — UI components already handle all states correctly (running, paused, complete). No changes needed.

### State / Store
- **`src/stores/app-store.ts`** — `loadPersistedSession()`: Remove the force-pause logic (~6 lines deleted). This is the only code change.

### Data Layer / DB
- None — no IndexedDB/Dexie changes. `localStorage` usage remains the same.

### Types
- None — `FocusSession` type is unchanged.

### Import / Export
- Not affected.

### Tests / Docs
- No existing test files to update.
- Backlog item in `docs/ideas_backlog.md` can be marked as done after implementation.

## Edge Cases & Risks

| Edge Case | Mitigation |
|---|---|
| User closes app for longer than the session duration | `getRemainingSeconds()` clamps to 0; completion state shown on reopen. Works today. |
| `localStorage` is cleared between sessions (private browsing) | Session is lost — same as current behavior. No regression. |
| Clock skew (user changes system time backward) | Could show more remaining time than expected. Low risk — same risk exists today during a running session. |
| Multiple tabs open | `localStorage` is shared across tabs. Each tab will load the same session — existing behavior, no regression. |
| Session `startedAt` is very old (days) | `getRemainingSeconds` returns 0. Completion state shown. Acceptable. |

## Verification Checklist

- [ ] Start a focus session, refresh the page — timer continues running with correct remaining time.
- [ ] Start a 1-minute session, close the app for >1 minute, reopen — completion state and chime shown immediately.
- [ ] Pause a session, refresh — session remains paused at the correct time.
- [ ] Stop a session, refresh — no session shown (clean state).
- [ ] Badge in header shows correct running/paused/complete state after refresh.
- [ ] Zen mode can still be toggled after a reload-resumed session.
- [ ] `pnpm build` passes, `pnpm lint` passes.

## Feasibility Assessment

**This is an extremely straightforward change.** The existing architecture was designed with wall-clock timestamps specifically to support drift-free timing. The only thing preventing persistence-across-restart is a single guard clause that force-pauses on load. Removing it unlocks the desired behavior with zero side effects.

## Size: Small

- Single function edit in one file (`app-store.ts`)
- ~6 lines removed, 0 lines added (or a brief comment)
- No DB schema changes, no migrations
- No new components, hooks, or types
- No cross-feature coupling
- Blast radius: 1 file

## Open Questions / Assumptions

1. **Assumption**: It is acceptable that if the timer completes while the app is closed, the user sees the completion state (with chime) upon reopening — even if that's hours later. There is no background notification mechanism.
2. **Assumption**: The multi-tab scenario (same session loaded in multiple tabs) does not need special handling beyond what exists today.
3. **Question**: Should there be a brief toast or visual indicator on load that says "Timer resumed" to make the auto-resume obvious to the user? (Nice-to-have, not strictly required.)
