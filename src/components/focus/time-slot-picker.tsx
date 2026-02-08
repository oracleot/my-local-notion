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

  const occupiedHours = useMemo(() => {
    return new Set((blocks ?? []).map((b) => b.startHour));
  }, [blocks]);

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
              const isOccupied = occupiedHours.has(hour);
              const isCurrent = hour === currentHour;
              const isPast = currentHour !== -1 && hour < currentHour;

              return (
                <Button
                  key={hour}
                  variant={isCurrent ? "default" : "outline"}
                  disabled={isOccupied || isPast}
                  onClick={() => {
                    onSelectHour(hour);
                    onOpenChange(false);
                  }}
                  className={`h-10 justify-start gap-2 ${isPast ? "opacity-40" : ""}`}
                >
                  {isOccupied ? (
                    <Check className="h-3.5 w-3.5 text-muted-foreground/40" />
                  ) : (
                    <Clock className="h-3.5 w-3.5" />
                  )}
                  <span className="text-[13px]">{formatHour(hour)}</span>
                </Button>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
