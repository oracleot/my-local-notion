import { useFocusView } from "@/lib/use-focus-view";
import { DayCalendar } from "./day-calendar";
import { WeekCalendar } from "./week-calendar";
import { TaskPickerDialog } from "./task-picker-dialog";
import { TimeSlotPicker } from "./time-slot-picker";
import { FocusViewHeader } from "./focus-view-header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UnscheduledSidebar } from "./unscheduled-sidebar";
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
    handleTimeSlotSelected,
    handleScheduleFromSidebar,
    handleMoveBlock,
    navigateDay,
    navigateWeek,
    handleDayClickFromWeek,
    goToToday,
  } = useFocusView();

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
                onStartBlock={handleStartBlock}
                onMoveBlock={handleMoveBlock}
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

        <UnscheduledSidebar
          onSchedule={handleScheduleFromSidebar}
        />
      </div>

      {/* Dialogs */}
      <TaskPickerDialog
        open={taskPickerOpen}
        onOpenChange={setTaskPickerOpen}
        onSchedule={handleSchedule}
      />

      <TimeSlotPicker
        open={timeSlotPickerOpen}
        onOpenChange={setTimeSlotPickerOpen}
        date={selectedDate}
        dayStartHour={settings.dayStartHour}
        dayEndHour={settings.dayEndHour}
        taskTitle={pendingCard?.card.title || "Select time"}
        onSelectHour={handleTimeSlotSelected}
      />

      {activeSession && activeSession.remainingSeconds <= 0 && (
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
