import Dexie, { type EntityTable } from "dexie";
import type { Page, KanbanCard, Deletion, TimeBlock, FocusSettings, SessionLog } from "@/types";

const db = new Dexie("NotionCloneDB") as Dexie & {
  pages: EntityTable<Page, "id">;
  kanbanCards: EntityTable<KanbanCard, "id">;
  deletions: EntityTable<Deletion, "id">;
  timeBlocks: EntityTable<TimeBlock, "id">;
  focusSettings: EntityTable<FocusSettings, "id">;
  sessionLogs: EntityTable<SessionLog, "id">;
};

db.version(1).stores({
  pages: "id, parentId, updatedAt",
  kanbanCards: "id, pageId, columnId",
});

// Add parentId index for subtasks support
db.version(2).stores({
  pages: "id, parentId, updatedAt",
  kanbanCards: "id, pageId, columnId, parentId",
}).upgrade(tx => {
  // Set parentId: null for all existing cards
  return tx.table("kanbanCards").toCollection().modify(card => {
    if (card.parentId === undefined) {
      card.parentId = null;
    }
  });
});

// Add deletions table for sync/merge support
db.version(3).stores({
  pages: "id, parentId, updatedAt",
  kanbanCards: "id, pageId, columnId, parentId",
  deletions: "id, [entityType+entityId]",
});

// Add link field to kanban cards
db.version(4).stores({
  pages: "id, parentId, updatedAt",
  kanbanCards: "id, pageId, columnId, parentId",
  deletions: "id, [entityType+entityId]",
}).upgrade(tx => {
  return tx.table("kanbanCards").toCollection().modify(card => {
    if (card.link === undefined) {
      card.link = "";
    }
  });
});

// Add focus mode tables (timeBlocks, focusSettings) & doneColumnId on pages
db.version(5).stores({
  pages: "id, parentId, updatedAt",
  kanbanCards: "id, pageId, columnId, parentId",
  deletions: "id, [entityType+entityId]",
  timeBlocks: "id, cardId, pageId, date",
  focusSettings: "id",
}).upgrade(tx => {
  return tx.table("pages").toCollection().modify(page => {
    if (page.doneColumnId === undefined) {
      page.doneColumnId = null;
    }
  });
});

// Add sessionLogs table for Zen mode journal
db.version(6).stores({
  pages: "id, parentId, updatedAt",
  kanbanCards: "id, pageId, columnId, parentId",
  deletions: "id, [entityType+entityId]",
  timeBlocks: "id, cardId, pageId, date",
  focusSettings: "id",
  sessionLogs: "id, cardId",
});

// Add order field to timeBlocks for intra-hour ordering
db.version(7).stores({
  pages: "id, parentId, updatedAt",
  kanbanCards: "id, pageId, columnId, parentId",
  deletions: "id, [entityType+entityId]",
  timeBlocks: "id, cardId, pageId, date",
  focusSettings: "id",
  sessionLogs: "id, cardId",
}).upgrade(tx => {
  return tx.table("timeBlocks").toCollection().modify((block) => {
    if (block.order === undefined) {
      block.order = 0;
    }
  });
});

// Add startMinute field to timeBlocks for current-hour time positioning
db.version(8).stores({
  pages: "id, parentId, updatedAt",
  kanbanCards: "id, pageId, columnId, parentId",
  deletions: "id, [entityType+entityId]",
  timeBlocks: "id, cardId, pageId, date",
  focusSettings: "id",
  sessionLogs: "id, cardId",
}).upgrade(tx => {
  return tx.table("timeBlocks").toCollection().modify((block) => {
    if (block.startMinute === undefined) {
      block.startMinute = 0;
    }
  });
});

export { db };
