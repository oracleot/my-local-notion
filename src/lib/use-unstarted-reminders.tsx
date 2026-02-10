import { useEffect, useRef } from "react";
import { db } from "@/lib/db";
import { useAppStore } from "@/stores/app-store";
import { getFocusSettings } from "@/lib/focus-helpers";
import { showReminderToast, loadNotificationHistory, saveNotificationHistory } from "@/lib/reminder-utils";

/**
 * Hook that polls for unstarted scheduled tasks in the current hour block
 * and displays reminder notifications every N minutes (configurable).
 * 
 * Only shows reminders when:
 * - Not in Zen mode
 * - Task is scheduled for the current hour
 * - Task hasn't been started (no active session)
 * - Enough time has passed since last notification
 */
export function useUnstartedTaskReminders() {
  const zenMode = useAppStore((s) => s.zenMode);
  const activeSession = useAppStore((s) => s.activeSession);
  const startSession = useAppStore((s) => s.startSession);
  const lastNotifiedAt = useRef(loadNotificationHistory());

  useEffect(() => {
    const checkUnstartedTasks = async () => {
      if (zenMode) return;

      try {
        const settings = await getFocusSettings();
        const reminderInterval = settings.reminderIntervalMinutes ?? 5;
        const audioEnabled = settings.audioEnabled ?? true;
        if (reminderInterval === 0) return;

        const now = new Date();
        const today = now.toISOString().split("T")[0];
        const currentHour = now.getHours();

        const blocks = await db.timeBlocks
          .where("date")
          .equals(today)
          .filter((b) => b.status === "scheduled" && b.startHour === currentHour)
          .toArray();

        // Sort by order for position-aware reminders
        const sortedBlocks = [...blocks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        // Find the block whose effective time window contains the current minute
        const currentMinuteNow = now.getMinutes();
        let offset = 0;
        let activeBlock: typeof blocks[0] | null = null;
        for (const block of sortedBlocks) {
          const blockEnd = offset + block.durationMinutes;
          if (currentMinuteNow >= offset && currentMinuteNow < blockEnd) {
            activeBlock = block;
            break;
          }
          offset = blockEnd;
        }

        const blocksToRemind = activeBlock ? [activeBlock] : [];

        for (const block of blocksToRemind) {
          if (activeSession?.cardId === block.cardId || activeSession?.timeBlockId === block.id) {
            continue;
          }

          const lastNotified = lastNotifiedAt.current.get(block.id) ?? 0;
          const timeSinceLastNotification = (Date.now() - lastNotified) / 1000 / 60;
          if (timeSinceLastNotification < reminderInterval) continue;

          const card = await db.kanbanCards.get(block.cardId);
          const page = await db.pages.get(block.pageId);
          if (!card || !page) continue;

          showReminderToast(block, card, page.title || "Untitled Board", startSession, audioEnabled);
          
          const timestamp = Date.now();
          lastNotifiedAt.current.set(block.id, timestamp);
          saveNotificationHistory(lastNotifiedAt.current);
        }
      } catch (error) {
        console.error("Error checking unstarted tasks:", error);
      }
    };

    checkUnstartedTasks();
    const intervalId = setInterval(checkUnstartedTasks, 60 * 1000);
    return () => { clearInterval(intervalId); };
  }, [zenMode, activeSession, startSession]);
}
