import { db } from "@/lib/db";
import type { Page, KanbanCard, TimeBlock, FocusSettings } from "@/types";

// ─── Done column detection ──────────────────────────────────────────────────
/** Returns the "done" column id for a board page. Priority: 1) User override (doneColumnId), 2) Rightmost column (highest order). */
export function getDoneColumnId(page: Page): string | null {
  if (page.doneColumnId) return page.doneColumnId;
  if (page.columns.length === 0) return null;
  const sorted = [...page.columns].sort((a, b) => b.order - a.order);
  return sorted[0].id;
}

/** Checks if a card is in the done column for its board. */
export function isCardDone(card: KanbanCard, page: Page): boolean {
  const doneColId = getDoneColumnId(page);
  return doneColId !== null && card.columnId === doneColId;
}

// ─── Eligible cards ─────────────────────────────────────────────────────────
export interface EligibleCard {
  card: KanbanCard;
  boardName: string;
  columnName: string;
  pageId: string;
}

/** Fetches all kanban cards that are NOT in a "done" column, grouped with their board/column context. */
export async function getAllEligibleCards(): Promise<EligibleCard[]> {
  const boardPages = await db.pages
    .filter((p) => p.pageType === "kanban")
    .toArray();

  const results: EligibleCard[] = [];

  for (const page of boardPages) {
    const doneColId = getDoneColumnId(page);
    const cards = await db.kanbanCards
      .where("pageId")
      .equals(page.id)
      .toArray();

    // Only include top-level cards (not subtasks)
    const topLevelCards = cards.filter(
      (c) => c.parentId === null && c.columnId !== doneColId
    );

    for (const card of topLevelCards) {
      const col = page.columns.find((c) => c.id === card.columnId);
      results.push({
        card,
        boardName: page.title || "Untitled Board",
        columnName: col?.title || "Unknown",
        pageId: page.id,
      });
    }
  }

  return results;
}

/** Fetches eligible cards that DON'T have ANY time blocks scheduled. */
export async function getUnscheduledCards(): Promise<EligibleCard[]> {
  const allEligible = await getAllEligibleCards();
  const scheduledCardIds = new Set(
    (await db.timeBlocks.toArray()).map(b => b.cardId)
  );
  return allEligible.filter(ec => !scheduledCardIds.has(ec.card.id));
}

// ─── Time block CRUD ────────────────────────────────────────────────────────

export async function getTimeBlocksForDate(
  date: string
): Promise<TimeBlock[]> {
  return db.timeBlocks.where("date").equals(date).toArray();
}

export async function getTimeBlocksForWeek(
  weekStartDate: string
): Promise<TimeBlock[]> {
  const start = new Date(weekStartDate);
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return db.timeBlocks.where("date").anyOf(dates).toArray();
}

export async function createTimeBlock(
  cardId: string,
  pageId: string,
  date: string,
  startHour: number,
  durationMinutes: number = 60
): Promise<TimeBlock> {
  const block: TimeBlock = {
    id: crypto.randomUUID(),
    cardId,
    pageId,
    date,
    startHour,
    durationMinutes,
    status: "scheduled",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await db.timeBlocks.add(block);
  return block;
}

export async function updateTimeBlock(
  id: string,
  updates: Partial<Pick<TimeBlock, "startHour" | "date" | "durationMinutes" | "status">>
): Promise<void> {
  await db.timeBlocks.update(id, { ...updates, updatedAt: new Date() });
}

export async function deleteTimeBlock(id: string): Promise<void> {
  await db.timeBlocks.delete(id);
}

/** Find the best available hour slot for scheduling. Tries current hour if in range and available, else finds first free slot. */
export async function findAvailableHour(
  date: string,
  dayStartHour: number,
  dayEndHour: number
): Promise<number> {
  const existingBlocks = await db.timeBlocks.where("date").equals(date).toArray();
  const occupiedHours = new Set(existingBlocks.map(b => b.startHour));
  
  const now = new Date();
  const currentHour = now.getHours();
  const isToday = date === now.toISOString().split("T")[0];
  
  // Try current hour if it's today, in range, and available
  if (isToday && currentHour >= dayStartHour && currentHour < dayEndHour && !occupiedHours.has(currentHour)) {
    return currentHour;
  }
  
  // Find first available slot
  for (let h = dayStartHour; h < dayEndHour; h++) {
    if (!occupiedHours.has(h)) return h;
  }
  
  // Fallback to start hour if all occupied
  return dayStartHour;
}

// ─── Focus settings ─────────────────────────────────────────────────────────
const DEFAULT_SETTINGS: FocusSettings = {
  id: "settings",
  workMinutes: 60,
  breakMinutes: 10,
  audioEnabled: true,
  dayStartHour: 8,
  dayEndHour: 18,
};

export async function getFocusSettings(): Promise<FocusSettings> {
  const existing = await db.focusSettings.get("settings");
  if (existing) return existing;
  await db.focusSettings.add(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

export async function updateFocusSettings(
  updates: Partial<Omit<FocusSettings, "id">>
): Promise<FocusSettings> {
  const current = await getFocusSettings();
  const merged = { ...current, ...updates };
  await db.focusSettings.put(merged);
  return merged;
}

// ─── Cleanup helper ─────────────────────────────────────────────────────────
/** Remove time blocks for a deleted card. */
export async function removeTimeBlocksForCard(cardId: string): Promise<void> {
  await db.timeBlocks.where("cardId").equals(cardId).delete();
}
