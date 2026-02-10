import { toast } from "sonner";
import type { TimeBlock, KanbanCard } from "@/types";

const NOTIFICATION_STORAGE_KEY = "focus-reminder-notifications";

// ─── Reminder Toast ─────────────────────────────────────────────────────────

export function showReminderToast(
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
  }) => void,
  audioEnabled: boolean
) {
  if (audioEnabled) playReminderChime();

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
      id: `reminder-${block.id}`,
      duration: Infinity,
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
        onClick: () => {},
      },
    }
  );
}

// ─── Audio ──────────────────────────────────────────────────────────────────

function playReminderChime() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1318.5, ctx.currentTime + 0.15);
    osc.frequency.setValueAtTime(1760, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.8);
    osc.onended = () => { ctx.close().catch(() => {}); };
  } catch {
    // Silently fail if AudioContext is unavailable
  }
}

// ─── Notification History Persistence ──────────────────────────────────────

export function loadNotificationHistory(): Map<string, number> {
  try {
    const raw = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (!raw) return new Map();
    const data = JSON.parse(raw) as Record<string, number>;
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
    const filtered = Object.entries(data).filter(([, timestamp]) => timestamp > twoHoursAgo);
    return new Map(filtered);
  } catch {
    return new Map();
  }
}

export function saveNotificationHistory(map: Map<string, number>) {
  try {
    const obj = Object.fromEntries(map);
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(obj));
  } catch {
    // Silently fail if localStorage is unavailable
  }
}
