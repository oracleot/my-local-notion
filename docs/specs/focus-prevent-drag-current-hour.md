# Spec: Restrict Dragging in Active Focus Hour

## Summary
This feature restricts the ability to reorder (drag and drop) tasks within the current "active" hour block in the Focus Mode calendar. Once the current time reaches a specific hour (e.g., 10:00 AM), the tasks scheduled for that hour become "locked" in their order and cannot be rearranged. This encourages stricter schedule adherence.

## Goals
- Prevent users from dragging/reordering tasks within the hour block that corresponds to the current wall-clock time.
- Maintain existing drag-and-drop functionality for future hour blocks.
- Maintain existing "locked" state for past hour blocks.
- Update the UI to reflect this locked state (hide drag handles).

## Non-Goals
- Changing the behavior of "Past" blocks (they remain locked).
- Changing the behavior of "Future" blocks (they remain reorderable).
- Preventing the *addition* of new tasks to the current hour (if capacity allows). This spec only concerns *reordering* existing tasks.

## User Experience
- **Scenario A (Future Hour)**: User looks at 2:00 PM block (it is currently 10:00 AM). They can drag Task A before Task B. The UI shows drag handles.
- **Scenario B (Current Hour)**: It is 10:15 AM. User looks at the 10:00 AM block. The tasks are fixed in place. Drag handles are hidden or disabled. User cannot drag them.
- **Scenario C (Past Hour)**: It is 12:00 PM. User looks at 9:00 AM block. Tasks are fixed.

## Technical Approach
1.  **Identify Active Hour**: The `DayCalendar` component already calculates and passes `currentHour`.
2.  **Pass Lock State**: Update `HourSlot` logic to determine if dragging should be disabled.
    - Currently `HourSlot` receives `isCurrent`.
    - Determine if we should disable dragging based on `isCurrent`.
    - Pass `isDraggable={!isPast && !isCurrent}` (or similar) to `TimeBlockCard`.
3.  **Disable Sortable**: In `TimeBlockCard`, update the `useSortable` hook configuration.
    - Change `disabled: isPast` to `disabled: isPast || isCurrent`. (Or utilize the prop logic passed down).
4.  **UI Update**: Conditionally hide or disable the drag handle icon (`GripVertical`) in `TimeBlockCard` when dragging is disabled.

## Impacted Areas
- **UI/Components**:
    - `src/components/focus/day-calendar.tsx`: Ensure `isCurrent` propagates correctly.
    - `src/components/focus/hour-slot.tsx`: Pass lock props to children.
    - `src/components/focus/time-block-card.tsx`:
        - Update `useSortable` disabled state.
        - Hide drag handle trigger.

## Edge Cases & Risks
- **Edge Case**: User wants to move a task *out* of the current hour.
    - The requirement implies locking the hour block ("dragging of tasks within the hour block should only for non-active hour block"). This typically locks interactions with items in that container.
    - **Resolution**: Strict lock. If they need to move it, they must delete and re-add or we could implement a separate "Reschedule" action later, but for now blocking drag is the goal.

## Feasibility Assessment
- **Size**: Small
- **Complexity**: Low.
- **Dependencies**: React DnD Kit.

## Verification Checklist
- [ ] Verify tasks in future hours are draggable.
- [ ] Verify tasks in current hour (matching system time) are NOT draggable.
- [ ] Verify tasks in past hours are NOT draggable.
- [ ] Check visual regression (drag handles disappearing).
