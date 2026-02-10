import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getAllEligibleCards, type EligibleCard } from "@/lib/focus-helpers";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, CalendarPlus, LayoutGrid, Plus } from "lucide-react";

interface TaskPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSchedule: (card: EligibleCard) => void;
  onCreateNew?: () => void;
}

export function TaskPickerDialog({
  open,
  onOpenChange,
  onSchedule,
  onCreateNew,
}: TaskPickerDialogProps) {
  const [search, setSearch] = useState("");

  const eligibleCards = useLiveQuery(
    () => (open ? getAllEligibleCards() : Promise.resolve([])),
    [open]
  );

  const filtered = useMemo(() => {
    if (!eligibleCards) return [];
    const q = search.toLowerCase().trim();
    if (!q) return eligibleCards;
    return eligibleCards.filter(
      (ec) =>
        ec.card.title.toLowerCase().includes(q) ||
        ec.boardName.toLowerCase().includes(q) ||
        ec.columnName.toLowerCase().includes(q)
    );
  }, [eligibleCards, search]);

  // Group by board
  const grouped = useMemo(() => {
    const map = new Map<string, EligibleCard[]>();
    for (const ec of filtered) {
      const key = ec.boardName;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ec);
    }
    return map;
  }, [filtered]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 p-0">
        <DialogHeader className="border-b border-border/50 px-4 pt-4 pb-3">
          <DialogTitle className="text-base font-semibold">
            Pick a task
          </DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative px-4 py-3">
          <Search className="absolute left-7 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
          <Input
            placeholder="Filter tasks..."
            className="h-8 pl-8 text-[13px]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Create new task button */}
        {onCreateNew && (
          <div className="px-4 pb-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 text-[13px] font-medium"
              onClick={() => {
                onCreateNew();
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              Create new task
            </Button>
          </div>
        )}

        <ScrollArea className="max-h-[360px] px-4 pb-4">
          {eligibleCards === undefined ? (
            <div className="space-y-2 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-muted/40" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-muted-foreground/50 italic">
              {search ? "No tasks match your filter." : "No tasks available."}
            </p>
          ) : (
            Array.from(grouped.entries()).map(([boardName, cards]) => (
              <div key={boardName} className="mb-3 last:mb-0">
                <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/50">
                  <LayoutGrid className="h-3 w-3" />
                  {boardName}
                </div>
                <div className="space-y-1">
                  {cards.map((ec) => (
                    <TaskPickerRow
                      key={ec.card.id}
                      eligibleCard={ec}
                      onSchedule={() => {
                        onSchedule(ec);
                        onOpenChange(false);
                      }}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function TaskPickerRow({
  eligibleCard,
  onSchedule,
}: {
  eligibleCard: EligibleCard;
  onSchedule: () => void;
}) {
  return (
    <div className="group flex items-center gap-2 rounded-lg px-2.5 py-2 transition-colors hover:bg-muted/50">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-foreground/90">
          {eligibleCard.card.title || "Untitled"}
        </p>
        <span className="inline-block rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          {eligibleCard.columnName}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-primary hover:bg-primary/10"
          onClick={onSchedule}
          title="Add to calendar"
        >
          <CalendarPlus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
