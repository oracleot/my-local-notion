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
  closestCenter,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import {
  getTimeBlocksForDate,
  deleteTimeBlock,
  markSkippedBlocks,
  getRemainingCapacity,
  reorderBlocksInHour,
  calculateEffectiveEnd,
} from "@/lib/focus-helpers";
import type { TimeBlock } from "@/types";
import { TimeBlockCardOverlay } from "./time-block-card";
import { HourSlot } from "./hour-slot";

interface DayCalendarProps {
  date: string; // ISO YYYY-MM-DD
  dayStartHour: number;
  dayEndHour: number;
  onSlotClick: (hour: number) => void;
  onAddBreak: (hour: number) => void;
  onStartBlock: (block: TimeBlock) => void;
  onMoveBlock: (blockId: string, newHour: number) => void;
  onRescheduleBlock?: (block: TimeBlock) => void;
}

export function DayCalendar({
  date,
  dayStartHour,
  dayEndHour,
  onSlotClick,
  onAddBreak,
  onStartBlock,
  onMoveBlock,
}: DayCalendarProps) {
  const blocks = useLiveQuery(() => getTimeBlocksForDate(date), [date]);
  const [draggedBlock, setDraggedBlock] = useState<TimeBlock | null>(null);

  // Reactive current hour and minute — updates every minute alongside auto-skip
  const [currentHour, setCurrentHour] = useState(() => {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    return today === date ? now.getHours() : -1;
  });
  const [currentMinute, setCurrentMinute] = useState(() => new Date().getMinutes());

  // Efficient 1-minute tick for hour/minute updates and cleaning up skipped blocks
  useEffect(() => {
    function tick() {
      markSkippedBlocks(date);
      const now = new Date();
      setCurrentHour(now.toISOString().split("T")[0] === date ? now.getHours() : -1);
      setCurrentMinute(now.getMinutes());
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

  // Group blocks by hour (1:many)
  const blocksByHour = useMemo(() => {
    const map = new Map<number, TimeBlock[]>();
    for (let h = dayStartHour; h < dayEndHour; h++) {
      map.set(h, []);
    }
    for (const b of blocks ?? []) {
      const hourBlocks = map.get(b.startHour) ?? [];
      hourBlocks.push(b);
      map.set(b.startHour, hourBlocks);
    }
    return map;
  }, [blocks, dayStartHour, dayEndHour]);

  // Calculate remaining capacity per hour
  const capacityByHour = useMemo(() => {
    const map = new Map<number, number>();
    const today = new Date().toISOString().split("T")[0];
    const isToday = date === today;

    for (let h = dayStartHour; h < dayEndHour; h++) {
      const hourBlocks = blocksByHour.get(h) ?? [];
      const effectiveEnd = calculateEffectiveEnd(hourBlocks);
      const isCurrent = isToday && h === currentHour;
      
      const nextStart = isCurrent ? Math.max(currentMinute, effectiveEnd) : effectiveEnd;
      map.set(h, Math.max(0, 60 - nextStart));
    }
    return map;
  }, [blocksByHour, date, currentHour, currentMinute, dayStartHour, dayEndHour]);

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
    async (event: DragEndEvent) => {
      const droppedBlock = draggedBlock;
      setDraggedBlock(null);
      const { active, over } = event;
      if (!over || !droppedBlock) return;
      const blockId = active.id as string;
      const overId = over.id as string;

      // Check if dropped on an hour slot (cross-hour move)
      const targetHour = over.data.current?.hour as number | undefined;

      if (targetHour !== undefined) {
        // Cross-hour move: dropped on a different hour droppable
        if (droppedBlock.startHour === targetHour) return;
        const capacity = await getRemainingCapacity(date, targetHour);
        if (droppedBlock.durationMinutes > capacity) return;
        onMoveBlock(blockId, targetHour);
        return;
      }

      // Intra-hour reorder: dropped on another block within the same hour
      const overBlock = (blocks ?? []).find((b) => b.id === overId);
      if (!overBlock || overBlock.startHour !== droppedBlock.startHour) return;
      if (blockId === overId) return;

      const hour = droppedBlock.startHour;
      const hourBlocks = [...(blocksByHour.get(hour) ?? [])].sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0)
      );
      const ids = hourBlocks.map((b) => b.id);
      const oldIndex = ids.indexOf(blockId);
      const newIndex = ids.indexOf(overId);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(ids, oldIndex, newIndex);
      await reorderBlocksInHour(reordered);
    },
    [draggedBlock, onMoveBlock, date, blocks, blocksByHour]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
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
            blocks={blocksByHour.get(hour) ?? []}
            remainingCapacity={capacityByHour.get(hour) ?? 60}
            currentMinute={hour === currentHour ? currentMinute : 0}
            isDragOver={draggedBlock !== null}
            draggedBlockDuration={draggedBlock?.durationMinutes}
            onSlotClick={() => onSlotClick(hour)}
            onAddBreak={() => onAddBreak(hour)}
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
