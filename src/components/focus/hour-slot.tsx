import { useDroppable } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import type { TimeBlock } from "@/types";
import { TimeBlockCard } from "./time-block-card";
import { CurrentTimeIndicator } from "./current-time-indicator";

function formatHour(h: number): string {
  const suffix = h >= 12 ? "PM" : "AM";
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display} ${suffix}`;
}

/** Compute which block's time window contains the current minute */
function getActiveBlockId(
  blocks: TimeBlock[],
  currentMinute: number
): string | null {
  // Sort by order same as rendering
  const sorted = [...blocks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  let currentPos = 0;

  // Initial gap if first block starts late (and we respect it)
  if (sorted.length > 0 && sorted[0].startMinute > 0) {
    currentPos = sorted[0].startMinute;
  }

  for (const b of sorted) {
    // Respect explicit startMinute if it creates a gap; otherwise stack
    const start = Math.max(currentPos, b.startMinute);
    const end = start + b.durationMinutes;
    if (currentMinute >= start && currentMinute < end && b.status === "scheduled") {
      return b.id;
    }
    currentPos = end;
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

  // Sort blocks by order for horizontal rendering
  const sortedBlocks = [...blocks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const blockIds = sortedBlocks.map((b) => b.id);
  const activeBlockId = isCurrent ? getActiveBlockId(sortedBlocks, currentMinute) : null;

  // Build grid items (blocks + gaps)
  const renderItems: Array<{ type: 'gap' | 'block'; width: number; block?: TimeBlock }> = [];
  let currentPos = 0;

  if (sortedBlocks.length > 0) {
    // Gap before first block
    if (sortedBlocks[0].startMinute > 0) {
      renderItems.push({ type: 'gap', width: sortedBlocks[0].startMinute });
      currentPos = sortedBlocks[0].startMinute;
    }

    for (const block of sortedBlocks) {
      // Gap between previous end and current start
      const start = Math.max(currentPos, block.startMinute);
      if (start > currentPos) {
        renderItems.push({ type: 'gap', width: start - currentPos });
      }
      renderItems.push({ type: 'block', width: block.durationMinutes, block });
      currentPos = start + block.durationMinutes;
    }
  }

  // Final gap
  if (60 - currentPos > 0) {
    renderItems.push({ type: 'gap', width: 60 - currentPos });
  }

  const gridColumns = renderItems.length > 0
    ? renderItems.map((item) => `${item.width}fr`).join(" ")
    : "";

  return (
    <div
      ref={setNodeRef}
      className={`
        group relative flex min-h-[56px] transition-colors
        ${isPast ? "opacity-45 cursor-not-allowed" : ""}
        ${isOver && canAcceptDrop && !isPast ? "bg-primary/10 ring-1 ring-inset ring-primary/30" : isDragOver && canAcceptDrop && !isPast ? "bg-muted/15" : isPast ? "" : "hover:bg-muted/30"}
      `}
    >
      {isCurrent && <CurrentTimeIndicator />}

      <div
        className={`
          flex w-16 shrink-0 items-start justify-end pr-3 pt-2
          text-[11px] font-medium tabular-nums
          ${isCurrent ? "text-primary font-semibold" : "text-muted-foreground/50"}
        `}
      >
        {formatHour(hour)}
      </div>

      <div className="flex-1 pt-3 pl-3 pr-2">
        {hasBlocks ? (
          <div className="space-y-1">
            <SortableContext items={blockIds} strategy={horizontalListSortingStrategy}>
              <div
                className="grid gap-0.5"
                style={{ gridTemplateColumns: gridColumns }}
              >
                {renderItems.map((item, index) =>
                  item.type === "block" && item.block ? (
                    <TimeBlockCard
                      key={item.block.id}
                      block={item.block}
                      onStart={() => onStartBlock(item.block!)}
                      onDelete={() => onDeleteBlock(item.block!.id)}
                      isPast={isPast}
                      compact={item.block.durationMinutes < 30}
                      isActiveBlock={activeBlockId === item.block.id}
                    />
                  ) : (
                    <div key={`gap-${index}`} className="min-w-0" />
                  )
                )}
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
