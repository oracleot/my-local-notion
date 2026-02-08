import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  updateCard, 
  deleteCard, 
  createSubtask,
  promoteSubtask,
} from "@/lib/db-helpers";
import type { KanbanCard, KanbanColumn } from "@/types";
import { Trash2, Plus, ArrowUp, ListTodo, ArrowUpRight, CheckCircle2, Circle, ExternalLink } from "lucide-react";

interface KanbanCardDetailProps {
  card: KanbanCard | null;
  allCards: KanbanCard[];
  columns: KanbanColumn[];
  onClose: () => void;
  onOpenCard: (card: KanbanCard) => void;
}

export function KanbanCardDetail({ 
  card, 
  allCards, 
  columns,
  onClose,
  onOpenCard,
}: KanbanCardDetailProps) {
  const [title, setTitle] = useState(card?.title ?? "");
  const [description, setDescription] = useState(card?.description ?? "");
  const [link, setLink] = useState(card?.link ?? "");
  const [prevCardId, setPrevCardId] = useState<string | null>(null);
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newSubtaskLink, setNewSubtaskLink] = useState("");

  // Sync local state when card changes
  if (card && card.id !== prevCardId) {
    setPrevCardId(card.id);
    setTitle(card.title);
    setDescription(card.description);
    setLink(card.link ?? "");
  }

  // Calculate derived data
  const isSubtask = card?.parentId !== null;
  const parentCard = isSubtask 
    ? allCards.find(c => c.id === card?.parentId) 
    : null;
  const subtasks = card?.parentId === null 
    ? allCards.filter(c => c.parentId === card?.id)
    : [];
  
  // Sort columns and find done column
  const sortedColumns = [...columns].sort((a, b) => a.order - b.order);
  const doneColumnId = sortedColumns[sortedColumns.length - 1]?.id;
  
  const getColumnName = (columnId: string) => 
    columns.find(c => c.id === columnId)?.title ?? "Unknown";

  const handleSave = useCallback(async () => {
    if (!card) return;
    await updateCard(card.id, {
      title: title.trim() || "Untitled",
      description: description.trim(),
      link: link.trim(),
    });
    onClose();
  }, [card, title, description, link, onClose]);

  const handleDelete = useCallback(async () => {
    if (!card) return;
    await deleteCard(card.id);
    onClose();
  }, [card, onClose]);

  const handleAddSubtask = useCallback(async () => {
    if (!card || !newSubtaskTitle.trim()) return;
    const subtask = await createSubtask(card.id, card.columnId, newSubtaskTitle.trim());
    if (newSubtaskLink.trim()) {
      await updateCard(subtask.id, { link: newSubtaskLink.trim() });
    }
    setNewSubtaskTitle("");
    setNewSubtaskLink("");
    setIsAddingSubtask(false);
  }, [card, newSubtaskTitle, newSubtaskLink]);

  const handlePromote = useCallback(async () => {
    if (!card) return;
    await promoteSubtask(card.id);
    onClose();
  }, [card, onClose]);

  const handleOpenSubtask = useCallback((subtask: KanbanCard) => {
    onOpenCard(subtask);
  }, [onOpenCard]);

  return (
    <Dialog open={!!card} onOpenChange={(open) => !open && handleSave()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="sr-only">Edit card</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto py-2 flex-1 min-h-0">
          {/* Parent link for subtasks */}
          {isSubtask && parentCard && (
            <button
              onClick={() => onOpenCard(parentCard)}
              className="flex items-center gap-1.5 text-[12px] text-primary hover:text-primary/80 transition-colors"
            >
              <ArrowUpRight className="h-3 w-3" />
              <span>Parent: {parentCard.title || "Untitled"}</span>
            </button>
          )}

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-muted-foreground">
              Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Card title…"
              className="text-[14px]"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-muted-foreground">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description…"
              rows={3}
              className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-[13px] leading-relaxed placeholder:text-muted-foreground/50 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-muted-foreground">
              Link
            </label>
            <div className="flex items-center gap-1.5">
              <Input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://…"
                className="text-[13px] flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                }}
              />
              {link.trim() && (
                <a
                  href={link.trim().startsWith("http") ? link.trim() : `https://${link.trim()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="shrink-0 rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* Subtasks section for parent cards only */}
          {!isSubtask && card && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
                  <ListTodo className="h-3.5 w-3.5" />
                  Subtasks ({subtasks.length})
                </label>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => setIsAddingSubtask(true)}
                  className="text-muted-foreground"
                >
                  <Plus className="h-3 w-3" />
                  Add
                </Button>
              </div>

              {/* Subtask list */}
              {subtasks.length > 0 && (
                <div className="space-y-1 rounded-md border border-border/50 bg-muted/20 p-2">
                  {subtasks.map((subtask) => {
                    const isDone = subtask.columnId === doneColumnId;
                    return (
                      <button
                        key={subtask.id}
                        onClick={() => handleOpenSubtask(subtask)}
                        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[12px] hover:bg-muted/50 transition-colors"
                      >
                        {isDone ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                        ) : (
                          <Circle className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                        )}
                        <span className={`flex-1 truncate ${isDone ? "text-muted-foreground line-through" : ""}`}>
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

              {/* Add subtask form */}
              {isAddingSubtask && (
                <div className="space-y-1.5">
                  <Input
                    autoFocus
                    placeholder="Subtask title…"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddSubtask();
                      if (e.key === "Escape") {
                        setNewSubtaskTitle("");
                        setNewSubtaskLink("");
                        setIsAddingSubtask(false);
                      }
                    }}
                    className="h-8 text-[13px]"
                  />
                  <Input
                    placeholder="Link URL (optional)…"
                    value={newSubtaskLink}
                    onChange={(e) => setNewSubtaskLink(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddSubtask();
                      if (e.key === "Escape") {
                        setNewSubtaskTitle("");
                        setNewSubtaskLink("");
                        setIsAddingSubtask(false);
                      }
                    }}
                    className="h-8 text-[13px]"
                  />
                  <div className="flex gap-1.5">
                    <Button size="xs" onClick={handleAddSubtask}>
                      Add
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => {
                        setNewSubtaskTitle("");
                        setNewSubtaskLink("");
                        setIsAddingSubtask(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
            {isSubtask && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePromote}
                title="Promote to standalone card"
              >
                <ArrowUp className="h-3.5 w-3.5" />
                Promote
              </Button>
            )}
          </div>
          <Button size="sm" onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
