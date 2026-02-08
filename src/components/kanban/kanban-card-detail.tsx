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
  promoteSubtask,
} from "@/lib/db-helpers";
import type { KanbanCard, KanbanColumn } from "@/types";
import { Trash2, ArrowUp, ArrowUpRight, ExternalLink } from "lucide-react";
import { CardSubtasksSection } from "./card-subtasks-section";
import { CardSessionLogs } from "./card-session-logs";

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

  const handlePromote = useCallback(async () => {
    if (!card) return;
    await promoteSubtask(card.id);
    onClose();
  }, [card, onClose]);

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
            <CardSubtasksSection
              card={card}
              subtasks={subtasks}
              columns={columns}
              onOpenCard={onOpenCard}
            />
          )}

          {/* Session Notes */}
          {card && <CardSessionLogs cardId={card.id} />}
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
