import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createSubtask, updateCard } from "@/lib/db-helpers";
import type { KanbanCard, KanbanColumn } from "@/types";
import { Plus, ListTodo, CheckCircle2, Circle } from "lucide-react";

interface CardSubtasksSectionProps {
  card: KanbanCard;
  subtasks: KanbanCard[];
  columns: KanbanColumn[];
  onOpenCard: (card: KanbanCard) => void;
}

export function CardSubtasksSection({
  card,
  subtasks,
  columns,
  onOpenCard,
}: CardSubtasksSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");

  const sortedColumns = [...columns].sort((a, b) => a.order - b.order);
  const doneColumnId = sortedColumns[sortedColumns.length - 1]?.id;

  const getColumnName = (columnId: string) =>
    columns.find((c) => c.id === columnId)?.title ?? "Unknown";

  const handleAdd = useCallback(async () => {
    if (!title.trim()) return;
    const subtask = await createSubtask(card.id, card.columnId, title.trim());
    if (link.trim()) {
      await updateCard(subtask.id, { link: link.trim() });
    }
    setTitle("");
    setLink("");
    setIsAdding(false);
  }, [card, title, link]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
          <ListTodo className="h-3.5 w-3.5" />
          Subtasks ({subtasks.length})
        </label>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => setIsAdding(true)}
          className="text-muted-foreground"
        >
          <Plus className="h-3 w-3" />
          Add
        </Button>
      </div>

      {subtasks.length > 0 && (
        <div className="space-y-1 rounded-md border border-border/50 bg-muted/20 p-2">
          {subtasks.map((subtask) => {
            const isDone = subtask.columnId === doneColumnId;
            return (
              <button
                key={subtask.id}
                onClick={() => onOpenCard(subtask)}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[12px] hover:bg-muted/50 transition-colors"
              >
                {isDone ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                ) : (
                  <Circle className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                )}
                <span
                  className={`flex-1 truncate ${isDone ? "text-muted-foreground line-through" : ""}`}
                >
                  {subtask.title || "Untitled"}
                </span>
                <span className="text-[10px] text-muted-foreground/50 shrink-0">
                  {getColumnName(subtask.columnId)}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {isAdding && (
        <div className="space-y-1.5">
          <Input
            autoFocus
            placeholder="Subtask title…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
              if (e.key === "Escape") {
                setTitle("");
                setLink("");
                setIsAdding(false);
              }
            }}
            className="h-8 text-[13px]"
          />
          <Input
            placeholder="Link URL (optional)…"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
              if (e.key === "Escape") {
                setTitle("");
                setLink("");
                setIsAdding(false);
              }
            }}
            className="h-8 text-[13px]"
          />
          <div className="flex gap-1.5">
            <Button size="xs" onClick={handleAdd}>
              Add
            </Button>
            <Button
              size="xs"
              variant="ghost"
              onClick={() => {
                setTitle("");
                setLink("");
                setIsAdding(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
