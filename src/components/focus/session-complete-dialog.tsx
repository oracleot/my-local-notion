import { useState, useMemo, useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { moveCard } from "@/lib/db-helpers";
import { updateTimeBlock } from "@/lib/focus-helpers";
import { useAppStore } from "@/stores/app-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CheckCircle2, Clock, X, ChevronDown } from "lucide-react";

export function SessionCompleteDialog() {
  const session = useAppStore((s) => s.activeSession);
  const endSession = useAppStore((s) => s.endSession);
  const extend = useAppStore((s) => s.extendSession);
  const [showConfetti, setShowConfetti] = useState(true);

  const page = useLiveQuery(
    () => (session?.pageId ? db.pages.get(session.pageId) : undefined),
    [session?.pageId]
  );

  const columns = useMemo(() => page?.columns ?? [], [page]);

  const handleMoveTo = useCallback(
    async (columnId: string) => {
      if (!session) return;
      // Move card in kanban board
      const cards = await db.kanbanCards
        .where("columnId")
        .equals(columnId)
        .toArray();
      await moveCard(session.cardId, columnId, cards.length);

      // Mark time block as completed
      if (session.timeBlockId) {
        await updateTimeBlock(session.timeBlockId, { status: "completed" });
      }
      endSession();
    },
    [session, endSession]
  );

  const handleExtend = useCallback(
    (minutes: number) => {
      extend(minutes * 60);
      setShowConfetti(false);
    },
    [extend]
  );

  const handleDismiss = useCallback(() => {
    if (session?.timeBlockId) {
      updateTimeBlock(session.timeBlockId, { status: "completed" });
    }
    endSession();
  }, [session, endSession]);

  if (!session || session.remainingSeconds > 0) return null;

  return (
    <Dialog open onOpenChange={() => handleDismiss()}>
      <DialogContent className="max-w-sm gap-0">
        <DialogHeader className="pb-4">
          <DialogTitle className="sr-only">Session complete</DialogTitle>
        </DialogHeader>

        {/* Celebration */}
        <div className="flex flex-col items-center gap-3 pb-4">
          {showConfetti && (
            <div className="relative flex items-center justify-center">
              <div className="absolute h-16 w-16 animate-ping rounded-full bg-emerald-500/10" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15">
                <CheckCircle2 className="h-7 w-7 text-emerald-500" />
              </div>
            </div>
          )}

          <div className="text-center">
            <p className="text-[15px] font-semibold text-foreground">
              Session complete!
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {session.cardTitle}
            </p>
            <p className="text-[11px] text-muted-foreground/50">
              {session.boardName}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2 border-t border-border/30 pt-4">
          {/* Move to column */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between text-[13px]"
              >
                Move to column...
                <ChevronDown className="h-3.5 w-3.5 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              {columns.map((col) => (
                <DropdownMenuItem
                  key={col.id}
                  onClick={() => handleMoveTo(col.id)}
                  className="text-[13px]"
                >
                  {col.title}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Extend */}
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1 gap-1.5 text-[13px]"
              onClick={() => handleExtend(30)}
            >
              <Clock className="h-3.5 w-3.5" />
              +30 min
            </Button>
            <Button
              variant="secondary"
              className="flex-1 gap-1.5 text-[13px]"
              onClick={() => handleExtend(60)}
            >
              <Clock className="h-3.5 w-3.5" />
              +1 hour
            </Button>
          </div>

          {/* Dismiss */}
          <Button
            variant="ghost"
            className="w-full text-[13px] text-muted-foreground"
            onClick={handleDismiss}
          >
            <X className="h-3.5 w-3.5" />
            Done for now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
