import { useLiveQuery } from "dexie-react-hooks";
import { useDraggable } from "@dnd-kit/core";
import { db } from "@/lib/db";
import { useAppStore } from "@/stores/app-store";
import type { TimeBlock } from "@/types";
import { Button } from "@/components/ui/button";
import { Play, Trash2, GripVertical, RefreshCw } from "lucide-react";

interface TimeBlockCardProps {
  block: TimeBlock;
  onStart: () => void;
  onDelete: () => void;
  onReschedule?: () => void;
  isPast?: boolean;
}

export function TimeBlockCard({ block, onStart, onDelete, onReschedule, isPast }: TimeBlockCardProps) {
  const card = useLiveQuery(
    () => db.kanbanCards.get(block.cardId),
    [block.cardId]
  );
  const page = useLiveQuery(
    () => db.pages.get(block.pageId),
    [block.pageId]
  );
  const activeSession = useAppStore((s) => s.activeSession);
  const isActive = activeSession?.cardId === block.cardId;

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: block.id,
    disabled: isPast,
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        group/block flex items-center gap-2 rounded-lg border px-2.5 py-2
        transition-all duration-200
        ${isDragging ? "opacity-30" : ""}
        ${
          block.status === "completed"
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
        className="touch-none rounded p-0.5 text-muted-foreground/30 transition-colors hover:text-muted-foreground/60 cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium">
          {card?.title || "Loading..."}
        </p>
        <div className="flex items-center gap-1.5">
          {page && (
            <p className="truncate text-[10px] text-muted-foreground/60">
              {page.title || "Untitled Board"}
            </p>
          )}
          {block.status === "skipped" && (
            <span className="shrink-0 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-medium text-amber-600 dark:text-amber-400">
              Missed
            </span>
          )}
        </div>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1">
        {block.status === "skipped" && onReschedule && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 gap-1 px-2 text-[11px] text-amber-600 hover:text-amber-700 hover:bg-amber-500/10 dark:text-amber-400"
            onClick={onReschedule}
          >
            <RefreshCw className="h-3 w-3" />
            Reschedule
          </Button>
        )}

        {!isPast && block.status !== "skipped" && (
          <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover/block:opacity-100">
            {block.status !== "completed" && !isActive && !activeSession && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                onClick={onStart}
              >
                <Play className="h-3 w-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive/60 hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-3 w-3" />
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
