import { useFocusView } from "@/lib/use-focus-view";
import { useFocusTimer } from "@/lib/use-focus-timer";
import { DayCalendar } from "./day-calendar";
import { WeekCalendar } from "./week-calendar";
import { TaskPickerDialog } from "./task-picker-dialog";
import { TimeSlotPicker } from "./time-slot-picker";
import { DurationPickerDialog } from "./duration-picker-dialog";
import { FocusViewHeader } from "./focus-view-header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CreateTaskDialog } from "./create-task-dialog";

import { SessionCompleteDialog } from "./session-complete-dialog";
import { FocusSettingsDialog } from "./focus-settings-dialog";

export function FocusView() {
  const {
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
    createTaskOpen,
    setCreateTaskOpen,
    settings,
    setSettings,
    activeSession,
    scheduledCount,
    totalMinutes,
    // Duration picker
    durationPickerOpen,
    setDurationPickerOpen,
    pendingDuration,
    pendingBreak,
    handleSlotClick,
    handleAddBreak,
    handleCreateAndSchedule,
    handleStartBlock,
    handleSchedule,
    handleTimeSlotSelected,
    handleDurationSelected,
    handleRescheduleBlock,
    handleMoveBlock,
    navigateDay,
    navigateWeek,
    handleDayClickFromWeek,
    goToToday,
  } = useFocusView();

  const { isComplete } = useFocusTimer();

  if (!settings) return null;

  return (
    <div className="flex h-full flex-col">
      <FocusViewHeader
        view={view}
        setView={setView}
        selectedDate={selectedDate}
        weekStart={weekStart}
        scheduledCount={scheduledCount}
        totalMinutes={totalMinutes}
        onNavigateDay={navigateDay}
        onNavigateWeek={navigateWeek}
        onGoToToday={goToToday}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* Main content */}
      <div className="flex min-h-0 flex-1">
        <ScrollArea className="flex-1">
          <div className="mx-auto max-w-4xl px-4 py-2">
            {view === "day" ? (
              <DayCalendar
                date={selectedDate}
                dayStartHour={settings.dayStartHour}
                dayEndHour={settings.dayEndHour}
                onSlotClick={handleSlotClick}
                onAddBreak={handleAddBreak}
                onStartBlock={handleStartBlock}
                onMoveBlock={handleMoveBlock}
                onRescheduleBlock={handleRescheduleBlock}
              />
            ) : (
              <WeekCalendar
                weekStartDate={weekStart}
                dayStartHour={settings.dayStartHour}
                dayEndHour={settings.dayEndHour}
                onDayClick={handleDayClickFromWeek}
              />
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Dialogs */}
      <TaskPickerDialog
        open={taskPickerOpen}
        onOpenChange={setTaskPickerOpen}
        onSchedule={handleSchedule}
        onCreateNew={() => setCreateTaskOpen(true)}
      />

      <CreateTaskDialog
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
        onCreateTask={handleCreateAndSchedule}
      />

      <TimeSlotPicker
        open={timeSlotPickerOpen}
        onOpenChange={setTimeSlotPickerOpen}
        date={selectedDate}
        dayStartHour={settings.dayStartHour}
        dayEndHour={settings.dayEndHour}
        taskTitle={pendingRescheduleBlock ? "Reschedule task" : pendingCard?.card.title || "Select time"}
        onSelectHour={handleTimeSlotSelected}
      />

      <DurationPickerDialog
        open={durationPickerOpen}
        onOpenChange={setDurationPickerOpen}
        taskTitle={pendingBreak ? "Break" : (pendingDuration?.card.card.title || "Select duration")}
        availableCapacity={pendingBreak?.capacity ?? pendingDuration?.capacity ?? 60}
        presets={settings.durationPresets}
        isCurrentHour={pendingBreak?.isCurrentHour ?? pendingDuration?.isCurrentHour ?? false}
        onSelectDuration={handleDurationSelected}
      />

      {activeSession && isComplete && (
        <SessionCompleteDialog />
      )}

      <FocusSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onSettingsChange={(s) => setSettings(s)}
      />
    </div>
  );
}
