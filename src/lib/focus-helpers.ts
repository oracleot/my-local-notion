import { db } from "@/lib/db";
import type { Page, KanbanCard, TimeBlock, FocusSettings } from "@/types";

// ─── Done column detection ──────────────────────────────────────────────────
export function getDoneColumnId(page: Page): string | null {
  if (page.doneColumnId) return page.doneColumnId;
  if (page.columns.length === 0) return null;
  return [...page.columns].sort((a, b) => b.order - a.order)[0].id;
}

export function isCardDone(card: KanbanCard, page: Page): boolean {
  const doneColId = getDoneColumnId(page);
  return doneColId !== null && card.columnId === doneColId;
}

// ─── Eligible cards ─────────────────────────────────────────────────────────
export interface EligibleCard {
  card: KanbanCard; boardName: string; columnName: string; pageId: string;
}

export async function getAllEligibleCards(): Promise<EligibleCard[]> {
  const boardPages = await db.pages.filter((p) => p.pageType === "kanban").toArray();
  const results: EligibleCard[] = [];
  for (const page of boardPages) {
    const doneColId = getDoneColumnId(page);
    const cards = await db.kanbanCards.where("pageId").equals(page.id).toArray();
    const topLevel = cards.filter((c) => c.parentId === null && c.columnId !== doneColId);
    for (const card of topLevel) {
      const col = page.columns.find((c) => c.id === card.columnId);
      results.push({ card, boardName: page.title || "Untitled Board", columnName: col?.title || "Unknown", pageId: page.id });
    }
  }
  return results;
}

export async function getUnscheduledCards(): Promise<EligibleCard[]> {
  const allEligible = await getAllEligibleCards();
  const scheduledIds = new Set((await db.timeBlocks.toArray()).map(b => b.cardId));
  return allEligible.filter(ec => !scheduledIds.has(ec.card.id));
}

// ─── Time block CRUD ────────────────────────────────────────────────────────
export async function getTimeBlocksForDate(date: string): Promise<TimeBlock[]> {
  return db.timeBlocks.where("date").equals(date).toArray();
}

export async function getTimeBlocksForWeek(weekStartDate: string): Promise<TimeBlock[]> {
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStartDate); d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });
  return db.timeBlocks.where("date").anyOf(dates).toArray();
}

/** Returns remaining capacity in minutes for a (date, hour) slot. Factors in elapsed time for current hour. */
export async function getRemainingCapacity(date: string, hour: number): Promise<number> {
  const blocks = (await db.timeBlocks.where("date").equals(date).toArray()).filter((b) => b.startHour === hour);
  const usedMinutes = blocks.reduce((sum, b) => sum + b.durationMinutes, 0);
  const now = new Date();
  const isCurrentHour = date === now.toISOString().split("T")[0] && hour === now.getHours();
  const baseCapacity = isCurrentHour ? 60 - now.getMinutes() : 60;
  return Math.max(0, baseCapacity - usedMinutes);
}

export async function createTimeBlock(cardId: string, pageId: string, date: string, startHour: number, durationMinutes = 60): Promise<TimeBlock> {
  const capacity = await getRemainingCapacity(date, startHour);
  if (durationMinutes > capacity) throw new Error(`Duration (${durationMinutes}m) exceeds capacity (${capacity}m)`);
  const block: TimeBlock = { id: crypto.randomUUID(), cardId, pageId, date, startHour, durationMinutes, status: "scheduled", createdAt: new Date(), updatedAt: new Date() };
  await db.timeBlocks.add(block);
  return block;
}

export async function updateTimeBlock(id: string, updates: Partial<Pick<TimeBlock, "startHour" | "date" | "durationMinutes" | "status">>): Promise<void> {
  await db.timeBlocks.update(id, { ...updates, updatedAt: new Date() });
}

export async function deleteTimeBlock(id: string): Promise<void> {
  await db.timeBlocks.delete(id);
}

/** Find best available hour slot. Tries current hour if valid, else first slot with capacity. */
export async function findAvailableHour(date: string, dayStartHour: number, dayEndHour: number, minCapacity = 1): Promise<number> {
  const blocks = await db.timeBlocks.where("date").equals(date).toArray();
  const now = new Date();
  const isToday = date === now.toISOString().split("T")[0];
  const currentHour = isToday ? now.getHours() : -1;
  const currentMinute = isToday ? now.getMinutes() : 0;

  const getCapacity = (h: number) => {
    const used = blocks.filter((b) => b.startHour === h).reduce((s, b) => s + b.durationMinutes, 0);
    const baseCapacity = h === currentHour ? 60 - currentMinute : 60;
    return Math.max(0, baseCapacity - used);
  };

  if (isToday && currentHour >= dayStartHour && currentHour < dayEndHour && getCapacity(currentHour) >= minCapacity) {
    return currentHour;
  }
  for (let h = dayStartHour; h < dayEndHour; h++) {
    if (isToday && h < currentHour) continue;
    if (getCapacity(h) >= minCapacity) return h;
  }
  return dayStartHour;
}

// ─── Focus settings ─────────────────────────────────────────────────────────
const DEFAULT_SETTINGS: FocusSettings = { id: "settings", workMinutes: 60, breakMinutes: 10, audioEnabled: true, dayStartHour: 8, dayEndHour: 18, durationPresets: [25, 40, 60] };

export async function getFocusSettings(): Promise<FocusSettings> {
  const existing = await db.focusSettings.get("settings");
  if (existing) return { ...DEFAULT_SETTINGS, ...existing };
  await db.focusSettings.add(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

export async function updateFocusSettings(updates: Partial<Omit<FocusSettings, "id">>): Promise<FocusSettings> {
  const current = await getFocusSettings();
  const merged = { ...current, ...updates };
  await db.focusSettings.put(merged);
  return merged;
}

// ─── Cleanup helper ─────────────────────────────────────────────────────────
export async function removeTimeBlocksForCard(cardId: string): Promise<void> {
  await db.timeBlocks.where("cardId").equals(cardId).delete();
}

export async function markSkippedBlocks(date: string): Promise<void> {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const blocks = await db.timeBlocks.where("date").equals(date).toArray();
  const currentHour = date === today ? now.getHours() : (date < today ? 24 : -1);
  const toSkip = blocks.filter((b) => b.status === "scheduled" && b.startHour < currentHour);
  for (const b of toSkip) {
    await db.timeBlocks.update(b.id, { status: "skipped", updatedAt: new Date() });
  }
}
