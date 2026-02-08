# Phase 17 — Focus Mode & Pomodoro Timer

> **Goal**: A productivity system that extracts tasks from all kanban boards, enables day/week planning with hourly time blocks, and provides a persistent timer so you **always know what you're focussing on for the next hour**.

---

## Core Concepts

| Concept | Description |
|---------|-------------|
| **Time Block** | A scheduled slot assigning a kanban card to a specific hour on a specific day |
| **Focus Session** | The active countdown timer for the current time block |
| **Eligible Cards** | All kanban cards NOT in a "done" column (smart default + user override) |
| **Done Column** | Default: rightmost column per board. Override: user can mark any column as "done" |

---

## Data Model Extensions

### `pages` table — New Field

| Field          | Type             | Notes                                        |
|----------------|------------------|----------------------------------------------|
| `doneColumnId` | `string \| null` | Override: which column is "done" for this board. `null` = use rightmost (default) |

### New `timeBlocks` table

| Field       | Type            | Indexed | Notes                              |
|-------------|-----------------|---------|------------------------------------|
| `id`        | `string` (UUID) | PK      |                                    |
| `cardId`    | `string`        | Yes     | FK → kanbanCard                    |
| `pageId`    | `string`        | Yes     | FK → kanban page (for card context)|
| `date`      | `string`        | Yes     | ISO date `YYYY-MM-DD`              |
| `startHour` | `number`        |         | 0-23 (e.g., 14 = 2pm)              |
| `durationMinutes` | `number`  |         | Default: 60                        |
| `status`    | `string`        |         | `scheduled` \| `completed` \| `skipped` |
| `createdAt` | `Date`          |         |                                    |
| `updatedAt` | `Date`          |         |                                    |

### New `focusSettings` table (singleton)

| Field             | Type      | Notes                           |
|-------------------|-----------|---------------------------------|
| `id`              | `string`  | Always `"settings"`             |
| `workMinutes`     | `number`  | Default: 60                     |
| `breakMinutes`    | `number`  | Default: 10                     |
| `audioEnabled`    | `boolean` | Default: true                   |
| `dayStartHour`    | `number`  | Default: 8 (8am)                |
| `dayEndHour`      | `number`  | Default: 18 (6pm)               |

### Zustand Store — New UI State

| Field           | Type                                                                 | Notes                        |
|-----------------|----------------------------------------------------------------------|------------------------------|
| `activeSession` | `{ cardId, cardTitle, boardName, remainingSeconds, isRunning } \| null` | Current focus session     |
| `focusSettings` | `{ workMinutes, breakMinutes, audioEnabled }`                        | Cached from Dexie            |

---

## Tasks

### 17.1 — Data Layer Foundation

- [x] **17.1.1** Extend `Page` interface in `src/types/index.ts`
  - Add `doneColumnId?: string | null` field
- [x] **17.1.2** Add new types in `src/types/index.ts`
  - `TimeBlock` interface with fields above
  - `FocusSettings` interface with fields above
  - `FocusSession` type for Zustand active session
- [x] **17.1.3** Update Dexie schema in `src/lib/db.ts`
  - Increment schema version
  - Add `timeBlocks` table with indexes on `cardId`, `pageId`, `date`
  - Add `focusSettings` table
  - Migration: set `doneColumnId: null` for existing pages
- [x] **17.1.4** Create `src/lib/focus-helpers.ts`
  - `getDoneColumnId(page)` — returns `doneColumnId` or rightmost column id
  - `isCardDone(card, page)` — checks if card is in done column
  - `getAllEligibleCards()` — fetches all non-done cards with board/column context
  - `getTimeBlocksForDate(date: string)` — query by ISO date
  - `getTimeBlocksForWeek(weekStartDate: string)` — query 7 days
  - `createTimeBlock(cardId, pageId, date, startHour, durationMinutes)`
  - `updateTimeBlock(id, updates)`
  - `deleteTimeBlock(id)`
  - `getFocusSettings()` — returns settings or defaults
  - `updateFocusSettings(updates)`

