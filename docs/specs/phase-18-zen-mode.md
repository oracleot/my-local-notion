# Phase 18 — Zen Mode & Session Journal

> **Goal**: A full-screen, distraction-free overlay that shows only the current focused task's title, a large countdown timer, and minimal controls. Includes a collapsible note-taking area that saves timestamped journal entries linked to the kanban card — giving tasks a natural place for in-context notes captured during deep work.

---

## Core Concepts

| Concept | Description |
|---------|-------------|
| **Zen Mode** | A `fixed inset-0 z-50` dark overlay that hides all UI chrome — sidebar, top bar, everything. Just you and the task. |
| **Session Log** | A timestamped journal entry linked to a kanban card, captured during a focus session |
| **Zen Journal** | A collapsible textarea at the bottom of the Zen overlay for capturing session logs |

---

## Data Model Extensions

### New `sessionLogs` table

| Field       | Type            | Indexed | Notes                              |
|-------------|-----------------|---------|------------------------------------|
| `id`        | `string` (UUID) | PK      |                                    |
| `cardId`    | `string`        | Yes     | FK → kanbanCard                    |
| `content`   | `string`        |         | The journal entry text             |
| `createdAt` | `Date`          |         | Timestamp of entry                 |

### Zustand Store — New UI State

| Field      | Type      | Notes                                      |
|------------|-----------|--------------------------------------------|
| `zenMode`  | `boolean` | Whether the Zen overlay is active          |

---

## Tasks

### 18.1 — Data Layer

- [ ] **18.1.1** Add `SessionLog` type in `src/types/index.ts`
  - `{ id: string, cardId: string, content: string, createdAt: Date }`
- [ ] **18.1.2** Update Dexie schema in `src/lib/db.ts`
  - Increment to v6
  - Add `sessionLogs` table with indexes on `id`, `cardId`
- [ ] **18.1.3** Add CRUD helpers in `src/lib/db-helpers.ts`
  - `createSessionLog(cardId: string, content: string)` — creates entry with UUID + timestamp
  - `getSessionLogs(cardId: string)` — returns logs ordered by `createdAt` desc
  - `deleteSessionLog(id: string)` — removes a single entry

### 18.2 — Store

- [ ] **18.2.1** Extend Zustand store in `src/stores/app-store.ts`
  - Add `zenMode: boolean` (default `false`)
  - Add `toggleZenMode()` action
  - Modify `endSession()` to set `zenMode: false` (auto-exit on session end)

### 18.3 — Zen Mode UI

- [ ] **18.3.1** Create `src/components/focus/zen-mode-overlay.tsx`
  - Container component: `fixed inset-0 z-50` dark backdrop
  - Reads `zenMode` and `activeSession` from Zustand store
  - Uses `useFocusTimer()` hook for timer controls
  - Composes `ZenModeTimer` and `ZenModeJournal` sub-components
  - Listens for `Escape` key to exit Zen mode
  - Renders `SessionCompleteDialog` when timer reaches 0
  - Only mounts when `zenMode === true`
- [ ] **18.3.2** Create `src/components/focus/zen-mode-timer.tsx`
  - Presentational component (props-driven, no store access)
  - Props: `remainingSeconds`, `cardTitle`, `boardName`, `isRunning`, `isPaused`, `isComplete`
  - Large centered monospace countdown digits
  - Task title prominently displayed above timer
  - Subtle status indicator (pulsing dot for running, static for paused)
  - Pause/Resume, Stop, +15min control buttons below timer
- [ ] **18.3.3** Create `src/components/focus/zen-mode-journal.tsx`
  - Collapsible textarea anchored at the bottom of the overlay
  - Toggle open/closed via a small "Notes" button (default: closed for minimal distraction)
  - Textarea for writing; submit with button or `Cmd+Enter`
  - On submit: calls `createSessionLog(cardId, content)`, clears input
  - Shows recent entries from this session below the input (scrollable, max ~3 visible)
  - Props: `cardId: string`

### 18.4 — Entry Points

- [ ] **18.4.1** Add Zen mode button to timer badge popover in `src/components/focus/focus-timer-badge.tsx`
  - New icon button using `Maximize` from Lucide (or similar full-screen icon)
  - Placed alongside existing Pause/Extend/Stop controls
  - Tooltip: "Zen Mode (⌘⇧Z)"
  - Calls `toggleZenMode()`
- [ ] **18.4.2** Add `⌘⇧Z` keyboard shortcut in `src/lib/use-global-shortcuts.ts`
  - Calls `toggleZenMode()` from store
  - Only active when `activeSession` is not null
  - If no active session, shortcut is a no-op

### 18.5 — Mount Point

- [ ] **18.5.1** Render `<ZenModeOverlay />` in `src/components/layout/app-layout.tsx`
  - Conditionally rendered when `zenMode === true`
  - Placed after the layout content so it overlays everything
  - Import is lazy/dynamic to avoid loading Zen mode code until needed

### 18.6 — Session Logs on Card Detail

- [ ] **18.6.1** Extract subtasks section from `src/components/kanban/kanban-card-detail.tsx`
  - Move subtask list + add subtask form into `src/components/kanban/card-subtasks-section.tsx`
  - Keep the card detail file under 200 lines
