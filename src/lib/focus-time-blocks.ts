import { db } from "@/lib/db";
import type { TimeBlock } from "@/types";

/**
 * Calculates the effective end minute of the last block in the hour,
 * accounting for gaps and explicit start times.
 */
export function calculateEffectiveEnd(blocks: TimeBlock[]): number {
  const sorted = [...blocks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  let currentPos = 0;

  if (sorted.length > 0 && sorted[0].startMinute > 0) {
    currentPos = sorted[0].startMinute;
  }

  for (const b of sorted) {
    const start = Math.max(currentPos, b.startMinute);
    currentPos = start + b.durationMinutes;
  }

  return currentPos;
}

export async function getTimeBlocksForDate(date: string): Promise<TimeBlock[]> {
  return db.timeBlocks.where("date").equals(date).toArray();
}

export async function getTimeBlocksForWeek(weekStartDate: string): Promise<TimeBlock[]> {
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStartDate);
    d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });
  return db.timeBlocks.where("date").anyOf(dates).toArray();
}

/** Returns remaining capacity in minutes for a (date, hour) slot. Factors in elapsed time for current hour. */
export async function getRemainingCapacity(date: string, hour: number): Promise<number> {
  const blocks = (await db.timeBlocks.where("date").equals(date).toArray()).filter((b) => b.startHour === hour);

  const now = new Date();
  const isCurrentHour = date === now.toISOString().split("T")[0] && hour === now.getHours();
  const currentMinute = isCurrentHour ? now.getMinutes() : 0;

  const effectiveEnd = calculateEffectiveEnd(blocks);
  // For current hour, new task must start after 'now' AND after existing tasks
  const nextStart = isCurrentHour ? Math.max(currentMinute, effectiveEnd) : effectiveEnd;

  return Math.max(0, 60 - nextStart);
}

export async function createTimeBlock(cardId: string, pageId: string, date: string, startHour: number, durationMinutes = 60): Promise<TimeBlock> {
  const capacity = await getRemainingCapacity(date, startHour);
  if (durationMinutes > capacity) throw new Error(`Duration (${durationMinutes}m) exceeds capacity (${capacity}m)`);

  // Calculate order: append to end of existing blocks in this slot
  const existing = (await db.timeBlocks.where("date").equals(date).toArray()).filter((b) => b.startHour === startHour);
  const maxOrder = existing.length > 0 ? Math.max(...existing.map((b) => b.order ?? 0)) : -1;
  const now = new Date();
  const isCurrentHour = date === now.toISOString().split("T")[0] && startHour === now.getHours();

  // If current hour, start at now to create gap if needed. If future, start at 0 (renders sequentially).
  // Note: calculateEffectiveEnd logic will handle stacking after existing blocks automatically
  // because Math.max(currentPos, block.startMinute) handles overlaps.
  const startMinute = isCurrentHour ? now.getMinutes() : 0;

  const block: TimeBlock = {
    id: crypto.randomUUID(), cardId, pageId, date, startHour, startMinute, durationMinutes,
    status: "scheduled", order: maxOrder + 1, createdAt: new Date(), updatedAt: new Date(),
  };
  await db.timeBlocks.add(block);
  return block;
}

export async function updateTimeBlock(id: string, updates: Partial<Pick<TimeBlock, "startHour" | "startMinute" | "date" | "durationMinutes" | "status" | "order">>): Promise<void> {
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
    const hourBlocks = blocks.filter((b) => b.startHour === h);
    const effectiveEnd = calculateEffectiveEnd(hourBlocks);

    // Check if this is the current hour
    const isCurrent = isToday && h === currentHour;
    const nextStart = isCurrent ? Math.max(currentMinute, effectiveEnd) : effectiveEnd;

    return Math.max(0, 60 - nextStart);
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

export async function getEffectiveBlockTime(block: TimeBlock): Promise<{ start: Date; end: Date } | null> {
  const blocks = (await db.timeBlocks.where("date").equals(block.date).toArray()).filter((b) => b.startHour === block.startHour);
  const sorted = [...blocks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  let currentPos = 0;

  if (sorted.length > 0 && sorted[0].startMinute > 0) {
    currentPos = sorted[0].startMinute;
  }

  for (const b of sorted) {
    const start = Math.max(currentPos, b.startMinute);
    const end = start + b.durationMinutes;

    if (b.id === block.id) {
      const baseDate = new Date(`${block.date}T00:00:00`);
      const startDate = new Date(baseDate);
      const endDate = new Date(baseDate);
      startDate.setHours(block.startHour, start, 0, 0);
      endDate.setHours(block.startHour, end, 0, 0);
      return { start: startDate, end: endDate };
    }

    currentPos = end;
  }

  return null;
}

// ─── Cleanup helper ─────────────────────────────────────────────────────────
export async function removeTimeBlocksForCard(cardId: string): Promise<void> {
  await db.timeBlocks.where("cardId").equals(cardId).delete();
}

// ─── Block reordering ───────────────────────────────────────────────────────
export async function reorderBlocksInHour(orderedIds: string[]): Promise<void> {
  const now = new Date();
  for (let i = 0; i < orderedIds.length; i++) {
    await db.timeBlocks.update(orderedIds[i], { order: i, updatedAt: now });
  }
}

// ─── position-aware skip logic ──────────────────────────────────────────────
export async function markSkippedBlocks(date: string): Promise<void> {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const blocks = await db.timeBlocks.where("date").equals(date).toArray();
  const currentHour = date === today ? now.getHours() : (date < today ? 24 : -1);
  const currentMinute = now.getMinutes();

  // Group blocks by hour for position-aware skipping
  const byHour = new Map<number, TimeBlock[]>();
  for (const b of blocks) {
    const arr = byHour.get(b.startHour) ?? [];
    arr.push(b);
    byHour.set(b.startHour, arr);
  }

  for (const [hour, hourBlocks] of byHour) {
    const sorted = [...hourBlocks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    if (hour < currentHour) {
      // Entire hour is past — skip all scheduled blocks
      for (const b of sorted) {
        if (b.status === "scheduled") {
          await db.timeBlocks.update(b.id, { status: "skipped", updatedAt: new Date() });
        }
      }
    } else if (hour === currentHour && date === today) {
      // Current hour — position-aware: skip blocks whose effective window has elapsed
      let currentPos = 0;
      if (sorted.length > 0 && sorted[0].startMinute > 0) {
        currentPos = sorted[0].startMinute;
      }

      for (const b of sorted) {
        // Respect gaps exactly like in UI
        const start = Math.max(currentPos, b.startMinute);
        const blockEnd = start + b.durationMinutes;

        if (b.status === "scheduled" && blockEnd <= currentMinute) {
          await db.timeBlocks.update(b.id, { status: "skipped", updatedAt: new Date() });
        }
        currentPos = blockEnd;
      }
    }
  }
}