### 17.2 — Timer State & Logic

- [x] **17.2.1** Extend Zustand store in `src/stores/app-store.ts`
  - Add `activeSession` state
  - Add `focusSettings` cached state
  - Actions: `startSession(cardId, cardTitle, boardName, durationSeconds)`
  - Actions: `pauseSession()`, `resumeSession()`, `tickSession()`, `endSession()`
  - Actions: `loadFocusSettings()`, `setFocusSettings(settings)`
- [x] **17.2.2** Create `src/lib/use-focus-timer.ts` hook
  - `useFocusTimer()` — manages interval, calls `tickSession()` every second
  - Triggers audio notification when `remainingSeconds` hits 0
  - Returns `{ timeRemaining, isRunning, isPaused, start, pause, resume, stop }`
- [x] **17.2.3** Add audio notification
  - Embed short chime sound (base64 or small mp3 in `/public`)
  - Play via Web Audio API when session completes
  - Respect `audioEnabled` setting

### 17.3 — Done Column Override

- [x] **17.3.1** Add "Mark as done column" UI in kanban column header
  - Checkbox or toggle in column dropdown menu
  - Updates `page.doneColumnId` in Dexie
  - Visual indicator on column header when marked as done
- [x] **17.3.2** Update card filtering to use `getDoneColumnId()` helper

### 17.4 — UI Components

- [x] **17.4.1** Create `src/components/focus/focus-timer-badge.tsx`
  - Compact top bar component showing: card title (truncated) + MM:SS countdown
  - Pulsing/glowing indicator when running
  - Click to expand quick controls popover: Pause, Resume, Stop, +15min
  - When no session: shows "Focus" button linking to Focus view
- [x] **17.4.2** Create `src/components/focus/task-picker-dialog.tsx`
  - Modal listing all eligible cards grouped by Board → Column
  - Each card shows: title, column badge (e.g., "To Do", "In Progress")
  - Search/filter input at top
  - "Start Now" button → immediately starts timer
  - "Schedule" button → opens time slot picker
- [x] **17.4.3** Create `src/components/focus/day-calendar.tsx`
  - Vertical timeline with hourly slots (configurable `dayStartHour` to `dayEndHour`)
  - Current hour prominently highlighted (different background color)
  - Time blocks rendered as cards spanning their duration
  - Empty slots are droppable targets
  - Click empty slot → opens task picker for that hour
  - Drag existing block to move it
- [x] **17.4.4** Create `src/components/focus/week-calendar.tsx`
  - 7-column grid (Mon-Sun or Sun-Sat based on locale)
  - Day headers with date
  - Condensed hourly view showing scheduled blocks
  - Click day header → switches to day view for that day
- [x] **17.4.5** Create `src/components/focus/focus-view.tsx`
  - Page container with Day/Week toggle
  - Header: "Today's Focus" summary (X tasks scheduled, Y hours planned)
  - Main area: DayCalendar or WeekCalendar based on toggle
  - Right sidebar panel: "Unscheduled" eligible cards for quick drag-in
- [x] **17.4.6** Create `src/components/focus/session-complete-dialog.tsx`
  - Appears when timer hits 0
  - Shows: "✓ Completed: [Card Title]"
  - Options:
    - "Move to..." dropdown with board's columns (smart default to next column)
    - "Extend" button → +30min or +1hr quick options
    - "Done for now" → just close, no card movement
  - Subtle celebration animation (confetti or checkmark)
- [x] **17.4.7** Create `src/components/focus/focus-settings-dialog.tsx`
  - Work session duration slider/input (15-120 min)
  - Break duration slider/input (5-30 min)
  - Audio toggle
  - Working hours range (start/end hour)

### 17.5 — Navigation & Integration

- [x] **17.5.1** Add `/focus` route in `src/App.tsx`
  - Route to `FocusView` component
