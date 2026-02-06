import { db } from "@/lib/db";
import type { Page, KanbanCard, KanbanColumn, PageType } from "@/types";

// ─── Utilities ───────────────────────────────────────────────────────────────

function generateId(): string {
  return crypto.randomUUID();
}

function now(): Date {
  return new Date();
}

// Debounce helper for content saves
const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

function debounce(key: string, fn: () => void, ms = 300): void {
  const existing = debounceTimers.get(key);
  if (existing) clearTimeout(existing);
  debounceTimers.set(
    key,
    setTimeout(() => {
      debounceTimers.delete(key);
      fn();
    }, ms)
  );
}

// ─── Page CRUD ───────────────────────────────────────────────────────────────

export async function createPage(
  title: string,
  parentId: string | null = null,
  pageType: PageType = "document"
): Promise<Page> {
  const page: Page = {
    id: generateId(),
    title,
    parentId,
    content: [],
    icon: null,
    pageType,
    columns:
      pageType === "kanban"
        ? [
            { id: generateId(), title: "To Do", order: 0 },
            { id: generateId(), title: "In Progress", order: 1 },
            { id: generateId(), title: "Done", order: 2 },
          ]
        : [],
    createdAt: now(),
    updatedAt: now(),
  };

  await db.pages.add(page);
  return page;
}

export function updatePageContent(
  id: string,
  content: Page["content"]
): void {
  debounce(`content-${id}`, () => {
    db.pages.update(id, { content, updatedAt: now() });
  });
}

export async function updatePageTitle(
  id: string,
  title: string
): Promise<void> {
  await db.pages.update(id, { title, updatedAt: now() });
}

export async function updatePageIcon(
  id: string,
  icon: string | null
): Promise<void> {
  await db.pages.update(id, { icon, updatedAt: now() });
}

export async function movePage(
  id: string,
  newParentId: string | null
): Promise<void> {
  await db.pages.update(id, { parentId: newParentId, updatedAt: now() });
}

/**
 * Recursively deletes a page and all its descendants,
 * plus any kanban cards belonging to those pages.
 */
export async function deletePage(id: string): Promise<void> {
  // Collect all descendant page IDs
  const idsToDelete: string[] = [];

  async function collectDescendants(pageId: string) {
    idsToDelete.push(pageId);
    const children = await db.pages
      .where("parentId")
      .equals(pageId)
      .toArray();
    for (const child of children) {
      await collectDescendants(child.id);
    }
  }

  await collectDescendants(id);

  await db.transaction("rw", db.pages, db.kanbanCards, async () => {
    // Delete all kanban cards for these pages
    await db.kanbanCards
      .where("pageId")
      .anyOf(idsToDelete)
      .delete();

    // Delete all pages
    await db.pages.bulkDelete(idsToDelete);
  });
}

// ─── Kanban Column helpers ───────────────────────────────────────────────────

export async function addColumn(
  pageId: string,
  title: string
): Promise<KanbanColumn> {
  const page = await db.pages.get(pageId);
  if (!page) throw new Error(`Page ${pageId} not found`);

  const maxOrder = page.columns.reduce(
    (max, col) => Math.max(max, col.order),
    -1
  );

  const column: KanbanColumn = {
    id: generateId(),
    title,
    order: maxOrder + 1,
  };

  await db.pages.update(pageId, {
    columns: [...page.columns, column],
    updatedAt: now(),
  });

  return column;
}

export async function updateColumn(
  pageId: string,
  columnId: string,
  changes: Partial<Pick<KanbanColumn, "title" | "order">>
): Promise<void> {
  const page = await db.pages.get(pageId);
  if (!page) throw new Error(`Page ${pageId} not found`);

  const columns = page.columns.map((col) =>
    col.id === columnId ? { ...col, ...changes } : col
  );

  await db.pages.update(pageId, { columns, updatedAt: now() });
}

export async function deleteColumn(
  pageId: string,
  columnId: string
): Promise<void> {
  const page = await db.pages.get(pageId);
  if (!page) throw new Error(`Page ${pageId} not found`);

  await db.transaction("rw", db.pages, db.kanbanCards, async () => {
    // Delete all cards in this column
    await db.kanbanCards
      .where("pageId")
      .equals(pageId)
      .filter((card) => card.columnId === columnId)
      .delete();

    // Remove column from page
    const columns = page.columns.filter((col) => col.id !== columnId);
    await db.pages.update(pageId, { columns, updatedAt: now() });
  });
}

// ─── Kanban Card CRUD ────────────────────────────────────────────────────────

export async function createCard(
  pageId: string,
  columnId: string,
  title: string
): Promise<KanbanCard> {
  // Get the current max order in this column
  const cardsInColumn = await db.kanbanCards
    .where("pageId")
    .equals(pageId)
    .filter((c) => c.columnId === columnId)
    .toArray();

  const maxOrder = cardsInColumn.reduce(
    (max, card) => Math.max(max, card.order),
    -1
  );

  const card: KanbanCard = {
    id: generateId(),
    pageId,
    columnId,
    title,
    description: "",
    order: maxOrder + 1,
    createdAt: now(),
    updatedAt: now(),
  };

  await db.kanbanCards.add(card);
  return card;
}

export async function updateCard(
  id: string,
  changes: Partial<Pick<KanbanCard, "title" | "description">>
): Promise<void> {
  await db.kanbanCards.update(id, { ...changes, updatedAt: now() });
}

export async function moveCard(
  id: string,
  targetColumnId: string,
  newOrder: number
): Promise<void> {
  await db.kanbanCards.update(id, {
    columnId: targetColumnId,
    order: newOrder,
    updatedAt: now(),
  });
}

export async function deleteCard(id: string): Promise<void> {
  await db.kanbanCards.delete(id);
}
