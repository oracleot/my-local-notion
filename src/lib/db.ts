import Dexie, { type EntityTable } from "dexie";
import type { Page, KanbanCard } from "@/types";

const db = new Dexie("NotionCloneDB") as Dexie & {
  pages: EntityTable<Page, "id">;
  kanbanCards: EntityTable<KanbanCard, "id">;
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

export { db };
