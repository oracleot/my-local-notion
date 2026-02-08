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
  block: TimeBlock | undefined;
  isDragOver: boolean;
  onSlotClick: () => void;
  onStartBlock: (block: TimeBlock) => void;
  onDeleteBlock: (id: string) => void;
  onRescheduleBlock?: (block: TimeBlock) => void;
}

export function HourSlot({
  hour,
  isCurrent,
  isPast,
  block,
  isDragOver,
  onSlotClick,
  onStartBlock,
  onDeleteBlock,
  onRescheduleBlock,
}: HourSlotProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `hour-${hour}`,
    data: { hour },
    disabled: isPast,
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        group relative flex min-h-[56px] transition-colors
        ${isPast ? "opacity-45 cursor-not-allowed" : ""}
        ${isOver && !isPast ? "bg-primary/10 ring-1 ring-inset ring-primary/30" : isCurrent ? "bg-primary/5" : isDragOver && !isPast ? "bg-muted/15" : isPast ? "" : "hover:bg-muted/30"}
      `}
    >
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
        {block ? (
          <TimeBlockCard
            block={block}
            onStart={() => onStartBlock(block)}
            onDelete={() => onDeleteBlock(block.id)}
            onReschedule={onRescheduleBlock ? () => onRescheduleBlock(block) : undefined}
            isPast={isPast}
          />
        ) : isPast ? (
          <div className="flex h-full min-h-[40px] w-full items-center px-2 text-[12px] text-muted-foreground/20">
            Past
          </div>
        ) : (
          <button
            onClick={onSlotClick}
            className="flex h-full min-h-[40px] w-full items-center rounded-md border border-dashed border-transparent px-2 text-[12px] text-muted-foreground/30 transition-colors hover:border-border/50 hover:text-muted-foreground/60"
          >
            + Add task
          </button>
        )}
      </div>
    </div>
  );
}
