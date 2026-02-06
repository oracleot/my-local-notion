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

export { db };
