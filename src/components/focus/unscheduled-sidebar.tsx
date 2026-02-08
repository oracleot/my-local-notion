import { useLiveQuery } from "dexie-react-hooks";
import { getUnscheduledCards, type EligibleCard } from "@/lib/focus-helpers";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { CalendarPlus, LayoutGrid } from "lucide-react";

interface UnscheduledSidebarProps {
  onSchedule: (ec: EligibleCard) => void;
}

export function UnscheduledSidebar({
  onSchedule,
}: UnscheduledSidebarProps) {
  const unscheduledCards = useLiveQuery(() => getUnscheduledCards(), []);

  return (
    <div className="hidden w-64 shrink-0 border-l border-border/30 lg:block">
      <div className="px-3 py-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50">
          Unscheduled
        </h3>
        <p className="text-[10px] text-muted-foreground/40 mt-0.5">
          Tasks from any column not yet scheduled
        </p>
      </div>

      <ScrollArea className="h-[calc(100%-40px)] px-2">
        {unscheduledCards === undefined ? (
          <div className="space-y-2 px-1 pt-1">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 animate-pulse rounded-lg bg-muted/30"
              />
            ))}
          </div>
        ) : unscheduledCards.length === 0 ? (
          <p className="px-2 py-8 text-center text-[11px] text-muted-foreground/40 italic">
            All tasks scheduled or done!
          </p>
        ) : (
          <div className="space-y-1 pb-4">
            {unscheduledCards.map((ec) => (
              <div
                key={ec.card.id}
                className="group flex items-start gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-muted/40"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium leading-snug text-foreground/80">
                    {ec.card.title || "Untitled"}
                  </p>
                  <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground/50">
                    <LayoutGrid className="h-2.5 w-2.5 shrink-0" />
                    <span className="truncate">{ec.boardName}</span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 text-primary/70 hover:text-primary hover:bg-primary/10"
                  onClick={() => onSchedule(ec)}
                  title="Add to calendar"
                >
                  <CalendarPlus className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
