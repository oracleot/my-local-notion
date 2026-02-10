import { useDroppable } from "@dnd-kit/core";
import type { TimeBlock } from "@/types";
import { TimeBlockCard } from "./time-block-card";

function formatHour(h: number): string {
  const suffix = h >= 12 ? "PM" : "AM";
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display} ${suffix}`;
}

interface HourSlotProps {
  hour: number;
  isCurrent: boolean;
  isPast: boolean;
  blocks: TimeBlock[];
  remainingCapacity: number;
  currentMinute: number;
  isDragOver: boolean;
  draggedBlockDuration?: number;
  onSlotClick: () => void;
  onAddBreak: () => void;
  onStartBlock: (block: TimeBlock) => void;
  onDeleteBlock: (id: string) => void;
  onRescheduleBlock?: (block: TimeBlock) => void;
}

export function HourSlot({
  hour,
  isCurrent,
  isPast,
  blocks,
  remainingCapacity,
  currentMinute,
  isDragOver,
  draggedBlockDuration,
  onSlotClick,
  onAddBreak,
  onStartBlock,
  onDeleteBlock,
  onRescheduleBlock,
}: HourSlotProps) {
  const canAcceptDrop = draggedBlockDuration
    ? remainingCapacity >= draggedBlockDuration
    : remainingCapacity > 0;

  const { setNodeRef, isOver } = useDroppable({
    id: `hour-${hour}`,
    data: { hour },
    disabled: isPast || !canAcceptDrop,
  });

  const hasBlocks = blocks.length > 0;
  const isFull = remainingCapacity === 0;
  const elapsedPercent = isCurrent ? (currentMinute / 60) * 100 : 0;

  return (
    <div
      ref={setNodeRef}
      className={`
        group relative flex min-h-[56px] transition-colors
        ${isPast ? "opacity-45 cursor-not-allowed" : ""}
        ${isOver && canAcceptDrop && !isPast ? "bg-primary/10 ring-1 ring-inset ring-primary/30" : isCurrent ? "bg-primary/5" : isDragOver && canAcceptDrop && !isPast ? "bg-muted/15" : isPast ? "" : "hover:bg-muted/30"}
      `}
    >
      {/* Time progress indicator for current hour */}
      {isCurrent && (
        <div
          className="absolute inset-0 bg-primary/[0.03] pointer-events-none"
          style={{ width: `${elapsedPercent}%` }}
        />
      )}

      <div
        className={`
          flex w-16 shrink-0 items-start justify-end pr-3 pt-2
          text-[11px] font-medium tabular-nums
          ${isCurrent ? "text-primary font-semibold" : "text-muted-foreground/50"}
        `}
      >
        {formatHour(hour)}
      </div>

      {isCurrent && (
        <div className="absolute left-16 top-0 h-full w-0.5 bg-primary/60" />
      )}

      <div className="flex-1 py-1.5 pl-3 pr-2">
        {hasBlocks ? (
          <div className="space-y-1.5">
            {blocks.map((block) => (
              <TimeBlockCard
                key={block.id}
                block={block}
                onStart={() => onStartBlock(block)}
                onDelete={() => onDeleteBlock(block.id)}
                onReschedule={
                  onRescheduleBlock ? () => onRescheduleBlock(block) : undefined
                }
                isPast={isPast}
                compact={block.durationMinutes < 30}
              />
            ))}
            {/* Show add button if there's remaining capacity */}
            {!isPast && !isFull && (
              <div className="flex gap-1.5">
                <button
                  onClick={onSlotClick}
                  className="flex h-7 flex-1 items-center justify-center rounded-md border border-dashed border-border/30 text-[11px] text-muted-foreground/40 transition-colors hover:border-border/50 hover:text-muted-foreground/60"
                >
                  + Add task ({remainingCapacity}m)
                </button>
                <button
                  onClick={onAddBreak}
                  className="flex h-7 px-3 items-center justify-center rounded-md border border-dashed border-orange-400/30 text-[11px] text-orange-600/50 transition-colors hover:border-orange-400/50 hover:text-orange-600/70 dark:text-orange-400/50 dark:hover:text-orange-400/70"
                >
                  + Break
                </button>
              </div>
            )}
          </div>
        ) : isPast ? (
          <div className="flex h-full min-h-[40px] w-full items-center px-2 text-[12px] text-muted-foreground/20">
            Past
          </div>
        ) : (
          <div className="flex gap-1.5">
            <button
              onClick={onSlotClick}
              className="flex h-full min-h-[40px] flex-1 items-center rounded-md border border-dashed border-transparent px-2 text-[12px] text-muted-foreground/30 transition-colors hover:border-border/50 hover:text-muted-foreground/60"
            >
              + Add task
            </button>
            <button
              onClick={onAddBreak}
              className="flex h-full min-h-[40px] px-3 items-center rounded-md border border-dashed border-transparent text-[12px] text-orange-600/40 transition-colors hover:border-orange-400/50 hover:text-orange-600/60 dark:text-orange-400/40 dark:hover:text-orange-400/60"
            >
              + Break
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
