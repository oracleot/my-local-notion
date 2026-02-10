# Spec: Prevent Deletion of Running Tasks in Focus Calendar

## Summary

Currently, users can delete time blocks from the focus calendar even when they are actively running (i.e., an active timer session is in progress for that specific time block). This creates a poor user experience and potential data inconsistencies.

This spec outlines a small UI fix to prevent deletion of time blocks that are currently running. The delete button will be hidden when a task has an active timer session associated with it.

## Goals

- Prevent users from deleting time blocks that are currently running
- Maintain existing deletion restrictions (past blocks, completed blocks)
- Provide clear visual feedback about which tasks can/cannot be deleted

## Non-goals / Out of Scope

- Changing how deletion works for non-running tasks
- Adding confirmation dialogs for deletion
- Bulk deletion features
- Undo/restore functionality for deleted time blocks
- Changes to how past or completed tasks are handled

## User Experience / Flows

### Current Behavior (Problematic)

1. User schedules a task in the focus calendar
2. User starts the timer for that task (Play button)
3. Timer is actively running
4. User can still see and click the delete (trash) button
5. Task is deleted while timer is running → breaks user flow

### Expected Behavior (Fixed)

1. User schedules a task in the focus calendar
2. User starts the timer for that task (Play button)
3. Timer is actively running
4. **Delete button is hidden** (same treatment as completed/past tasks)
5. User must stop/complete the timer before being able to delete the block

### Delete Button Visibility Rules

The delete button should be **hidden** when ANY of these conditions are true:

- The time block is in the past (`isPast === true`) ✅ Already implemented
- The time block status is "skipped" ✅ Already implemented
- The time block status is "completed" ✅ Already via isPast logic
- **[NEW]** The time block is currently running (activeSession exists with matching timeBlockId)

The delete button should be **visible** only when:

- Block is not in the past
- Block status is "scheduled"
- Block is NOT the currently running task

## Data Model

No database schema changes required.

**Relevant existing data structures:**

- `TimeBlock` — Contains `id`, `cardId`, `status`, `date`, `startHour`, etc.
- `FocusSession` (from app-store) — Contains `cardId`, `timeBlockId`, `isRunning`, etc.

The `timeBlockId` field in `FocusSession` is nullable but will be set when a session is started from a scheduled time block.

## Technical Approach

### Impacted Component: `TimeBlockCard`

**File:** `src/components/focus/time-block-card.tsx`

**Current Implementation:**

```tsx
// Delete button visibility logic (lines ~95-111)
{!isPast && block.status !== "skipped" && (
  <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover/block:opacity-100">
    {block.status !== "completed" && !isActive && !activeSession && (
      <Button /* Play button */ />
    )}
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 text-destructive/60 hover:text-destructive"
      onClick={onDelete}
    >
      <Trash2 className="h-3 w-3" />
    </Button>
  </div>
)}
```

**Required Change:**

Add check to prevent delete button from rendering when the time block is currently running.

```tsx
// Determine if THIS specific block is running
const isThisBlockRunning = activeSession?.timeBlockId === block.id;

// Update visibility logic
{!isPast && block.status !== "skipped" && !isThisBlockRunning && (
  <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover/block:opacity-100">
    {/* ... existing buttons ... */}
  </div>
)}
```

### Implementation Steps

1. In `TimeBlockCard` component, derive `isThisBlockRunning` flag:
   ```tsx
   const isThisBlockRunning = activeSession?.timeBlockId === block.id;
   ```

2. Update the wrapper div condition to include the new check:
   ```tsx
   {!isPast && block.status !== "skipped" && !isThisBlockRunning && (
     // ... delete button UI ...
   )}
   ```

3. No prop changes required — component already has access to `activeSession` via `useAppStore`

## Impacted Areas

### UI/Components
- **Primary:** `src/components/focus/time-block-card.tsx` — Add running task check to delete button visibility logic

### State/Store
- **No changes** — Already reading `activeSession` from store

### Data Layer/DB
- **No changes**

### Types
- **No changes** — All necessary types already exist

### Import/Export
- **Not applicable**

### Tests/Docs
- **Optional:** Add test case for delete button visibility when task is running
- **Optional:** Update USER_GUIDE.md if it mentions task deletion

## Edge Cases & Risks

