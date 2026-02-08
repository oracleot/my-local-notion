import { useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { deleteSessionLog } from "@/lib/db-helpers";
import { BookOpen, Trash2 } from "lucide-react";

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diffMs = now - new Date(date).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

interface CardSessionLogsProps {
  cardId: string;
}

export function CardSessionLogs({ cardId }: CardSessionLogsProps) {
  const logs = useLiveQuery(
    () =>
      db.sessionLogs
        .where("cardId")
        .equals(cardId)
        .toArray()
        .then((items) =>
          items.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        ),
    [cardId]
  );

  const handleDelete = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteSessionLog(id);
  }, []);

  if (!logs || logs.length === 0) return null;

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
        <BookOpen className="h-3.5 w-3.5" />
        Session Notes
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] tabular-nums">
          {logs.length}
        </span>
      </label>

      <div className="max-h-[200px] space-y-1 overflow-y-auto rounded-md border border-border/50 bg-muted/20 p-2">
        {logs.map((log) => (
          <div
            key={log.id}
            className="group flex items-start gap-2 rounded px-2 py-1.5 text-[12px] hover:bg-muted/50 transition-colors"
          >
            <span className="shrink-0 text-muted-foreground/40 min-w-[50px]">
              {formatRelativeTime(log.createdAt)}
            </span>
            <span className="flex-1 text-foreground/70 whitespace-pre-wrap break-words">
              {log.content}
            </span>
            <button
              onClick={(e) => handleDelete(log.id, e)}
              className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground/40 hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
