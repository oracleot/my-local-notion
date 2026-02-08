import { useState, useCallback, useRef, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { createSessionLog, deleteSessionLog } from "@/lib/db-helpers";
import { Button } from "@/components/ui/button";
import { StickyNote, Send, Trash2 } from "lucide-react";

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diffMs = now - new Date(date).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  return `${Math.floor(diffHr / 24)} day ago`;
}

interface ZenModeJournalProps {
  cardId: string;
}

export function ZenModeJournal({ cardId }: ZenModeJournalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Focus textarea when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = useCallback(async () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    await createSessionLog(cardId, trimmed);
    setContent("");
    textareaRef.current?.focus();
  }, [cardId, content]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleDelete = useCallback(async (id: string) => {
    await deleteSessionLog(id);
  }, []);

  const recentLogs = logs?.slice(0, 5) ?? [];

  return (
    <div className="w-full border-t border-white/10">
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-2 px-6 py-3 text-[13px] text-white/40 transition-colors hover:text-white/60"
      >
        <StickyNote className="h-3.5 w-3.5" />
        Notes
        {logs && logs.length > 0 && (
          <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] tabular-nums">
            {logs.length}
          </span>
        )}
        <span className="ml-auto text-[10px]">{isOpen ? "▴" : "▾"}</span>
      </button>

      {/* Collapsible content */}
      {isOpen && (
        <div className="space-y-3 px-6 pb-4">
          {/* Input area */}
          <div className="flex gap-2">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a note..."
              rows={2}
              className="flex-1 resize-none rounded-md border border-white/10 bg-white/5 px-3 py-2 text-[13px] text-white/80 placeholder:text-white/25 outline-none focus:border-white/20"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-auto shrink-0 self-end text-white/40 hover:bg-white/10 hover:text-white"
              onClick={handleSubmit}
              disabled={!content.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Recent entries */}
          {recentLogs.length > 0 && (
            <div className="max-h-[140px] space-y-1 overflow-y-auto">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="group flex items-start gap-2 rounded px-2 py-1.5 text-[12px] hover:bg-white/5"
                >
                  <span className="shrink-0 text-white/25">
                    {formatRelativeTime(log.createdAt)}
                  </span>
                  <span className="flex-1 text-white/60">{log.content}</span>
                  <button
                    onClick={() => handleDelete(log.id)}
                    className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100 text-white/25 hover:text-red-400"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
