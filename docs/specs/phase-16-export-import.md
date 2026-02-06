# Phase 16 — Export/Import with Timestamp Merge

> **Goal**: Enable ongoing device sync via a single JSON file. Users export their workspace, save it to any cloud-synced folder (iCloud Drive, Dropbox, Google Drive, OneDrive), and import on another device. Import **merges** by comparing `updatedAt` timestamps — newer records win, nothing is lost from either side. No backend, no API keys, no accounts.

## Architecture Decisions

- **Merge over replace**: Since the use case is ongoing sync between devices, merge with `updatedAt` comparison is essential to avoid data loss
- **Deletion log**: Required for correct merge semantics — without it, deleted items would reappear on import from an older export
- **Single file**: Dataset is small (1–5 MB typical), so one `.json` file is simpler than a folder structure
- **No File System Access API**: Would enable auto-save to a remembered file path, but is Chromium-only; manual export/import works everywhere. Can be added later as an enhancement
- **"Edit wins over delete" conflict resolution**: When a record was edited on one device and deleted on another, the edit is preserved — safer default to avoid accidental data loss

## Data Model Extension

### `deletions` table (new)

| Field        | Type                            | Indexed          | Notes                              |
| ------------ | ------------------------------- | ---------------- | ---------------------------------- |
| `id`         | `string` (UUID)                 | PK               |                                    |
| `entityType` | `"page" \| "kanbanCard"`        | `[entityType+entityId]` | Compound index             |
| `entityId`   | `string`                        | `[entityType+entityId]` | ID of deleted entity       |
| `deletedAt`  | `Date`                          |                  | When the deletion occurred         |

### Export file format

```json
{
  "version": 1,
  "exportedAt": "2026-02-06T12:00:00.000Z",
  "pages": [ ... ],
  "kanbanCards": [ ... ],
  "deletions": [ ... ]
}
```

## Merge Algorithm

For each page/card in the import file:
1. If it **doesn't exist locally** → insert it (unless it appears in the local deletions log with `deletedAt` **after** the record's `updatedAt`)
2. If it **exists locally** → keep whichever has the later `updatedAt`

For each deletion in the import file:
1. If the entity **exists locally** and its `updatedAt` < `deletedAt` → delete it locally and log the deletion
2. If the entity was **updated locally after** the deletion → keep the local version (edit wins over delete)

Entire merge runs inside a Dexie transaction for atomicity.

## Tasks

- [ ] **16.1** Add `deletions` table to Dexie (`src/lib/db.ts`)
  - Schema: `++id, [entityType+entityId]`
  - Bump DB to version 3
  - Add `Deletion` interface to `src/types/index.ts`
- [ ] **16.2** Log deletions in `src/lib/db-helpers.ts`
  - In `deletePage`: write deletion records for the page, all descendant pages, and their kanban cards before removing entities
  - In `deleteCard`/`deleteSubtask`: write deletion record before removing the card (and subtasks if parent)
- [ ] **16.3** Create `src/lib/data-transfer.ts` (~150 lines)
  - `exportWorkspace(): Promise<Blob>` — reads all pages, kanban cards, and deletions; serializes to JSON with metadata envelope
  - `importWorkspace(file: File): Promise<ImportResult>` — parses JSON, runs merge algorithm, returns summary `{ pagesAdded, pagesUpdated, cardsAdded, cardsUpdated, deletionsApplied }`
  - Merge wrapped in Dexie transaction
- [ ] **16.4** Create `src/components/shared/data-transfer-dialog.tsx` (~120 lines)
  - **Export section**: "Export Workspace" button → triggers download of `my-notebook-YYYY-MM-DD.json`
  - **Import section**: file picker / drop zone, shows merge result summary after import completes
- [ ] **16.5** Add trigger to sidebar (`src/components/layout/sidebar.tsx`)
  - Add import/export menu item or settings gear icon near bottom of sidebar
  - Opens the data transfer dialog
- [ ] **16.6** Add keyboard shortcut (`src/lib/use-global-shortcuts.ts`)
  - `⌘+Shift+E` → quick export (direct download, no dialog)