- [x] **17.5.2** Update `src/components/layout/sidebar.tsx`
  - Add "Focus" section above or below page tree
  - Icon: Clock or Target
  - Shows mini-summary: "3 tasks today" or current session info
  - Click navigates to `/focus`
- [x] **17.5.3** Update `src/components/layout/app-layout.tsx`
  - Add `<FocusTimerBadge />` in top bar (next to ThemeToggle)
- [x] **17.5.4** Add keyboard shortcuts in `src/lib/use-global-shortcuts.ts`
  - `Cmd/Ctrl + Shift + F` — Navigate to Focus view
  - `Space` (when timer active and not in editor) — Pause/resume

### 17.6 — Polish & Edge Cases

- [x] **17.6.1** Timer persistence across navigation
  - Session state in Zustand persists while navigating pages
  - Timer continues running in background
- [x] **17.6.2** Handle deleted cards gracefully
  - If scheduled card is deleted, remove its time blocks
  - If active session's card is deleted, end session gracefully
- [x] **17.6.3** Responsive design
  - Mobile-friendly timer badge (icon only on small screens)
  - Calendar adapts to viewport (day view default on mobile)
- [x] **17.6.4** Export/Import integration
  - Include `timeBlocks` and `focusSettings` in export
  - Merge time blocks by date + cardId

---

## Done Column Detection

| Priority | Method | Description |
|----------|--------|-------------|
| 1 | User override | `page.doneColumnId` explicitly set |
| 2 | Smart default | Rightmost column (highest `order` value) |

**UI for override:**
- Column header dropdown menu → "Mark as done column" toggle
- Visual indicator (checkmark icon) on done column header

---

## UI Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Sidebar        │  [≡] Breadcrumbs          [Timer Badge] [◐]  │
│                 │                                               │
│  ○ Focus        │  ┌─────────────────────────────────────────┐  │
│    3 tasks      │  │  Today's Focus          [Day] [Week]   │  │
│                 │  │  ─────────────────────────────────────  │  │
│  Pages          │  │                                         │  │
│  ├─ Page 1      │  │  8am  ┌──────────────────┐             │  │
│  ├─ Board A     │  │  9am  │  Design review   │  Unscheduled│  │
│  └─ Board B     │  │  10am └──────────────────┘  ──────────  │  │
│                 │  │  11am ████████████████████  □ Task 4    │  │
│                 │  │  12pm  (current hour)       □ Task 5    │  │
│                 │  │  1pm                        □ Task 6    │  │
│                 │  └─────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Timer Badge States:**
- No session: `[◎ Focus]` — click opens Focus view
- Running: `[● Design review 47:23]` — pulsing dot, click for controls
- Paused: `[⏸ Design review 47:23]` — static, click to resume

---

## Verification Checklist

- [x] Create kanban board with custom column names → rightmost column is auto-detected as "done"
- [x] Mark different column as "done" via column menu → cards in that column excluded from Focus
- [x] Open Focus view → all non-done cards appear grouped by board
- [x] Drag card to hour slot → time block created, appears in calendar
- [x] Click "Start" on time block → timer appears in top bar, counts down
- [x] Timer reaches 0 → audio plays, completion dialog appears
- [x] Move card via completion dialog → card moves in original kanban board
- [x] Extend session → timer adds time, dialog closes
- [x] Navigate away during active session → timer continues in top bar
- [x] Delete scheduled card → time block removed automatically
- [x] Toggle Day/Week view → calendar switches correctly
- [x] Week view: click day → switches to day view for that date
- [x] Focus settings: change work duration → new sessions use updated duration
- [x] Disable audio in settings → no sound on session complete
- [x] `Cmd+Shift+F` → navigates to Focus view
- [x] Export includes time blocks and settings
- [x] Import merges time blocks correctly

---

## Future Enhancements (Out of Scope)

- Focus history/analytics dashboard
- Recurring scheduled tasks
- Break timer between sessions
- Integration with system notifications
- Sync across devices
