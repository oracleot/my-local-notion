import { useMemo, useCallback, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  DndContext,
  DragOverlay,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  getTimeBlocksForDate,
  deleteTimeBlock,
} from "@/lib/focus-helpers";
import type { TimeBlock } from "@/types";
import { TimeBlockCard, TimeBlockCardOverlay } from "./time-block-card";

interface DayCalendarProps {
  date: string; // ISO YYYY-MM-DD
  dayStartHour: number;
  dayEndHour: number;
  onSlotClick: (hour: number) => void;
  onStartBlock: (block: TimeBlock) => void;
  onMoveBlock: (blockId: string, newHour: number) => void;
}

function formatHour(h: number): string {
  const suffix = h >= 12 ? "PM" : "AM";
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display} ${suffix}`;
}

export function DayCalendar({
  date,
  dayStartHour,
  dayEndHour,
  onSlotClick,
  onStartBlock,
  onMoveBlock,
}: DayCalendarProps) {
  const blocks = useLiveQuery(() => getTimeBlocksForDate(date), [date]);
  const [draggedBlock, setDraggedBlock] = useState<TimeBlock | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const currentHour = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    return today === date ? now.getHours() : -1;
  }, [date]);

  const hours = useMemo(() => {
    const arr: number[] = [];
    for (let h = dayStartHour; h < dayEndHour; h++) arr.push(h);
    return arr;
  }, [dayStartHour, dayEndHour]);

  const blocksByHour = useMemo(() => {
    const map = new Map<number, TimeBlock>();
    for (const b of blocks ?? []) map.set(b.startHour, b);
    return map;
  }, [blocks]);

  const handleDelete = useCallback(async (blockId: string) => {
    await deleteTimeBlock(blockId);
  }, []);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const id = event.active.id as string;
      const block = (blocks ?? []).find((b) => b.id === id) ?? null;
      setDraggedBlock(block);
    },
    [blocks]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setDraggedBlock(null);
      const { active, over } = event;
      if (!over) return;
      const blockId = active.id as string;
      const targetHour = over.data.current?.hour as number | undefined;
      if (targetHour === undefined) return;
      const block = (blocks ?? []).find((b) => b.id === blockId);
      if (block && block.startHour !== targetHour) {
        onMoveBlock(blockId, targetHour);
      }
    },
    [blocks, onMoveBlock]
  );

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col divide-y divide-border/30">
        {hours.map((hour) => (
          <HourSlot
            key={hour}
            hour={hour}
            isCurrent={hour === currentHour}
            block={blocksByHour.get(hour)}
            isDragOver={draggedBlock !== null}
            onSlotClick={() => onSlotClick(hour)}
            onStartBlock={onStartBlock}
            onDeleteBlock={handleDelete}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
        {draggedBlock ? (
          <TimeBlockCardOverlay block={draggedBlock} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function HourSlot({
  hour,
  isCurrent,
  block,
  isDragOver,
  onSlotClick,
  onStartBlock,
  onDeleteBlock,
}: {
  hour: number;
  isCurrent: boolean;
  block: TimeBlock | undefined;
  isDragOver: boolean;
  onSlotClick: () => void;
  onStartBlock: (block: TimeBlock) => void;
  onDeleteBlock: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `hour-${hour}`,
    data: { hour },
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        group relative flex min-h-[56px] transition-colors
        ${isOver ? "bg-primary/10 ring-1 ring-inset ring-primary/30" : isCurrent ? "bg-primary/5" : isDragOver ? "bg-muted/15" : "hover:bg-muted/30"}
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
          />
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
