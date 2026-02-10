import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { useAppStore } from "@/stores/app-store";
import { getFocusSettings } from "@/lib/focus-helpers";
import type { TimeBlock, KanbanCard } from "@/types";

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
  const lastNotifiedAt = useRef(new Map<string, number>());

  useEffect(() => {
    const checkUnstartedTasks = async () => {
      // Skip if in Zen mode
      if (zenMode) return;

      try {
        const settings = await getFocusSettings();
        const reminderInterval = settings.reminderIntervalMinutes ?? 5;
        
        // If reminders disabled (0), skip
        if (reminderInterval === 0) return;

        const now = new Date();
        const today = now.toISOString().split("T")[0];
        const currentHour = now.getHours();

        // Get all scheduled blocks for today in the current hour
        const blocks = await db.timeBlocks
          .where("date")
          .equals(today)
          .filter((b) => b.status === "scheduled" && b.startHour === currentHour)
          .toArray();

        for (const block of blocks) {
          // Skip if there's an active session for this task
          if (activeSession?.cardId === block.cardId || activeSession?.timeBlockId === block.id) {
            continue;
          }

          // Check if enough time has passed since last notification
          const lastNotified = lastNotifiedAt.current.get(block.id) ?? 0;
          const timeSinceLastNotification = (Date.now() - lastNotified) / 1000 / 60; // minutes

          if (timeSinceLastNotification < reminderInterval) {
            continue;
          }

          // Get card and page details for the toast
          const card = await db.kanbanCards.get(block.cardId);
          const page = await db.pages.get(block.pageId);

          if (!card || !page) continue;

          // Show reminder toast
          showReminderToast(block, card, page.title || "Untitled Board", startSession);
          
          // Update last notification time
          lastNotifiedAt.current.set(block.id, Date.now());
        }
      } catch (error) {
        console.error("Error checking unstarted tasks:", error);
      }
    };

    // Run check immediately, then every 60 seconds
    checkUnstartedTasks();
    const intervalId = setInterval(checkUnstartedTasks, 60 * 1000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [zenMode, activeSession, startSession]);
}

/**
 * Show a toast notification for an unstarted task
 */
function showReminderToast(
  block: TimeBlock,
  card: KanbanCard,
  boardName: string,
  startSession: (params: {
    cardId: string;
    cardTitle: string;
    boardName: string;
    pageId: string;
    timeBlockId?: string | null;
    durationSeconds: number;
  }) => void
) {
  const formatHour = (hour: number) => {
    if (hour === 0) return "12 AM";
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return "12 PM";
    return `${hour - 12} PM`;
  };

  toast(
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">Scheduled task overdue</span>
      </div>
      <div className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{card.title}</span>
        {" · "}
        {boardName}
      </div>
      <div className="text-xs text-muted-foreground">
        Scheduled for {formatHour(block.startHour)}
      </div>
    </div>,
    {
      duration: Infinity, // Don't auto-dismiss
      action: {
        label: "Start",
        onClick: () => {
          startSession({
            cardId: card.id,
            cardTitle: card.title,
            boardName,
            pageId: block.pageId,
            timeBlockId: block.id,
            durationSeconds: block.durationMinutes * 60,
          });
        },
      },
      cancel: {
        label: "Dismiss",
        onClick: () => {
          // Just close the toast - will re-notify after interval
        },
      },
    }
  );
}
