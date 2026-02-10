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
  getRemainingCapacity,
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

  // Reactive current hour and minute — updates every minute alongside auto-skip
  const [currentHour, setCurrentHour] = useState(() => {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    return today === date ? now.getHours() : -1;
  });
  const [currentMinute, setCurrentMinute] = useState(() => new Date().getMinutes());

  // Single 60s interval: auto-skip past blocks + refresh currentHour/currentMinute
  useEffect(() => {
    function tick() {
      markSkippedBlocks(date);
      const now = new Date();
      const today = now.toISOString().split("T")[0];
      setCurrentHour(today === date ? now.getHours() : -1);
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
      const usedMinutes = hourBlocks.reduce((sum, b) => sum + b.durationMinutes, 0);
      let remaining = 60 - usedMinutes;

      // For current hour, cap by elapsed time
      if (isToday && h === currentHour) {
        remaining = Math.min(remaining, 60 - currentMinute);
      }

      map.set(h, Math.max(0, remaining));
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
      const targetHour = over.data.current?.hour as number | undefined;
      if (targetHour === undefined) return;
      if (droppedBlock.startHour === targetHour) return;

      // Verify capacity at target (account for the block being temporarily removed from source)
      const capacity = await getRemainingCapacity(date, targetHour);
      if (droppedBlock.durationMinutes > capacity) return;

      onMoveBlock(blockId, targetHour);
    },
    [draggedBlock, onMoveBlock, date]
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
            blocks={blocksByHour.get(hour) ?? []}
            remainingCapacity={capacityByHour.get(hour) ?? 60}
            currentMinute={hour === currentHour ? currentMinute : 0}
            isDragOver={draggedBlock !== null}
            draggedBlockDuration={draggedBlock?.durationMinutes}
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
