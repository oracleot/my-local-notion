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
  doneColumnId?: string | null;
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
  parentId: string | null;
  title: string;
  description: string;
  link: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Deletion Log (for sync/merge) ───────────────────────────────────────────

export type DeletableEntityType = "page" | "kanbanCard";

export interface Deletion {
  id: string;
  entityType: DeletableEntityType;
  entityId: string;
  deletedAt: Date;
}

// ─── Focus Mode ──────────────────────────────────────────────────────────────

export type TimeBlockStatus = "scheduled" | "completed" | "skipped";

export interface TimeBlock {
  id: string;
  cardId: string;
  pageId: string;
  date: string; // ISO date YYYY-MM-DD
  startHour: number; // 0-23
  durationMinutes: number; // default 60
  status: TimeBlockStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface FocusSettings {
  id: string; // Always "settings"
  workMinutes: number; // default 60
  breakMinutes: number; // default 10
  audioEnabled: boolean; // default true
  dayStartHour: number; // default 8
  dayEndHour: number; // default 18
}

export interface FocusSession {
  cardId: string;
  cardTitle: string;
  boardName: string;
  pageId: string;
  timeBlockId: string | null;
  remainingSeconds: number;
  isRunning: boolean;
}
