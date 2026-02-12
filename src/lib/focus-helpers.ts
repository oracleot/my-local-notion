import { db } from "@/lib/db";
import { createTimeBlock } from "@/lib/focus-time-blocks";
import type { Page, KanbanCard, TimeBlock, FocusSettings } from "@/types";

// ─── Break block constants ──────────────────────────────────────────────────
export const BREAK_CARD_ID = "__break__";
export const BREAK_PAGE_ID = "__break__";

export function isBreakBlock(block: TimeBlock): boolean {
  return block.cardId === BREAK_CARD_ID;
}

export async function createBreakBlock(date: string, startHour: number, durationMinutes: number): Promise<TimeBlock> {
  return createTimeBlock(BREAK_CARD_ID, BREAK_PAGE_ID, date, startHour, durationMinutes);
}

// ─── Board helpers ──────────────────────────────────────────────────────────
export function getFirstColumn(page: Page): { id: string; title: string } | null {
  if (page.columns.length === 0) return null;
  const sorted = [...page.columns].sort((a, b) => a.order - b.order);
  return { id: sorted[0].id, title: sorted[0].title };
}

export async function getKanbanBoards(): Promise<Page[]> {
  return db.pages.filter((p) => p.pageType === "kanban" && p.columns.length > 0).toArray();
}

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


// ─── Focus settings ─────────────────────────────────────────────────────────
const DEFAULT_SETTINGS: FocusSettings = { id: "settings", workMinutes: 60, breakMinutes: 10, audioEnabled: true, dayStartHour: 8, dayEndHour: 18, durationPresets: [25, 40, 60], reminderIntervalMinutes: 5 };

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


export * from "@/lib/focus-time-blocks";
