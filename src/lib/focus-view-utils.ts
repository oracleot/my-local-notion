import { getRemainingCapacity, updateTimeBlock } from "@/lib/focus-helpers";
import { db } from "@/lib/db";

export interface HourContext {
  hour: number;
  capacity: number;
  isCurrentHour: boolean;
}

export function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

export function getMondayOfWeek(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  return d.toISOString().split("T")[0];
}

export async function getHourContext(selectedDate: string, hour: number): Promise<HourContext> {
  const capacity = await getRemainingCapacity(selectedDate, hour);
  const now = new Date();
  const isToday = selectedDate === now.toISOString().split("T")[0];
  return { hour, capacity, isCurrentHour: isToday && hour === now.getHours() };
}

export function formatClockTime(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHour}:${minutes} ${suffix}`;
}

export async function moveBlockToHour(blockId: string, newHour: number, selectedDate: string): Promise<void> {
  const allBlocks = await db.timeBlocks.where("date").equals(selectedDate).toArray();
  const targetBlocks = allBlocks.filter((b) => b.startHour === newHour);
  const maxOrder = targetBlocks.length > 0 ? Math.max(...targetBlocks.map((b) => b.order ?? 0)) : -1;
  await updateTimeBlock(blockId, { startHour: newHour, order: maxOrder + 1 });
}
