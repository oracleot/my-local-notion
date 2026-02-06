import { useState, useCallback } from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import type { KanbanColumn as KanbanColumnType, KanbanCard as KanbanCardType } from "@/types";
import { KanbanCard } from "@/components/kanban/kanban-card";
import { createCard } from "@/lib/db-helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Plus, Trash2, Pencil } from "lucide-react";

interface KanbanColumnProps {
  column: KanbanColumnType;
  cards: KanbanCardType[];
  pageId: string;
  onRenameColumn: (columnId: string, title: string) => void;
  onDeleteColumn: (columnId: string) => void;
  onOpenCard: (card: KanbanCardType) => void;
}

export function KanbanColumn({
  column,
  cards,
  pageId,
  onRenameColumn,
  onDeleteColumn,
  onOpenCard,
}: KanbanColumnProps) {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(column.title);

  const { setNodeRef } = useDroppable({ id: column.id });

  const sortedCards = [...cards].sort((a, b) => a.order - b.order);
  const cardIds = sortedCards.map((c) => c.id);

  const handleAddCard = useCallback(async () => {
    const title = newCardTitle.trim();
    if (!title) return;
    await createCard(pageId, column.id, title);
    setNewCardTitle("");
    setIsAddingCard(false);
  }, [newCardTitle, pageId, column.id]);

  const handleRenameSubmit = useCallback(() => {
    const title = editTitle.trim();
    if (title && title !== column.title) {
      onRenameColumn(column.id, title);
    }
    setIsEditingTitle(false);
  }, [editTitle, column.id, column.title, onRenameColumn]);

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-xl bg-muted/30 border border-border/40">
      {/* Column header */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        {isEditingTitle ? (
          <Input
            autoFocus
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRenameSubmit();
              if (e.key === "Escape") {
                setEditTitle(column.title);
                setIsEditingTitle(false);
              }
            }}
            className="h-7 text-[13px] font-semibold"
          />
        ) : (
          <h3 className="flex-1 truncate text-[13px] font-semibold text-foreground/80">
            {column.title}
          </h3>
        )}

        <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
          {cards.length}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              className="shrink-0 text-muted-foreground/50 hover:text-muted-foreground"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              onClick={() => {
                setEditTitle(column.title);
                setIsEditingTitle(true);
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDeleteColumn(column.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Cards area — droppable */}
      <div ref={setNodeRef} className="flex-1 px-2 pb-2">
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-1.5">
            {sortedCards.map((card) => (
              <KanbanCard
                key={card.id}
                card={card}
                onOpen={onOpenCard}
              />
            ))}
          </div>
        </SortableContext>

        {/* Add card form */}
        {isAddingCard ? (
          <div className="mt-1.5 space-y-1.5">
            <Input
              autoFocus
              placeholder="Card title…"
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddCard();
                if (e.key === "Escape") {
                  setNewCardTitle("");
                  setIsAddingCard(false);
                }
              }}
              className="h-8 text-[13px]"
            />
            <div className="flex gap-1.5">
              <Button size="xs" onClick={handleAddCard}>
                Add
              </Button>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => {
                  setNewCardTitle("");
                  setIsAddingCard(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="mt-1 w-full justify-start text-muted-foreground/50 hover:text-muted-foreground"
            onClick={() => setIsAddingCard(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add card
          </Button>
        )}
      </div>
    </div>
  );
}
