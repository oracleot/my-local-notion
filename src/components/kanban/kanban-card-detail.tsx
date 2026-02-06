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
import { updateCard, deleteCard } from "@/lib/db-helpers";
import type { KanbanCard } from "@/types";
import { Trash2 } from "lucide-react";

interface KanbanCardDetailProps {
  card: KanbanCard | null;
  onClose: () => void;
}

export function KanbanCardDetail({ card, onClose }: KanbanCardDetailProps) {
  const [title, setTitle] = useState(card?.title ?? "");
  const [description, setDescription] = useState(card?.description ?? "");
  const [prevCardId, setPrevCardId] = useState<string | null>(null);

  // Sync local state when card changes (during render, not in effect)
  if (card && card.id !== prevCardId) {
    setPrevCardId(card.id);
    setTitle(card.title);
    setDescription(card.description);
  }

  const handleSave = useCallback(async () => {
    if (!card) return;
    await updateCard(card.id, {
      title: title.trim() || "Untitled",
      description: description.trim(),
    });
    onClose();
  }, [card, title, description, onClose]);

  const handleDelete = useCallback(async () => {
    if (!card) return;
    await deleteCard(card.id);
    onClose();
  }, [card, onClose]);

  return (
    <Dialog open={!!card} onOpenChange={(open) => !open && handleSave()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">Edit card</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
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
              rows={4}
              className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-[13px] leading-relaxed placeholder:text-muted-foreground/50 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            />
          </div>
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
          <Button size="sm" onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
