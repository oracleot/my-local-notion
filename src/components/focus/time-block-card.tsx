import { useLiveQuery } from "dexie-react-hooks";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { db } from "@/lib/db";
import { isBreakBlock } from "@/lib/focus-helpers";
import { useAppStore } from "@/stores/app-store";
import type { TimeBlock } from "@/types";
import { Button } from "@/components/ui/button";
import { Play, Trash2, GripVertical, RefreshCw, Coffee } from "lucide-react";

interface TimeBlockCardProps {
  block: TimeBlock;
  onStart: () => void;
  onDelete: () => void;
  onReschedule?: () => void;
  isPast?: boolean;
  compact?: boolean;
  isActiveBlock?: boolean;
}

export function TimeBlockCard({ block, onStart, onDelete, onReschedule, isPast, compact, isActiveBlock }: TimeBlockCardProps) {
  const isBreak = isBreakBlock(block);
  const card = useLiveQuery(
    () => (isBreak ? undefined : db.kanbanCards.get(block.cardId)),
    [block.cardId, isBreak]
  );
  const page = useLiveQuery(
    () => (isBreak ? undefined : db.pages.get(block.pageId)),
    [block.pageId, isBreak]
  );
  const activeSession = useAppStore((s) => s.activeSession);
  const isActive = !isBreak && activeSession?.cardId === block.cardId;
  const isThisBlockRunning = !isBreak && activeSession?.timeBlockId === block.id;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: block.id,
    disabled: isPast,
  });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group/block flex min-w-0 items-center gap-1.5 rounded-lg border transition-all duration-200
        ${compact ? "px-2 py-1.5" : "px-3 py-2"} // Adjusted padding to ensure alignment with the red line
        ${isDragging ? "opacity-30" : ""}
        ${isActiveBlock ? "ring-2 ring-primary/50 animate-pulse" : ""}
        ${
          isBreak
            ? "border-dashed border-orange-400/30 bg-orange-500/5 text-orange-700 dark:text-orange-400"
            : block.status === "completed"
            ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400"
            : block.status === "skipped"
              ? "border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-400"
              : isActive
                ? "border-primary/30 bg-primary/8 shadow-sm"
                : "border-border/50 bg-background hover:border-border hover:shadow-sm"
        }
      `}
    >
      <button
        {...attributes}
        {...listeners}
        className="touch-none shrink-0 rounded p-0.5 text-muted-foreground/30 transition-colors hover:text-muted-foreground/60 cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-3 w-3" />
      </button>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-medium leading-tight">
          {isBreak ? "Break" : (card?.title || "Loading...")}
        </p>
        {!compact && (
          <div className="flex items-center gap-1">
            {isBreak ? (
              <div className="flex items-center gap-1 text-[9px] text-orange-600/60 dark:text-orange-400/60">
                <Coffee className="h-2.5 w-2.5" />
                <span>Rest</span>
              </div>
            ) : (
              <>
                {page && (
                  <p className="truncate text-[9px] text-muted-foreground/60">
                    {page.title || "Untitled Board"}
                  </p>
                )}
                {block.status === "skipped" && (
                  <span className="shrink-0 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[8px] font-medium text-amber-600 dark:text-amber-400">
                    Missed
                  </span>
                )}
              </>
            )}
          </div>
        )}
        {compact && !isBreak && block.status === "skipped" && (
          <span className="shrink-0 rounded-full bg-amber-500/15 px-1 py-0.5 text-[8px] font-medium text-amber-600 dark:text-amber-400">
            Missed
          </span>
        )}
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-0.5">
        {!isBreak && block.status === "skipped" && onReschedule && (
          <Button
            variant="ghost"
            size="sm"
            className="h-5 gap-0.5 px-1.5 text-[10px] text-amber-600 hover:text-amber-700 hover:bg-amber-500/10 dark:text-amber-400"
            onClick={onReschedule}
          >
            <RefreshCw className="h-2.5 w-2.5" />
            Reschedule
          </Button>
        )}

        {!isPast && block.status !== "skipped" && !isThisBlockRunning && (
          <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover/block:opacity-100">
            {!isBreak && block.status !== "completed" && !isActive && !activeSession && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                onClick={onStart}
              >
                <Play className="h-2.5 w-2.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-destructive/60 hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-2.5 w-2.5" />
            </Button>
          </div>
        )}

        <span className="shrink-0 text-[10px] font-medium text-muted-foreground/50">
          {block.durationMinutes}m
        </span>
      </div>
    </div>
  );
}

/** Lightweight overlay shown while dragging — no DB queries needed */
export function TimeBlockCardOverlay({ block }: { block: TimeBlock }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-background px-2.5 py-2 shadow-lg ring-1 ring-primary/20">
      <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40" />
      <span className="truncate text-[13px] font-medium">
        {block.cardId.slice(0, 8)}…
      </span>
      <span className="ml-auto text-[10px] font-medium text-muted-foreground/50">
        {block.durationMinutes}m
      </span>
    </div>
  );
}
