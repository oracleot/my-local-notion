import { db } from "@/lib/db";
import type { Page, KanbanCard, Deletion, DeletableEntityType, TimeBlock, FocusSettings } from "@/types";

// ─── Export File Format ──────────────────────────────────────────────────────

interface ExportData {
  version: 1;
  exportedAt: string;
  pages: Page[];
  kanbanCards: KanbanCard[];
  deletions: Deletion[];
  timeBlocks?: TimeBlock[];
  focusSettings?: FocusSettings | null;
}

export interface ImportResult {
  pagesAdded: number;
  pagesUpdated: number;
  cardsAdded: number;
  cardsUpdated: number;
  deletionsApplied: number;
}

// ─── Export ──────────────────────────────────────────────────────────────────

export async function exportWorkspace(): Promise<Blob> {
  const [pages, kanbanCards, deletions, timeBlocks, focusSettingsRow] = await Promise.all([
    db.pages.toArray(),
    db.kanbanCards.toArray(),
    db.deletions.toArray(),
    db.timeBlocks.toArray(),
    db.focusSettings.get("settings"),
  ]);

  const data: ExportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    pages,
    kanbanCards,
    deletions,
    timeBlocks,
    focusSettings: focusSettingsRow ?? null,
  };

  return new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
}

export function downloadExport(blob: Blob): void {
  const date = new Date().toISOString().split("T")[0];
  const filename = `my-notebook-${date}.json`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Import & Merge ──────────────────────────────────────────────────────────

export async function importWorkspace(file: File): Promise<ImportResult> {
  const text = await file.text();
  const data = JSON.parse(text) as ExportData;

  if (data.version !== 1) {
    throw new Error(`Unsupported export version: ${data.version}`);
  }

  const result: ImportResult = {
    pagesAdded: 0,
    pagesUpdated: 0,
    cardsAdded: 0,
    cardsUpdated: 0,
    deletionsApplied: 0,
  };

  await db.transaction("rw", [db.pages, db.kanbanCards, db.deletions, db.timeBlocks, db.focusSettings], async () => {
    // Build local deletion lookup: entityType+entityId → deletedAt
    const localDeletions = await db.deletions.toArray();
    const localDeletionMap = new Map<string, Date>();
    for (const d of localDeletions) {
      localDeletionMap.set(`${d.entityType}:${d.entityId}`, new Date(d.deletedAt));
    }

    // Build import deletion lookup
    const importDeletionMap = new Map<string, Date>();
    for (const d of data.deletions) {
      importDeletionMap.set(`${d.entityType}:${d.entityId}`, new Date(d.deletedAt));
    }

    // ─── Merge Pages ───────────────────────────────────────────────────────
    for (const importPage of data.pages) {
      const pageUpdatedAt = new Date(importPage.updatedAt);
      const key = `page:${importPage.id}`;
      const localDeletedAt = localDeletionMap.get(key);

      // Skip if locally deleted after the import page's update
      if (localDeletedAt && localDeletedAt > pageUpdatedAt) {
        continue;
      }

      const localPage = await db.pages.get(importPage.id);

      if (!localPage) {
        // Insert new page
        await db.pages.add({
          ...importPage,
          createdAt: new Date(importPage.createdAt),
          updatedAt: pageUpdatedAt,
        });
        result.pagesAdded++;
      } else {
        // Compare timestamps - keep newer
        const localUpdatedAt = new Date(localPage.updatedAt);
        if (pageUpdatedAt > localUpdatedAt) {
          await db.pages.put({
            ...importPage,
            createdAt: new Date(importPage.createdAt),
            updatedAt: pageUpdatedAt,
          });
          result.pagesUpdated++;
        }
      }
    }

    // ─── Merge Kanban Cards ────────────────────────────────────────────────
    for (const importCard of data.kanbanCards) {
      const cardUpdatedAt = new Date(importCard.updatedAt);
      const key = `kanbanCard:${importCard.id}`;
      const localDeletedAt = localDeletionMap.get(key);

      // Skip if locally deleted after the import card's update
      if (localDeletedAt && localDeletedAt > cardUpdatedAt) {
        continue;
      }

      const localCard = await db.kanbanCards.get(importCard.id);

      if (!localCard) {
        // Insert new card
        await db.kanbanCards.add({
          ...importCard,
          createdAt: new Date(importCard.createdAt),
          updatedAt: cardUpdatedAt,
        });
        result.cardsAdded++;
      } else {
        // Compare timestamps - keep newer
        const localUpdatedAt = new Date(localCard.updatedAt);
        if (cardUpdatedAt > localUpdatedAt) {
          await db.kanbanCards.put({
            ...importCard,
            createdAt: new Date(importCard.createdAt),
            updatedAt: cardUpdatedAt,
          });
          result.cardsUpdated++;
        }
      }
    }

    // ─── Process Import Deletions ──────────────────────────────────────────
    for (const importDeletion of data.deletions) {
      const deletedAt = new Date(importDeletion.deletedAt);

      // Check if we already have this deletion logged
      const existingDeletion = await db.deletions
        .where("[entityType+entityId]")
        .equals([importDeletion.entityType, importDeletion.entityId])
        .first();

      if (!existingDeletion) {
        // Log the deletion
        await db.deletions.add({
          ...importDeletion,
          deletedAt,
        });
      }

      // Apply deletion if entity exists and was updated before deletion
      if (importDeletion.entityType === "page") {
        const page = await db.pages.get(importDeletion.entityId);
        if (page) {
          const pageUpdatedAt = new Date(page.updatedAt);
          if (pageUpdatedAt < deletedAt) {
            // Also delete associated kanban cards
            const cards = await db.kanbanCards
              .where("pageId")
              .equals(importDeletion.entityId)
              .toArray();
            
            for (const card of cards) {
              await logDeletionIfNotExists("kanbanCard", card.id, deletedAt);
            }
            
            await db.kanbanCards.where("pageId").equals(importDeletion.entityId).delete();
            await db.pages.delete(importDeletion.entityId);
            result.deletionsApplied++;
          }
        }
      } else if (importDeletion.entityType === "kanbanCard") {
        const card = await db.kanbanCards.get(importDeletion.entityId);
        if (card) {
          const cardUpdatedAt = new Date(card.updatedAt);
          if (cardUpdatedAt < deletedAt) {
            // Also delete subtasks
            const subtasks = await db.kanbanCards
              .where("parentId")
              .equals(importDeletion.entityId)
              .toArray();
            
            for (const subtask of subtasks) {
              await logDeletionIfNotExists("kanbanCard", subtask.id, deletedAt);
              await db.kanbanCards.delete(subtask.id);
            }
            
            await db.kanbanCards.delete(importDeletion.entityId);
            result.deletionsApplied++;
          }
        }
      }
    }

    // ─── Merge Time Blocks ─────────────────────────────────────────────────
    if (data.timeBlocks) {
      for (const importBlock of data.timeBlocks) {
        const existing = await db.timeBlocks.get(importBlock.id);
        if (!existing) {
          await db.timeBlocks.add({
            ...importBlock,
            createdAt: new Date(importBlock.createdAt),
            updatedAt: new Date(importBlock.updatedAt),
          });
        } else {
          const importUpdatedAt = new Date(importBlock.updatedAt);
          const localUpdatedAt = new Date(existing.updatedAt);
          if (importUpdatedAt > localUpdatedAt) {
            await db.timeBlocks.put({
              ...importBlock,
              createdAt: new Date(importBlock.createdAt),
              updatedAt: importUpdatedAt,
            });
          }
        }
      }
    }

    // ─── Merge Focus Settings ──────────────────────────────────────────────
    if (data.focusSettings) {
      const existing = await db.focusSettings.get("settings");
      if (!existing) {
        await db.focusSettings.add(data.focusSettings);
      }
      // Don't overwrite existing settings — user preference
    }
  });

  return result;
}

// Helper to log deletion if not already logged
async function logDeletionIfNotExists(
  entityType: DeletableEntityType,
  entityId: string,
  deletedAt: Date
): Promise<void> {
  const existing = await db.deletions
    .where("[entityType+entityId]")
    .equals([entityType, entityId])
    .first();

  if (!existing) {
    await db.deletions.add({
      id: crypto.randomUUID(),
      entityType,
      entityId,
      deletedAt,
    });
  }
}
