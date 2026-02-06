// We store BlockNote content as a generic record array to avoid
// circular type issues with BlockNote's Block type at the storage layer.
// The editor component casts to/from the concrete Block type at runtime.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BlockContent = Record<string, any>;

// ─── Page ────────────────────────────────────────────────────────────────────

export type PageType = "document" | "kanban";

export interface Page {
  id: string;
  title: string;
  parentId: string | null;
  content: BlockContent[];
  icon: string | null;
  pageType: PageType;
  columns: KanbanColumn[];
  createdAt: Date;
  updatedAt: Date;
}

// ─── Kanban ──────────────────────────────────────────────────────────────────

export interface KanbanColumn {
  id: string;
  title: string;
  order: number;
}

export interface KanbanCard {
  id: string;
  pageId: string;
  columnId: string;
  title: string;
  description: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}
