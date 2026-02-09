import type { KanbanCard as KanbanCardType, KanbanColumn } from "@/types";
import { CheckCircle2, Circle } from "lucide-react";

interface KanbanCardSubtasksProps {
  subtasks: KanbanCardType[];
  columns: KanbanColumn[];
}

export function KanbanCardSubtasks({
  subtasks,
  columns,
}: KanbanCardSubtasksProps) {
  const sortedColumns = [...columns].sort((a, b) => a.order - b.order);
  const doneColumnId = sortedColumns[sortedColumns.length - 1]?.id;

  const getColumnName = (columnId: string) =>
    columns.find((c) => c.id === columnId)?.title ?? "Unknown";

  if (subtasks.length === 0) return null;

  return (
    <div className="mt-2 space-y-1 rounded-md border border-border/50 bg-muted/20 p-2">
      {subtasks.map((subtask) => {
        const isDone = subtask.columnId === doneColumnId;
        return (
          <div
            key={subtask.id}
            className="flex w-full items-start gap-2 rounded px-2 py-1.5 text-[12px] hover:bg-muted/50 transition-colors"
          >
            <div className="shrink-0">
              {isDone ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Circle className="h-3.5 w-3.5 text-muted-foreground/50" />
              )}
            </div>
            <div className="flex flex-1 items-start gap-2 min-w-0">
              <span
                className={`flex-1 whitespace-normal break-words ${isDone ? "text-muted-foreground line-through" : ""}`}
              >
                {subtask.title || "Untitled"}
              </span>
              <span className="text-[10px] text-muted-foreground/50 shrink-0">
                {getColumnName(subtask.columnId)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
