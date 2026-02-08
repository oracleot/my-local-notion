import { useLiveQuery } from "dexie-react-hooks";
import { useDraggable } from "@dnd-kit/core";
import { db } from "@/lib/db";
import { useAppStore } from "@/stores/app-store";
import type { TimeBlock } from "@/types";
import { Button } from "@/components/ui/button";
import { Play, Trash2, GripVertical } from "lucide-react";

interface TimeBlockCardProps {
  block: TimeBlock;
  onStart: () => void;
  onDelete: () => void;
}

export function TimeBlockCard({ block, onStart, onDelete }: TimeBlockCardProps) {
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
        {page && (
          <p className="truncate text-[10px] text-muted-foreground/60">
            {page.title || "Untitled Board"}
          </p>
        )}
      </div>

      <span className="shrink-0 text-[10px] font-medium text-muted-foreground/50">
        {block.durationMinutes}m
      </span>

      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/block:opacity-100">
        {block.status !== "completed" && !isActive && (
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
