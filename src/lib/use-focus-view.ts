import { useState, useEffect, useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  getFocusSettings, createTimeBlock, deleteTimeBlock,
  findAvailableHour, createBreakBlock, getEffectiveBlockTime, type EligibleCard,
} from "@/lib/focus-helpers";
import { formatClockTime, getHourContext, getMondayOfWeek, getToday, moveBlockToHour } from "@/lib/focus-view-utils";
import { createCard } from "@/lib/db-helpers";
import { useAppStore } from "@/stores/app-store";
import { db } from "@/lib/db";
import type { TimeBlock, FocusSettings } from "@/types";
import { toast } from "sonner";

type ViewMode = "day" | "week";

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
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [durationPickerOpen, setDurationPickerOpen] = useState(false);
  const [pendingDuration, setPendingDuration] = useState<{ card: EligibleCard; hour: number; capacity: number; isCurrentHour: boolean } | null>(null);
  const [pendingBreak, setPendingBreak] = useState<{ hour: number; capacity: number; isCurrentHour: boolean } | null>(null);
  const [pendingRescheduleDuration, setPendingRescheduleDuration] = useState<{ block: TimeBlock; hour: number; capacity: number; isCurrentHour: boolean } | null>(null);

  const activeSession = useAppStore((s) => s.activeSession);
  const startSession = useAppStore((s) => s.startSession);
  const loadFocusSettings = useAppStore((s) => s.loadFocusSettings);

  useEffect(() => {
    getFocusSettings().then((s) => {
      setSettings(s);
      loadFocusSettings({ workMinutes: s.workMinutes, breakMinutes: s.breakMinutes, audioEnabled: s.audioEnabled });
    });
  }, [loadFocusSettings]);

  const todayBlocks = useLiveQuery(() => db.timeBlocks.where("date").equals(getToday()).toArray(), []);
  const scheduledCount = todayBlocks?.length ?? 0;
  const totalMinutes = todayBlocks?.reduce((sum, b) => sum + b.durationMinutes, 0) ?? 0;

  const handleSlotClick = useCallback((hour: number) => { setPendingHour(hour); setTaskPickerOpen(true); }, []);

  const handleAddBreak = useCallback(async (hour: number) => {
    const context = await getHourContext(selectedDate, hour);
    setPendingBreak(context);
    setDurationPickerOpen(true);
  }, [selectedDate]);

  const handleCreateAndSchedule = useCallback(async (title: string, pageId: string, columnId: string) => {
    if (!settings) return;
    const card = await createCard(pageId, columnId, title);
    const page = await db.pages.get(pageId);
    if (!page) return;
    
    // Find first available column
    const column = page.columns.find((c) => c.id === columnId);
    if (!column) return;

    const eligibleCard: EligibleCard = {
      card,
      boardName: page.title || "Untitled Board",
      columnName: column.title,
      pageId,
    };

    // Proceed to schedule the new card
    const targetHour = pendingHour ?? await findAvailableHour(selectedDate, settings.dayStartHour, settings.dayEndHour);
    const context = await getHourContext(selectedDate, targetHour);
    setPendingDuration({ card: eligibleCard, ...context });
    setPendingHour(null);
    setCreateTaskOpen(false);
    setTaskPickerOpen(false);
  }, [pendingHour, settings, selectedDate]);

  const handleStartBlock = useCallback(async (block: TimeBlock) => {
    const card = await db.kanbanCards.get(block.cardId);
    const page = await db.pages.get(block.pageId);
    if (!card || !page) return;
    const effectiveTime = await getEffectiveBlockTime(block);
    if (!effectiveTime) {
      toast("Unable to determine the scheduled time for this block.");
      return;
    }

    const now = Date.now();
    const originalSeconds = block.durationMinutes * 60;
    const adjustedSeconds = Math.floor((effectiveTime.end.getTime() - now) / 1000);
    const finalSeconds = Math.min(originalSeconds, adjustedSeconds);

    if (finalSeconds <= 0) {
      toast("This scheduled session has already ended.");
      return;
    }

    if (finalSeconds < originalSeconds) {
      const adjustedMinutes = Math.ceil(finalSeconds / 60);
      toast(`Session adjusted to ${adjustedMinutes}m to match scheduled end time (${formatClockTime(effectiveTime.end)}).`);
    }

    startSession({
      cardId: card.id,
      cardTitle: card.title,
      boardName: page.title || "Untitled Board",
      pageId: page.id,
      timeBlockId: block.id,
      durationSeconds: finalSeconds,
    });
  }, [startSession]);

  const handleSchedule = useCallback(async (ec: EligibleCard) => {
    if (!settings) return;
    const targetHour = pendingHour ?? await findAvailableHour(selectedDate, settings.dayStartHour, settings.dayEndHour);
    const context = await getHourContext(selectedDate, targetHour);
    setPendingDuration({ card: ec, ...context });
    setPendingHour(null);
    setTaskPickerOpen(false);
  }, [pendingHour, settings, selectedDate]);

  // Deferred duration picker: open after task picker / create dialog / time slot picker has closed
  useEffect(() => {
    if ((pendingDuration || pendingRescheduleDuration) && !taskPickerOpen && !createTaskOpen && !timeSlotPickerOpen && !durationPickerOpen) {
      const timer = setTimeout(() => setDurationPickerOpen(true), 150);
      return () => clearTimeout(timer);
    }
  }, [pendingDuration, pendingRescheduleDuration, taskPickerOpen, createTaskOpen, timeSlotPickerOpen, durationPickerOpen]);

  const handleScheduleWithTimePicker = useCallback((ec: EligibleCard) => { setPendingCard(ec); setTimeSlotPickerOpen(true); }, []);

  const handleTimeSlotSelected = useCallback(async (hour: number) => {
    if (!settings) return;
    if (pendingRescheduleBlock) {
      const context = await getHourContext(selectedDate, hour);
      setPendingRescheduleDuration({ block: pendingRescheduleBlock, ...context });
      setPendingRescheduleBlock(null);
      setTimeSlotPickerOpen(false);
      return;
    }
    if (!pendingCard) return;
    const context = await getHourContext(selectedDate, hour);
    setPendingDuration({ card: pendingCard, ...context });
    setPendingCard(null);
    setTimeSlotPickerOpen(false);
  }, [pendingCard, pendingRescheduleBlock, settings, selectedDate]);

  const handleDurationSelected = useCallback(async (minutes: number) => {
    if (pendingBreak) {
      await createBreakBlock(selectedDate, pendingBreak.hour, minutes);
      setPendingBreak(null);
      setDurationPickerOpen(false);
      return;
    }
    if (pendingRescheduleDuration) {
      await deleteTimeBlock(pendingRescheduleDuration.block.id);
      await createTimeBlock(pendingRescheduleDuration.block.cardId, pendingRescheduleDuration.block.pageId, selectedDate, pendingRescheduleDuration.hour, minutes);
      setPendingRescheduleDuration(null);
      setDurationPickerOpen(false);
      return;
    }
    if (!pendingDuration) return;
    await createTimeBlock(pendingDuration.card.card.id, pendingDuration.card.pageId, selectedDate, pendingDuration.hour, minutes);
    setPendingDuration(null);
    setDurationPickerOpen(false);
  }, [pendingDuration, pendingBreak, pendingRescheduleDuration, selectedDate]);

  const handleMoveBlock = useCallback(async (blockId: string, newHour: number) => { await moveBlockToHour(blockId, newHour, selectedDate); }, [selectedDate]);

  const navigateDay = useCallback((delta: number) => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split("T")[0]);
  }, [selectedDate]);

  const navigateWeek = useCallback((delta: number) => {
    const d = new Date(weekStart + "T00:00:00");
    d.setDate(d.getDate() + delta * 7);
    setWeekStart(d.toISOString().split("T")[0]);
  }, [weekStart]);

  const handleDayClickFromWeek = useCallback((date: string) => { setSelectedDate(date); setView("day"); }, []);
  const goToToday = useCallback(() => { setSelectedDate(getToday()); setWeekStart(getMondayOfWeek(getToday())); }, []);
  const handleRescheduleBlock = useCallback((block: TimeBlock) => { setPendingRescheduleBlock(block); setPendingCard(null); setTimeSlotPickerOpen(true); }, []);

  return {
    view, setView, selectedDate, weekStart, taskPickerOpen, setTaskPickerOpen, timeSlotPickerOpen, setTimeSlotPickerOpen,
    pendingCard, pendingRescheduleBlock, settingsOpen, setSettingsOpen, createTaskOpen, setCreateTaskOpen, settings, setSettings,
    activeSession, scheduledCount, totalMinutes, durationPickerOpen, setDurationPickerOpen, pendingDuration, pendingBreak,
    pendingRescheduleDuration, handleSlotClick, handleAddBreak, handleCreateAndSchedule, handleStartBlock, handleSchedule,
    handleScheduleWithTimePicker, handleTimeSlotSelected, handleDurationSelected,
    handleScheduleFromSidebar: handleScheduleWithTimePicker, handleRescheduleBlock, handleMoveBlock,
    navigateDay, navigateWeek, handleDayClickFromWeek, goToToday,
  };
}
