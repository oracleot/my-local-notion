import { useState, useEffect, useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  getFocusSettings, createTimeBlock, updateTimeBlock, deleteTimeBlock,
  findAvailableHour, getRemainingCapacity, createBreakBlock, type EligibleCard,
} from "@/lib/focus-helpers";
import { createCard } from "@/lib/db-helpers";
import { useAppStore } from "@/stores/app-store";
import { db } from "@/lib/db";
import type { TimeBlock, FocusSettings } from "@/types";

type ViewMode = "day" | "week";
const getToday = () => new Date().toISOString().split("T")[0];
const getMondayOfWeek = (dateStr: string) => {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  return d.toISOString().split("T")[0];
};

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
  const [pendingDuration, setPendingDuration] = useState<{
    card: EligibleCard; hour: number; capacity: number; isCurrentHour: boolean;
  } | null>(null);
  const [pendingBreak, setPendingBreak] = useState<{
    hour: number; capacity: number; isCurrentHour: boolean;
  } | null>(null);

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

  const handleSlotClick = useCallback((hour: number) => {
    setPendingHour(hour);
    setTaskPickerOpen(true);
  }, []);

  const handleAddBreak = useCallback(async (hour: number) => {
    const capacity = await getRemainingCapacity(selectedDate, hour);
    const now = new Date();
    const isToday = selectedDate === now.toISOString().split("T")[0];
    setPendingBreak({ hour, capacity, isCurrentHour: isToday && hour === now.getHours() });
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
    const capacity = await getRemainingCapacity(selectedDate, targetHour);
    const now = new Date();
    const isToday = selectedDate === now.toISOString().split("T")[0];
    setPendingDuration({ card: eligibleCard, hour: targetHour, capacity, isCurrentHour: isToday && targetHour === now.getHours() });
    setDurationPickerOpen(true);
    setPendingHour(null);
    setCreateTaskOpen(false);
    setTaskPickerOpen(false);
  }, [pendingHour, settings, selectedDate]);

  const handleStartBlock = useCallback(async (block: TimeBlock) => {
    const card = await db.kanbanCards.get(block.cardId);
    const page = await db.pages.get(block.pageId);
    if (!card || !page) return;
    startSession({ cardId: card.id, cardTitle: card.title, boardName: page.title || "Untitled Board",
      pageId: page.id, timeBlockId: block.id, durationSeconds: block.durationMinutes * 60 });
  }, [startSession]);

  const handleSchedule = useCallback(async (ec: EligibleCard) => {
    if (!settings) return;
    const targetHour = pendingHour ?? await findAvailableHour(selectedDate, settings.dayStartHour, settings.dayEndHour);
    const capacity = await getRemainingCapacity(selectedDate, targetHour);
    const now = new Date();
    const isToday = selectedDate === now.toISOString().split("T")[0];
    setPendingDuration({ card: ec, hour: targetHour, capacity, isCurrentHour: isToday && targetHour === now.getHours() });
    setDurationPickerOpen(true);
    setPendingHour(null);
    setTaskPickerOpen(false);
  }, [pendingHour, settings, selectedDate]);

  const handleScheduleWithTimePicker = useCallback((ec: EligibleCard) => {
    setPendingCard(ec);
    setTimeSlotPickerOpen(true);
  }, []);

  const handleTimeSlotSelected = useCallback(async (hour: number) => {
    if (!settings) return;
    if (pendingRescheduleBlock) {
      const capacity = await getRemainingCapacity(selectedDate, hour);
      await deleteTimeBlock(pendingRescheduleBlock.id);
      await createTimeBlock(pendingRescheduleBlock.cardId, pendingRescheduleBlock.pageId, selectedDate, hour, Math.min(settings.workMinutes, capacity));
      setPendingRescheduleBlock(null);
      setTimeSlotPickerOpen(false);
      return;
    }
    if (!pendingCard) return;
    const capacity = await getRemainingCapacity(selectedDate, hour);
    const now = new Date();
    const isToday = selectedDate === now.toISOString().split("T")[0];
    setPendingDuration({ card: pendingCard, hour, capacity, isCurrentHour: isToday && hour === now.getHours() });
    setDurationPickerOpen(true);
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
    if (!pendingDuration) return;
    await createTimeBlock(pendingDuration.card.card.id, pendingDuration.card.pageId, selectedDate, pendingDuration.hour, minutes);
    setPendingDuration(null);
    setDurationPickerOpen(false);
  }, [pendingDuration, pendingBreak, selectedDate]);

  const handleMoveBlock = useCallback(async (blockId: string, newHour: number) => {
    await updateTimeBlock(blockId, { startHour: newHour });
  }, []);

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
    pendingCard, pendingRescheduleBlock, settingsOpen, setSettingsOpen, createTaskOpen, setCreateTaskOpen, 
    settings, setSettings, activeSession, scheduledCount, totalMinutes, durationPickerOpen, setDurationPickerOpen, 
    pendingDuration, pendingBreak, handleSlotClick, handleAddBreak, handleCreateAndSchedule, handleStartBlock, 
    handleSchedule, handleScheduleWithTimePicker, handleTimeSlotSelected, handleDurationSelected, 
    handleScheduleFromSidebar: handleScheduleWithTimePicker, handleRescheduleBlock, handleMoveBlock, 
    navigateDay, navigateWeek, handleDayClickFromWeek, goToToday,
  };
}
