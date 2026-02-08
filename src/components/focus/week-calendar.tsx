import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getTimeBlocksForWeek } from "@/lib/focus-helpers";
import { db } from "@/lib/db";
import type { TimeBlock } from "@/types";

interface WeekCalendarProps {
  weekStartDate: string; // ISO YYYY-MM-DD (Monday)
  dayStartHour: number;
  dayEndHour: number;
  onDayClick: (date: string) => void;
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatDateShort(date: string): string {
  const d = new Date(date + "T00:00:00");
  return d.getDate().toString();
}

function formatHour(h: number): string {
  const suffix = h >= 12 ? "PM" : "AM";
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}${suffix}`;
}

export function WeekCalendar({
  weekStartDate,
  dayStartHour,
  dayEndHour,
  onDayClick,
}: WeekCalendarProps) {
  const dates = useMemo(() => {
    const start = new Date(weekStartDate + "T00:00:00");
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d.toISOString().split("T")[0];
    });
  }, [weekStartDate]);

  const blocks = useLiveQuery(
    () => getTimeBlocksForWeek(weekStartDate),
    [weekStartDate]
  );

  const today = new Date().toISOString().split("T")[0];

  // Group blocks by date
  const blocksByDate = useMemo(() => {
    const map = new Map<string, TimeBlock[]>();
    for (const b of blocks ?? []) {
      if (!map.has(b.date)) map.set(b.date, []);
      map.get(b.date)!.push(b);
    }
    return map;
  }, [blocks]);

  const hours = useMemo(() => {
    const arr: number[] = [];
    for (let h = dayStartHour; h < dayEndHour; h++) arr.push(h);
    return arr;
  }, [dayStartHour, dayEndHour]);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        {/* Day headers */}
        <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-border/30">
          <div /> {/* spacer for time column */}
          {dates.map((date, i) => {
            const isToday = date === today;
            return (
              <button
                key={date}
                onClick={() => onDayClick(date)}
                className={`
                  flex flex-col items-center gap-0.5 py-2.5 text-center transition-colors
                  hover:bg-muted/30
                  ${isToday ? "text-primary" : "text-muted-foreground"}
                `}
              >
                <span className="text-[11px] font-medium uppercase tracking-wider">
                  {DAY_NAMES[i]}
                </span>
                <span
                  className={`
                    flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-semibold
                    ${isToday ? "bg-primary text-primary-foreground" : ""}
                  `}
                >
                  {formatDateShort(date)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Hour grid */}
        <div className="divide-y divide-border/20">
          {hours.map((hour) => (
            <div
              key={hour}
              className="grid min-h-[40px] grid-cols-[56px_repeat(7,1fr)]"
            >
              {/* Time label */}
              <div className="flex items-start justify-end pr-2 pt-1 text-[10px] font-medium tabular-nums text-muted-foreground/40">
                {formatHour(hour)}
              </div>

              {/* Day cells */}
              {dates.map((date) => {
                const dayBlocks = blocksByDate.get(date) ?? [];
                const block = dayBlocks.find((b) => b.startHour === hour);
                const isToday = date === today;

                return (
                  <div
                    key={`${date}-${hour}`}
                    className={`
                      border-l border-border/15 px-0.5 py-0.5
                      ${isToday ? "bg-primary/3" : ""}
                    `}
                  >
                    {block && <WeekBlockChip block={block} />}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WeekBlockChip({ block }: { block: TimeBlock }) {
  const card = useLiveQuery(
    () => db.kanbanCards.get(block.cardId),
    [block.cardId]
  );

  return (
    <div
      className={`
        truncate rounded-md px-1.5 py-1 text-[10px] font-medium leading-tight
        ${
          block.status === "completed"
            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
            : "bg-primary/10 text-primary"
        }
      `}
      title={card?.title}
    >
      {card?.title || "..."}
    </div>
  );
}
