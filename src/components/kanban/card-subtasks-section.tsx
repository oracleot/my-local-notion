import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createSubtask, updateCard, moveCard } from "@/lib/db-helpers";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { KanbanCard, KanbanColumn } from "@/types";
import { Plus, ListTodo, CheckCircle2, Circle, ChevronDown } from "lucide-react";

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

  const handleMoveColumn = useCallback(
    async (subtask: KanbanCard, columnId: string) => {
      await moveCard(subtask.id, columnId, Date.now());
    },
    []
  );

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
              <div
                key={subtask.id}
                className="flex w-full items-start gap-2 rounded px-2 py-1.5 text-[12px] hover:bg-muted/50 transition-colors"
              >
                <div className="shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 text-muted-foreground/50" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onOpenCard(subtask)}
                  className="flex flex-1 items-start gap-2 text-left min-w-0"
                >
                  <span
                    className={`flex-1 whitespace-normal break-words ${isDone ? "text-muted-foreground line-through" : ""}`}
                  >
                    {subtask.title || "Untitled"}
                  </span>
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="xs"
                      className="h-6 gap-1 text-[10px] text-muted-foreground"
                    >
                      {getColumnName(subtask.columnId)}
                      <ChevronDown className="h-3 w-3 opacity-60" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    {sortedColumns.map((col) => (
                      <DropdownMenuItem
                        key={col.id}
                        onClick={() => handleMoveColumn(subtask, col.id)}
                        className={col.id === subtask.columnId ? "font-semibold" : undefined}
                      >
                        {col.title}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
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
