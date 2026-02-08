import { db } from "@/lib/db";
import type { Page, KanbanCard, KanbanColumn, PageType, Deletion, DeletableEntityType } from "@/types";

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

// ─── Deletion Log Helper ─────────────────────────────────────────────────────

async function logDeletion(entityType: DeletableEntityType, entityId: string): Promise<void> {
  const deletion: Deletion = {
    id: generateId(),
    entityType,
    entityId,
    deletedAt: now(),
  };
  await db.deletions.add(deletion);
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
 * Logs deletions for sync/merge support.
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

  await db.transaction("rw", db.pages, db.kanbanCards, db.deletions, async () => {
    // Get all kanban cards for these pages (to log deletions)
    const cardsToDelete = await db.kanbanCards
      .where("pageId")
      .anyOf(idsToDelete)
      .toArray();

    // Log deletions for cards
    for (const card of cardsToDelete) {
      await logDeletion("kanbanCard", card.id);
    }

    // Log deletions for pages
    for (const pageId of idsToDelete) {
      await logDeletion("page", pageId);
    }

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

  await db.transaction("rw", db.pages, db.kanbanCards, db.deletions, async () => {
    // Get all cards in this column (to log deletions)
    const cardsToDelete = await db.kanbanCards
      .where("pageId")
      .equals(pageId)
      .filter((card) => card.columnId === columnId)
      .toArray();

    // Log deletions for cards
    for (const card of cardsToDelete) {
      await logDeletion("kanbanCard", card.id);
    }

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
    parentId: null,
    title,
    description: "",
    link: "",
    order: maxOrder + 1,
    createdAt: now(),
    updatedAt: now(),
  };

  await db.kanbanCards.add(card);
  return card;
}

export async function updateCard(
  id: string,
  changes: Partial<Pick<KanbanCard, "title" | "description" | "link">>
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
  // Cascade delete all subtasks and log deletions
  await db.transaction("rw", db.kanbanCards, db.deletions, async () => {
    // Get all subtasks for this card
    const subtasks = await db.kanbanCards
      .where("parentId")
      .equals(id)
      .toArray();
    
    // Log deletions and delete subtasks
    for (const subtask of subtasks) {
      await logDeletion("kanbanCard", subtask.id);
      await db.kanbanCards.delete(subtask.id);
    }
    
    // Log deletion and delete the card itself
    await logDeletion("kanbanCard", id);
    await db.kanbanCards.delete(id);
  });
}

// ─── Subtask helpers ─────────────────────────────────────────────────────────

/**
 * Creates a subtask under a parent card.
 * Subtasks can be in any column (independent of parent).
 * Enforces one level only - subtasks cannot have their own subtasks.
 */
export async function createSubtask(
  parentCardId: string,
  columnId: string,
  title: string
): Promise<KanbanCard> {
  const parentCard = await db.kanbanCards.get(parentCardId);
  if (!parentCard) throw new Error(`Parent card ${parentCardId} not found`);
  
  // Enforce one level only - subtasks cannot have subtasks
  if (parentCard.parentId !== null) {
    throw new Error("Subtasks cannot have their own subtasks (one level only)");
  }

  // Get the current max order in the target column
  const cardsInColumn = await db.kanbanCards
    .where("pageId")
    .equals(parentCard.pageId)
    .filter((c) => c.columnId === columnId)
    .toArray();

  const maxOrder = cardsInColumn.reduce(
    (max, card) => Math.max(max, card.order),
    -1
  );

  const subtask: KanbanCard = {
    id: generateId(),
    pageId: parentCard.pageId,
    columnId,
    parentId: parentCardId,
    title,
    description: "",
    link: "",
    order: maxOrder + 1,
    createdAt: now(),
    updatedAt: now(),
  };

  await db.kanbanCards.add(subtask);
  return subtask;
}

/**
 * Gets all subtasks for a parent card across all columns.
 */
export async function getSubtasks(parentCardId: string): Promise<KanbanCard[]> {
  return db.kanbanCards
    .where("parentId")
    .equals(parentCardId)
    .toArray();
}

/**
 * Gets the parent card info for a subtask.
 * Returns null if the card is not a subtask or parent not found.
 */
export async function getParentCard(cardId: string): Promise<KanbanCard | null> {
  const card = await db.kanbanCards.get(cardId);
  if (!card || card.parentId === null) return null;
  
  const parent = await db.kanbanCards.get(card.parentId);
  return parent ?? null;
}

/**
 * Promotes a subtask to a standalone card (removes parent link).
 */
export async function promoteSubtask(subtaskId: string): Promise<void> {
  const card = await db.kanbanCards.get(subtaskId);
  if (!card) throw new Error(`Card ${subtaskId} not found`);
  if (card.parentId === null) return; // Already a standalone card
  
  await db.kanbanCards.update(subtaskId, { parentId: null, updatedAt: now() });
}

/**
 * Demotes a standalone card to a subtask (assigns a parent).
 * Validates that the parent is not itself a subtask.
 */
export async function demoteToSubtask(
  cardId: string,
  parentCardId: string
): Promise<void> {
  const card = await db.kanbanCards.get(cardId);
  if (!card) throw new Error(`Card ${cardId} not found`);
  
  const parentCard = await db.kanbanCards.get(parentCardId);
  if (!parentCard) throw new Error(`Parent card ${parentCardId} not found`);
  
  // Cannot assign to a subtask as parent
  if (parentCard.parentId !== null) {
    throw new Error("Cannot demote to a subtask of another subtask");
  }
  
  // Cannot make a card a subtask of itself
  if (cardId === parentCardId) {
    throw new Error("Card cannot be its own parent");
  }
  
  // If this card has subtasks, we need to promote them first
  const subtasks = await getSubtasks(cardId);
  for (const subtask of subtasks) {
    await promoteSubtask(subtask.id);
  }
  
  await db.kanbanCards.update(cardId, { parentId: parentCardId, updatedAt: now() });
}