### Edge Case 1: Session Without TimeBlockId
**Scenario:** User starts a timer directly from the unscheduled sidebar (not from a time block)  
**Current State:** `activeSession.timeBlockId` will be `null`  
**Behavior:** Check `activeSession?.timeBlockId === block.id` will be `false`, delete button remains available  
**Risk Level:** None — correct behavior, only scheduled blocks should be protected

### Edge Case 2: Timer Paused
**Scenario:** User pauses an active timer  
**Current State:** `activeSession` still exists, `isRunning: false`, `timeBlockId` still set  
**Behavior:** Delete button will still be hidden (session exists even when paused)  
**Question:** Should paused sessions allow deletion?  
**Decision:** **No** — keep it simple. If there's any active session, protect the block. User must stop the session first.

### Edge Case 3: Multiple Blocks for Same Card
**Scenario:** User schedules the same card twice in different time slots  
**Current State:** Only one can have an active session at a time  
**Behavior:** Only the specific block with matching `timeBlockId` will be protected  
**Risk Level:** None — correct behavior

### Edge Case 4: Timer Completes
**Scenario:** Timer reaches zero, session complete dialog appears  
**Current State:** `activeSession` still exists until user dismisses dialog  
**Behavior:** Delete button remains hidden until session is fully ended  
**Risk Level:** Low — acceptable UX, user should complete the session workflow

### Risk Assessment

**Technical Risks:** None — simple boolean logic, no async operations, no DB changes

**UX Risks:** Very low
- Users might be confused why delete button disappears temporarily
- Mitigation: This is consistent with existing patterns (past blocks, completed blocks)

**Performance:** No impact — simple equality check

**Breaking Changes:** None — purely additive guard logic

## Verification Checklist

### Manual Testing

- [ ] Schedule a task in focus calendar for current hour
- [ ] Verify delete button is visible when task is not running
- [ ] Start the timer for that task
- [ ] **Verify delete button is no longer visible**
- [ ] Pause the timer
- [ ] **Verify delete button is still hidden**
- [ ] Stop/complete the session
- [ ] Verify delete button becomes visible again
- [ ] Start a timer from unscheduled sidebar
- [ ] Verify other scheduled blocks' delete buttons remain visible
- [ ] Verify past blocks still have no delete button
- [ ] Verify completed/skipped blocks still have no delete button

### Code Quality

- [ ] Component doesn't exceed 200 lines (currently ~127 lines)
- [ ] No new dependencies introduced
- [ ] Follows existing code patterns
- [ ] No console errors or warnings
- [ ] Build passes (`pnpm build`)
- [ ] Linting passes (`pnpm lint`)

## Feasibility Assessment

**Complexity:** Very Low  
**Effort:** ~15-20 minutes  
**Dependencies:** None  
**Blockers:** None

This is a straightforward UI guard that leverages existing state. The `TimeBlockCard` component already accesses `activeSession` from the store, so we only need to add one conditional check.

**Size: Small**

### Why Small?

- **UI-only change** — Single component file modification
- **No DB schema changes** — Uses existing data structures
- **No new state management** — Reads existing store values
- **Minimal blast radius** — Only affects delete button visibility in one component
- **No migration required**
- **No cross-feature coupling**
- **Estimated: 1 primary file changed, ~5 lines added**

## Open Questions / Assumptions

### Assumptions

1. **Paused sessions should also block deletion**  
   Reasoning: Simplifies logic and prevents accidental deletion of partially-completed work

2. **No confirmation dialog needed**  
   Reasoning: Prevention is better than confirmation. Once timer stops, standard delete flow resumes

3. **No special visual indicator needed**  
   Reasoning: Hiding the button is sufficient and consistent with existing patterns

### Optional Enhancements (Not in Scope)

1. **Tooltip explanation:** Show tooltip on hover explaining why button is hidden
   - "Cannot delete while timer is running"
   - Size impact: Still Small, but unnecessary for MVP

2. **Visual indicator on running block:** Add a subtle pulse or border to running blocks
   - Size impact: Still Small, but not required for this bug fix

3. **Keyboard shortcut guard:** Prevent deletion via keyboard shortcut (if it exists)
   - Size impact: Would need to investigate keyboard handling
   - Currently not a concern — delete is only via UI button