- [ ] **18.6.2** Create `src/components/kanban/card-session-logs.tsx`
  - Collapsible section in card detail dialog
  - Header: "Session Notes" with entry count badge
  - Loads entries via `useLiveQuery` on `db.sessionLogs.where({ cardId })`
  - Each entry shows: relative timestamp ("2 hours ago") + content text
  - Delete button (small trash icon) on hover for each entry
  - Chronological order, newest first

### 18.7 — Polish & Edge Cases

- [ ] **18.7.1** Auto-exit Zen mode when session ends or card is deleted
- [ ] **18.7.2** Cascade-delete session logs when a card is deleted
  - Update `deleteCard()` in `db-helpers.ts` to also remove associated `sessionLogs`
- [ ] **18.7.3** Include `sessionLogs` in export/import
  - Update `src/lib/data-transfer.ts` to include `sessionLogs` table
  - Merge by `id` on import (skip duplicates)
- [ ] **18.7.4** Responsive design
  - Zen mode is inherently full-screen, works on all viewports
  - Journal textarea adapts width to viewport
  - Timer font scales appropriately on mobile

---

## Zen Mode UI Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                                                                 │
│                                                                 │
│                      Design review                              │
│                                                                 │
│                       47 : 23                                   │
│                        ● running                                │
│                                                                 │
│                    ⏸  ■  +15                                    │
│                                                                 │
│                                                                 │
│                                                          [ESC]  │
│─────────────────────────────────────────────────────────────────│
│  📝 Notes ▾                                                     │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Type a note...                                    [Submit] ││
│  └─────────────────────────────────────────────────────────────┘│
│  • 2 min ago — Decided to use flexbox for the card layout       │
│  • 15 min ago — Need to check the API response format           │
└─────────────────────────────────────────────────────────────────┘
```

**States:**
- Default: Notes section collapsed — just the timer and controls visible
- Notes open: Textarea + recent entries slide up from bottom
- Session complete: `SessionCompleteDialog` renders on top of the overlay

---

## Keyboard Shortcuts

| Shortcut | Context | Action |
|----------|---------|--------|
| `⌘⇧Z` | Global (session active) | Toggle Zen mode on/off |
| `Escape` | Zen mode | Exit Zen mode |
| `⌘Enter` | Zen mode journal textarea | Submit note |

---

## New Files

| File | Type | Purpose |
|------|------|---------|
| `src/components/focus/zen-mode-overlay.tsx` | Component | Container: dark overlay, timer + journal composition |
| `src/components/focus/zen-mode-timer.tsx` | Component | Presentational: large countdown + task title + controls |
| `src/components/focus/zen-mode-journal.tsx` | Component | Collapsible note-taking textarea + recent entries |
| `src/components/kanban/card-subtasks-section.tsx` | Component | Extracted subtasks section from card detail |
| `src/components/kanban/card-session-logs.tsx` | Component | Session notes list in card detail dialog |

## Modified Files

| File | Change |
|------|--------|
| `src/types/index.ts` | Add `SessionLog` interface |
| `src/lib/db.ts` | Add `sessionLogs` table (v6 migration) |
| `src/lib/db-helpers.ts` | Add session log CRUD + cascade delete |
| `src/stores/app-store.ts` | Add `zenMode` state + `toggleZenMode()` |
| `src/components/focus/focus-timer-badge.tsx` | Add Zen mode button to popover |
| `src/lib/use-global-shortcuts.ts` | Add `⌘⇧Z` shortcut |
| `src/components/layout/app-layout.tsx` | Mount `<ZenModeOverlay />` |
| `src/components/kanban/kanban-card-detail.tsx` | Extract subtasks, add session logs section |
| `src/lib/data-transfer.ts` | Include `sessionLogs` in export/import |

---

## Verification Checklist

- [ ] Start a focus session → press `⌘⇧Z` → full-screen dark overlay with large timer and task title
- [ ] Pause/Resume/Stop controls work within Zen mode
- [ ] Click "Notes" → textarea expands at bottom of overlay
- [ ] Type a note and submit (`⌘Enter` or button) → entry persists in IndexedDB
- [ ] Recent entries appear below the textarea with relative timestamps
- [ ] Press `Escape` → overlay closes, timer continues in background
- [ ] Timer reaching 0 in Zen mode → `SessionCompleteDialog` appears on top
- [ ] Session ending → auto-exits Zen mode
- [ ] Open card detail dialog → "Session Notes" section shows all saved entries
- [ ] Delete a session log entry from card detail → removed from DB
- [ ] Delete a card → associated session logs cascade-deleted
- [ ] Export includes `sessionLogs` table data
- [ ] Import merges session logs correctly (skips duplicates)
- [ ] `⌘⇧Z` with no active session → no-op
- [ ] Zen mode button visible in timer badge popover
- [ ] All new components are under 200 lines

---

## Future Enhancements (Out of Scope)

- Rich text / markdown in session notes
- Search across all session logs
- Session log analytics (words per session, note frequency)
- Auto-generated session summary using timestamps
- Voice-to-text note capture
- Ambient sounds / music in Zen mode
