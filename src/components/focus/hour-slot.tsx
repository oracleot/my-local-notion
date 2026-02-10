import { useDroppable } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import type { TimeBlock } from "@/types";
import { TimeBlockCard } from "./time-block-card";

function formatHour(h: number): string {
  const suffix = h >= 12 ? "PM" : "AM";
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display} ${suffix}`;
}

/** Compute which block's time window contains the current minute */
function getActiveBlockId(
  blocks: TimeBlock[],
  currentMinute: number,
  startOffset: number
): string | null {
  let offset = startOffset;
  for (const b of blocks) {
    const end = offset + b.durationMinutes;
    if (currentMinute >= offset && currentMinute < end && b.status === "scheduled") {
      return b.id;
    }
    offset = end;
  }
  return null;
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

  // Sort blocks by order for horizontal rendering
  const sortedBlocks = [...blocks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const blockIds = sortedBlocks.map((b) => b.id);
  const startOffset = sortedBlocks[0]?.startMinute ?? 0;
  const activeBlockId = isCurrent ? getActiveBlockId(sortedBlocks, currentMinute, startOffset) : null;

  const totalBlockMinutes = sortedBlocks.reduce((sum, b) => sum + b.durationMinutes, 0);
  const remainingMinutes = 60 - startOffset - totalBlockMinutes;
  const gridColumns = sortedBlocks.length > 0
    ? [
        ...(startOffset > 0 ? [`${startOffset}fr`] : []),
        ...sortedBlocks.map((block) => `${block.durationMinutes}fr`),
        ...(remainingMinutes > 0 ? [`${remainingMinutes}fr`] : []),
      ].join(" ")
    : "";

  return (
    <div
      ref={setNodeRef}
      className={`
        group relative flex min-h-[56px] transition-colors
        ${isPast ? "opacity-45 cursor-not-allowed" : ""}
        ${isOver && canAcceptDrop && !isPast ? "bg-primary/10 ring-1 ring-inset ring-primary/30" : isCurrent ? "bg-primary/5" : isDragOver && canAcceptDrop && !isPast ? "bg-muted/15" : isPast ? "" : "hover:bg-muted/30"}
      `}
    >
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

      {isCurrent && (
        <div
          className="absolute top-[6px] h-[34px] w-[3px] bg-red-300 pointer-events-none z-10 rounded-full"
          style={{ left: `calc(4rem + 0.75rem + (100% - 4rem - 0.75rem - 0.5rem) * ${currentMinute / 60})` }}
        />
      )}

      <div className="flex-1 py-2 pl-3 pr-2">
        {hasBlocks ? (
          <div className="space-y-1">
            <SortableContext items={blockIds} strategy={horizontalListSortingStrategy}>
              <div
                className="grid gap-0.5"
                style={{ gridTemplateColumns: gridColumns }}
              >
                {startOffset > 0 && <div className="min-w-0" />}
                {sortedBlocks.map((block) => (
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
                    isActiveBlock={activeBlockId === block.id}
                  />
                ))}
                {remainingMinutes > 0 && <div className="min-w-0" />}
              </div>
            </SortableContext>
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
