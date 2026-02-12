# Title
Centralize Focus indicator in top-right header with inline controls

## Summary
Today the Focus indicator in the global top bar is clickable, but its primary controls (pause/resume, zen mode, stop) are hidden behind a popover. Idea 10 proposes improving visibility and discoverability by (a) "centering" the Focus indicator instead of placing at the top-right header cluster beside the theme switcher and (b) exposing the key actions as always-visible buttons immediately to the right of the indicator.

This is a UI/layout change only. No data model, persistence, or timer semantics changes are required.

## Goals
- Make the Focus indicator more visually central/noticeable in the header.
- Make **Pause/Resume**, **Zen**, and **Stop** accessible without clicking the indicator.
- Keep the existing design system (buttons/tooltips/tokens) and avoid new theme primitives.
- Preserve existing Focus availability rules (Focus entry point only shown on Kanban pages when no active session).

## Non-goals / Out of Scope
- No changes to focus timer logic, persistence, or reminder behavior.
- No redesign of the Focus view itself.
- No new keyboard shortcuts.
- No changes to where the top bar appears.

## User Experience / Flows
### 1) No active session
- On Kanban pages: show the existing “Focus” entry button in the header cluster (same as current behavior).
- On non-Kanban pages: show nothing (same as current behavior).

### 2) Active session
- In the global top bar (top-center), show:
  - Focus indicator (session title + remaining time)
  - Inline actions to the right: Pause/Resume (stateful), Zen, Stop
- The actions are always visible; no popover is required to access them.

### 3) Click behavior of the indicator
- Indicator should no longer be clickable since the controls are how displayed beside it

## Data Model
- No schema changes.
- No new persisted fields.
- Reuse existing `activeSession` and existing store actions: `pauseSession`, `resumeSession`, `toggleZenMode`, `endSession`.

## Technical Approach
- Update the top bar in `src/components/layout/app-layout.tsx` to:
  - Reorder elements in the center so the Focus indicator is visually central.
  - Render inline action buttons adjacent to the indicator.
- Refactor focus badge controls:
  - Reuse existing `TimerBadgeControls` logic and handlers, but provide an inline layout variant (non-absolute, no popover container).
  - Prefer splitting into small components to keep each file <200 LOC (e.g., `FocusHeaderControls`, `FocusIndicatorPill`, `FocusHeaderCluster`).
- Tooltips:
  - Keep the existing tooltips and shortcut hints where applicable.
  - Ensure tooltips do not overlap or trap pointer events in the header.

## Impacted Areas
### UI / components
- `src/components/layout/app-layout.tsx` (header cluster ordering + inline controls placement)
- `src/components/focus/focus-timer-badge.tsx` (indicator click behavior and/or extracted “pill”)
- `src/components/focus/timer-badge-controls.tsx` (inline variant or new sibling component)

### State / store
- None (reuse existing actions in `src/stores/app-store.ts`).

### Data layer / DB
- None.

### Types
- None.

### Import/export
- None.

### Tests / docs
- Optional: add/adjust a small UI test if there is an existing pattern; otherwise rely on manual verification.

## Edge Cases & Risks
- Small screen width: the indicator currently truncates title; adding inline buttons may overflow. Need a clear truncation/stacking rule (e.g., hide label on small breakpoints or collapse some buttons).
- Session complete state: current badge changes color and suppresses pause/resume in popover. Inline controls should preserve the same conditional logic.
- Zen mode availability: currently `toggleZenMode` is a no-op without an active session; ensure buttons render only when session exists.
- Accidental stop clicks: keep stop as destructive styling and keep it farthest right to reduce misclick risk.

## Verification Checklist
- With an active session, top bar shows Theme toggle + Focus indicator + inline buttons (Pause/Resume, Zen, Stop).
- Pause/Resume toggles correctly based on running state.
- Zen mode toggles correctly.
- Stop ends session and hides controls.
- With no session:
  - On Kanban pages: “Focus” button still appears.
  - On non-Kanban pages: Focus entry point remains hidden.
- Responsive: no layout break at common widths; title truncation still works.

## Feasibility Assessment
- Feasible with localized UI changes; no migrations.
- Main complexity is responsive header layout and keeping file sizes below 200 LOC.

## Size
Small

## Open Questions / Assumptions
None
