import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  CalendarRange,
  Settings2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type ViewMode = "day" | "week";

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatWeekRange(mondayStr: string): string {
  const start = new Date(mondayStr + "T00:00:00");
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", opts)}`;
}

interface FocusViewHeaderProps {
  view: ViewMode;
  setView: (v: ViewMode) => void;
  selectedDate: string;
  weekStart: string;
  scheduledCount: number;
  totalMinutes: number;
  onNavigateDay: (delta: number) => void;
  onNavigateWeek: (delta: number) => void;
  onGoToToday: () => void;
  onOpenSettings: () => void;
}

export function FocusViewHeader({
  view,
  setView,
  selectedDate,
  weekStart,
  scheduledCount,
  totalMinutes,
  onNavigateDay,
  onNavigateWeek,
  onGoToToday,
  onOpenSettings,
}: FocusViewHeaderProps) {
  return (
    <div className="border-b border-border/30 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-xl font-semibold tracking-tight text-foreground">
            Focus
          </h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground/60">
            {scheduledCount} task{scheduledCount !== 1 ? "s" : ""} today ·{" "}
            {Math.round((totalMinutes / 60) * 10) / 10} hours planned
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border/50 p-0.5">
            <Button
              variant={view === "day" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 gap-1.5 text-[12px]"
              onClick={() => setView("day")}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Day
            </Button>
            <Button
              variant={view === "week" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 gap-1.5 text-[12px]"
              onClick={() => setView("week")}
            >
              <CalendarRange className="h-3.5 w-3.5" />
              Week
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onOpenSettings}
          >
            <Settings2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Date navigation */}
      <div className="mt-3 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() =>
            view === "day" ? onNavigateDay(-1) : onNavigateWeek(-1)
          }
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-[14px] font-medium text-foreground/80">
          {view === "day"
            ? formatDateDisplay(selectedDate)
            : formatWeekRange(weekStart)}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() =>
            view === "day" ? onNavigateDay(1) : onNavigateWeek(1)
          }
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="ml-1 h-6 text-[11px] text-muted-foreground"
          onClick={onGoToToday}
        >
          Today
        </Button>
      </div>
    </div>
  );
}
