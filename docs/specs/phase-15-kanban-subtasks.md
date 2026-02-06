# Phase 15 — Kanban Subtasks (Card-in-Card)

> **Goal**: Allow cards to contain subtasks (child cards) that can move independently across columns while maintaining a parent link. Subtasks appear in their actual column with a visual indicator of their parent.

- [x] **15.1** Extend `KanbanCard` interface in `src/types/index.ts`
  - Add `parentId: string | null` field
  - Top-level cards: `parentId = null`
  - Subtasks: `parentId = <parent card id>`
- [x] **15.2** Update Dexie schema in `src/lib/db.ts`
  - Increment schema version
  - Add `parentId` index to `kanbanCards` table
  - Add migration: set `parentId: null` for existing cards
- [x] **15.3** Add subtask helpers in `src/lib/db-helpers.ts`
  - `createSubtask(parentCardId, columnId, title)` — creates subtask in specified column (can differ from parent)
  - `getSubtasks(parentCardId)` — returns subtasks across all columns
  - `getParentCard(cardId)` — fetch parent info for badge display
  - Modify `deleteCard(id)` — cascade-delete all subtasks when deleting parent
- [x] **15.4** Update `KanbanCard` component in `src/components/kanban/kanban-card.tsx`
  - **For parent cards**: Show subtask summary badge (e.g., "2/3 done")
  - **For subtask cards**: Show parent link indicator (small icon + truncated parent title on hover)
  - Use conditional rendering based on `parentId` presence
- [x] **15.5** Update `KanbanColumn` rendering in `src/components/kanban/kanban-column.tsx`
  - Show ALL cards in column (parents + subtasks)
  - No filtering by `parentId` — subtasks appear where they belong
- [x] **15.6** Enhance `KanbanCardDetail` in `src/components/kanban/kanban-card-detail.tsx`
  - **For parent cards**: Section listing subtasks with column status, click to open subtask, "Add subtask" button
  - **For subtask cards**: Show "Parent: [Card Title]" link at top, click navigates to parent detail
  - Subtask list shows which column each subtask is in
- [x] **15.7** Add subtask creation UX
  - In card detail: "Add subtask" opens quick-create inline input
  - New subtask defaults to same column as parent (user can move later via drag or detail modal)
- [x] **15.8** Add promotion/demotion actions (optional enhancement)
  - Allow converting a regular card to a subtask (assign parent)
  - Allow promoting subtask to standalone card (clear parent)

## Subtasks Data Model Extension

| Field      | Type            | Notes                                   |
| ---------- | --------------- | --------------------------------------- |
| `parentId` | `string \| null`| `null` = top-level card, else = subtask |

## Subtasks Behavior Rules

- **Independent movement**: Subtasks can move to any column independent of their parent (e.g., parent in "To Do", subtask in "Done")
- **Visual linkage**: Subtask cards display a small parent indicator badge
- **Progress tracking**: Parent cards show subtask completion summary (e.g., "2/3 done" based on subtasks in final column)
- **Cascade delete**: Deleting a parent card deletes all its subtasks
- **One level only**: Subtasks cannot have their own subtasks (enforced in `createSubtask`)
