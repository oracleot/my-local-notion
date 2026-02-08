import { useState, useEffect, useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  getFocusSettings,
  createTimeBlock,
  updateTimeBlock,
  deleteTimeBlock,
  findAvailableHour,
  type EligibleCard,
} from "@/lib/focus-helpers";
import { useAppStore } from "@/stores/app-store";
import { db } from "@/lib/db";
import type { TimeBlock, FocusSettings } from "@/types";

type ViewMode = "day" | "week";

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function getMondayOfWeek(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

export function useFocusView() {
  const [view, setView] = useState<ViewMode>("day");
  const [selectedDate, setSelectedDate] = useState(getToday);
  const [weekStart, setWeekStart] = useState(() => getMondayOfWeek(getToday()));
  const [taskPickerOpen, setTaskPickerOpen] = useState(false);
  const [pendingHour, setPendingHour] = useState<number | null>(null);
  const [pendingCard, setPendingCard] = useState<EligibleCard | null>(null);
  const [pendingRescheduleBlock, setPendingRescheduleBlock] = useState<TimeBlock | null>(null);
  const [timeSlotPickerOpen, setTimeSlotPickerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<FocusSettings | null>(null);

  const activeSession = useAppStore((s) => s.activeSession);
  const startSession = useAppStore((s) => s.startSession);
  const loadFocusSettings = useAppStore((s) => s.loadFocusSettings);

  useEffect(() => {
    getFocusSettings().then((s) => {
      setSettings(s);
      loadFocusSettings({
        workMinutes: s.workMinutes,
        breakMinutes: s.breakMinutes,
        audioEnabled: s.audioEnabled,
      });
    });
  }, [loadFocusSettings]);

  const todayBlocks = useLiveQuery(
    () => db.timeBlocks.where("date").equals(getToday()).toArray(),
    []
  );

  const scheduledCount = todayBlocks?.length ?? 0;
  const totalMinutes =
    todayBlocks?.reduce((sum, b) => sum + b.durationMinutes, 0) ?? 0;

  const handleSlotClick = useCallback((hour: number) => {
    setPendingHour(hour);
    setTaskPickerOpen(true);
  }, []);

  const handleStartBlock = useCallback(
    async (block: TimeBlock) => {
      const card = await db.kanbanCards.get(block.cardId);
      const page = await db.pages.get(block.pageId);
      if (!card || !page) return;
      startSession({
        cardId: card.id,
        cardTitle: card.title,
        boardName: page.title || "Untitled Board",
        pageId: page.id,
        timeBlockId: block.id,
        durationSeconds: block.durationMinutes * 60,
      });
    },
    [startSession]
  );

  const handleSchedule = useCallback(
    async (ec: EligibleCard) => {
      if (!settings) return;
      
      const targetHour = pendingHour ?? await findAvailableHour(
        selectedDate,
        settings.dayStartHour,
        settings.dayEndHour
      );
      
      await createTimeBlock(ec.card.id, ec.pageId, selectedDate, targetHour, settings.workMinutes);
      setPendingHour(null);
      setTaskPickerOpen(false);
    },
    [pendingHour, settings, selectedDate]
  );

  const handleScheduleWithTimePicker = useCallback((ec: EligibleCard) => {
    // Open time slot picker for user to choose hour
    setPendingCard(ec);
    setTimeSlotPickerOpen(true);
  }, []);

  const handleTimeSlotSelected = useCallback(async (hour: number) => {
    if (!settings) return;

    // If rescheduling, delete old block first
    if (pendingRescheduleBlock) {
      await deleteTimeBlock(pendingRescheduleBlock.id);
      await createTimeBlock(
        pendingRescheduleBlock.cardId,
        pendingRescheduleBlock.pageId,
        selectedDate,
        hour,
        settings.workMinutes
      );
      setPendingRescheduleBlock(null);
      setTimeSlotPickerOpen(false);
      return;
    }

    if (!pendingCard) return;
    const dur = settings.workMinutes;
    await createTimeBlock(pendingCard.card.id, pendingCard.pageId, selectedDate, hour, dur);
    setPendingCard(null);
    setTimeSlotPickerOpen(false);
  }, [pendingCard, pendingRescheduleBlock, settings, selectedDate]);

  const handleMoveBlock = useCallback(
    async (blockId: string, newHour: number) => {
      await updateTimeBlock(blockId, { startHour: newHour });
    },
    []
  );

  const navigateDay = useCallback(
    (delta: number) => {
      const d = new Date(selectedDate + "T00:00:00");
      d.setDate(d.getDate() + delta);
      setSelectedDate(d.toISOString().split("T")[0]);
    },
    [selectedDate]
  );

  const navigateWeek = useCallback(
    (delta: number) => {
      const d = new Date(weekStart + "T00:00:00");
      d.setDate(d.getDate() + delta * 7);
      setWeekStart(d.toISOString().split("T")[0]);
    },
    [weekStart]
  );

  const handleDayClickFromWeek = useCallback((date: string) => {
    setSelectedDate(date);
    setView("day");
  }, []);

  const goToToday = useCallback(() => {
    setSelectedDate(getToday());
    setWeekStart(getMondayOfWeek(getToday()));
  }, []);

  const handleRescheduleBlock = useCallback((block: TimeBlock) => {
    setPendingRescheduleBlock(block);
    setPendingCard(null);
    setTimeSlotPickerOpen(true);
  }, []);

  const handleScheduleFromSidebar = useCallback((ec: EligibleCard) => {
    // Open time slot picker for user to choose hour
    handleScheduleWithTimePicker(ec);
  }, [handleScheduleWithTimePicker]);

  return {
    view,
    setView,
    selectedDate,
    weekStart,
    taskPickerOpen,
    setTaskPickerOpen,
    timeSlotPickerOpen,
    setTimeSlotPickerOpen,
    pendingCard,
    pendingRescheduleBlock,
    settingsOpen,
    setSettingsOpen,
    settings,
    setSettings,
    activeSession,
    scheduledCount,
    totalMinutes,
    handleSlotClick,
    handleStartBlock,
    handleSchedule,
    handleScheduleWithTimePicker,
    handleTimeSlotSelected,
    handleScheduleFromSidebar,
    handleRescheduleBlock,
    handleMoveBlock,
    navigateDay,
    navigateWeek,
    handleDayClickFromWeek,
    goToToday,
  };
}
