import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { getEffectiveBlockTime } from "@/lib/focus-time-blocks";
import type { TimeBlock } from "@/types";

const baseDate = "2026-02-12";

function buildBlock(overrides: Partial<TimeBlock>): TimeBlock {
  return {
    id: overrides.id ?? "block",
    cardId: overrides.cardId ?? "card",
    pageId: overrides.pageId ?? "page",
    date: overrides.date ?? baseDate,
    startHour: overrides.startHour ?? 10,
    startMinute: overrides.startMinute ?? 0,
    durationMinutes: overrides.durationMinutes ?? 10,
    status: overrides.status ?? "scheduled",
    order: overrides.order ?? 0,
    createdAt: overrides.createdAt ?? new Date(),
    updatedAt: overrides.updatedAt ?? new Date(),
  };
}

function expectClock(date: Date, hour: number, minute: number) {
  expect(date.getHours()).toBe(hour);
  expect(date.getMinutes()).toBe(minute);
}

beforeEach(async () => {
  await db.timeBlocks.clear();
});

describe("getEffectiveBlockTime", () => {
  it("returns effective start/end for stacked blocks with gaps", async () => {
    const blockA = buildBlock({ id: "a", startMinute: 0, durationMinutes: 20, order: 0 });
    const blockB = buildBlock({ id: "b", startMinute: 30, durationMinutes: 10, order: 1 });
    const blockC = buildBlock({ id: "c", startMinute: 25, durationMinutes: 15, order: 2 });

    await db.timeBlocks.bulkAdd([blockA, blockB, blockC]);

    const effectiveB = await getEffectiveBlockTime(blockB);
    const effectiveC = await getEffectiveBlockTime(blockC);

    expect(effectiveB).not.toBeNull();
    expect(effectiveC).not.toBeNull();

    expectClock(effectiveB!.start, 10, 30);
    expectClock(effectiveB!.end, 10, 40);
    expectClock(effectiveC!.start, 10, 40);
    expectClock(effectiveC!.end, 10, 55);
  });

  it("returns null when the block is not found", async () => {
    const block = buildBlock({ id: "missing" });
    const result = await getEffectiveBlockTime(block);
    expect(result).toBeNull();
  });
});
