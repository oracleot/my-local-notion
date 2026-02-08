import { useMemo, useCallback, useState, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  DndContext,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  getTimeBlocksForDate,
  deleteTimeBlock,
  markSkippedBlocks,
} from "@/lib/focus-helpers";
import type { TimeBlock } from "@/types";
import { TimeBlockCardOverlay } from "./time-block-card";
import { HourSlot } from "./hour-slot";

interface DayCalendarProps {
  date: string; // ISO YYYY-MM-DD
  dayStartHour: number;
  dayEndHour: number;
  onSlotClick: (hour: number) => void;
  onStartBlock: (block: TimeBlock) => void;
  onMoveBlock: (blockId: string, newHour: number) => void;
  onRescheduleBlock?: (block: TimeBlock) => void;
}

export function DayCalendar({
  date,
  dayStartHour,
  dayEndHour,
  onSlotClick,
  onStartBlock,
  onMoveBlock,
  onRescheduleBlock,
}: DayCalendarProps) {
  const blocks = useLiveQuery(() => getTimeBlocksForDate(date), [date]);
  const [draggedBlock, setDraggedBlock] = useState<TimeBlock | null>(null);

  // Reactive current hour — updates every minute alongside auto-skip
  const [currentHour, setCurrentHour] = useState(() => {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    return today === date ? now.getHours() : -1;
  });

  // Single 60s interval: auto-skip past blocks + refresh currentHour
  useEffect(() => {
    function tick() {
      markSkippedBlocks(date);
      const now = new Date();
      const today = now.toISOString().split("T")[0];
      setCurrentHour(today === date ? now.getHours() : -1);
    }
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [date]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

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
            isPast={currentHour !== -1 && hour < currentHour}
            block={blocksByHour.get(hour)}
            isDragOver={draggedBlock !== null}
            onSlotClick={() => onSlotClick(hour)}
            onStartBlock={onStartBlock}
            onDeleteBlock={handleDelete}
            onRescheduleBlock={onRescheduleBlock}
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
