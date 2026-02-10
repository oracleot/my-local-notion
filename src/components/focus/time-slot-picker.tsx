import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getTimeBlocksForDate } from "@/lib/focus-helpers";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Check } from "lucide-react";

interface TimeSlotPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  dayStartHour: number;
  dayEndHour: number;
  taskTitle: string;
  onSelectHour: (hour: number) => void;
}

function formatHour(h: number): string {
  const suffix = h >= 12 ? "PM" : "AM";
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}:00 ${suffix}`;
}

export function TimeSlotPicker({
  open,
  onOpenChange,
  date,
  dayStartHour,
  dayEndHour,
  taskTitle,
  onSelectHour,
}: TimeSlotPickerProps) {
  const blocks = useLiveQuery(
    () => (open ? getTimeBlocksForDate(date) : Promise.resolve([])),
    [date, open]
  );

  // Calculate capacity per hour
  const capacityByHour = useMemo(() => {
    const map = new Map<number, number>();
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const isToday = date === today;
    const currentHour = isToday ? now.getHours() : -1;
    const currentMinute = isToday ? now.getMinutes() : 0;

    for (let h = dayStartHour; h < dayEndHour; h++) {
      const hourBlocks = (blocks ?? []).filter((b) => b.startHour === h);
      const usedMinutes = hourBlocks.reduce((sum, b) => sum + b.durationMinutes, 0);
      let remaining = 60 - usedMinutes;

      // For current hour, cap by elapsed time
      if (h === currentHour) {
        remaining = Math.min(remaining, 60 - currentMinute);
      }

      map.set(h, Math.max(0, remaining));
    }
    return map;
  }, [blocks, date, dayStartHour, dayEndHour]);

  const hours = useMemo(() => {
    const arr: number[] = [];
    for (let h = dayStartHour; h < dayEndHour; h++) arr.push(h);
    return arr;
  }, [dayStartHour, dayEndHour]);

  const currentHour = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    return today === date ? now.getHours() : -1;
  }, [date]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm gap-0 p-0">
        <DialogHeader className="border-b border-border/50 px-4 pt-4 pb-3">
          <DialogTitle className="text-base font-semibold">
            Pick a time slot
          </DialogTitle>
          <p className="text-[13px] text-muted-foreground/70 mt-1">
            {taskTitle}
          </p>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] px-4 py-3">
          <div className="grid grid-cols-2 gap-2">
            {hours.map((hour) => {
              const capacity = capacityByHour.get(hour) ?? 60;
              const isFull = capacity === 0;
              const isCurrent = hour === currentHour;
              const isPast = currentHour !== -1 && hour < currentHour;

              return (
                <Button
                  key={hour}
                  variant={isCurrent ? "default" : "outline"}
                  disabled={isFull || isPast}
                  onClick={() => {
                    onSelectHour(hour);
                    onOpenChange(false);
                  }}
                  className={`h-10 justify-start gap-2 ${isPast ? "opacity-40" : ""}`}
                >
                  {isFull ? (
                    <Check className="h-3.5 w-3.5 text-muted-foreground/40" />
                  ) : (
                    <Clock className="h-3.5 w-3.5" />
                  )}
                  <span className="text-[13px]">{formatHour(hour)}</span>
                  {!isFull && !isPast && capacity < 60 && (
                    <span className="ml-auto text-[10px] text-muted-foreground/60">
                      {capacity}m
                    </span>
                  )}
                </Button>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
