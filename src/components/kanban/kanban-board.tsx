import { useState, useCallback, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import {
  addColumn,
  updateColumn,
  deleteColumn,
  moveCard,
} from "@/lib/db-helpers";
import type { Page, KanbanCard as KanbanCardType } from "@/types";
import { KanbanColumn } from "@/components/kanban/kanban-column";
import { KanbanCardDetail } from "@/components/kanban/kanban-card-detail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

interface KanbanBoardProps {
  page: Page;
}

export function KanbanBoard({ page }: KanbanBoardProps) {
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [detailCard, setDetailCard] = useState<KanbanCardType | null>(null);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");

  const cards = useLiveQuery(
    () => db.kanbanCards.where("pageId").equals(page.id).toArray(),
    [page.id]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const columns = useMemo(
    () => [...page.columns].sort((a, b) => a.order - b.order),
    [page.columns]
  );

  const cardsByColumn = useMemo(() => {
    const map = new Map<string, KanbanCardType[]>();
    for (const col of columns) {
      map.set(col.id, []);
    }
    for (const card of cards ?? []) {
      const list = map.get(card.columnId);
      if (list) list.push(card);
    }
    return map;
  }, [cards, columns]);

  // Find which column a card belongs to
  const findColumnOfCard = useCallback(
    (cardId: string): string | undefined => {
      return cards?.find((c) => c.id === cardId)?.columnId;
    },
    [cards]
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveCardId(event.active.id as string);
  }, []);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over || !cards) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      const activeColumnId = findColumnOfCard(activeId);
      // over can be a card or a column
      const overColumnId = findColumnOfCard(overId) ?? overId;

      if (!activeColumnId || !overColumnId) return;
      if (activeColumnId === overColumnId) return;

      // Move card to new column temporarily (optimistic)
      moveCard(activeId, overColumnId, Date.now());
    },
    [cards, findColumnOfCard]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveCardId(null);
      const { active, over } = event;
      if (!over || !cards) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      const activeCard = cards.find((c) => c.id === activeId);
      if (!activeCard) return;

      const targetColumnId = findColumnOfCard(overId) ?? overId;
      const columnCards = cardsByColumn.get(targetColumnId);
      if (!columnCards) return;

      const sorted = [...columnCards].sort((a, b) => a.order - b.order);
      const oldIndex = sorted.findIndex((c) => c.id === activeId);
      const newIndex = sorted.findIndex((c) => c.id === overId);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const reordered = arrayMove(sorted, oldIndex, newIndex);
        // Update order for all affected cards
        for (let i = 0; i < reordered.length; i++) {
          await moveCard(reordered[i].id, targetColumnId, i);
        }
      } else {
        // Just ensure the card has a proper order in its new column
        await moveCard(activeId, targetColumnId, sorted.length);
      }
    },
    [cards, findColumnOfCard, cardsByColumn]
  );

  const handleAddColumn = useCallback(async () => {
    const title = newColumnTitle.trim();
    if (!title) return;
    await addColumn(page.id, title);
    setNewColumnTitle("");
    setIsAddingColumn(false);
  }, [newColumnTitle, page.id]);

  const handleRenameColumn = useCallback(
    (columnId: string, title: string) => {
      updateColumn(page.id, columnId, { title });
    },
    [page.id]
  );

  const handleDeleteColumn = useCallback(
    (columnId: string) => {
      deleteColumn(page.id, columnId);
    },
    [page.id]
  );

  const handleOpenCard = useCallback((card: KanbanCardType) => {
    setDetailCard(card);
  }, []);

  const activeCard = activeCardId
    ? cards?.find((c) => c.id === activeCardId)
    : null;

  if (cards === undefined) {
    return (
      <div className="flex gap-4 px-2 pt-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-48 w-72 animate-pulse rounded-xl bg-muted/30"
          />
        ))}
      </div>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto px-2 pb-8 pt-2">
          {columns.map((col) => (
            <KanbanColumn
              key={col.id}
              column={col}
              cards={cardsByColumn.get(col.id) ?? []}
              allCards={cards ?? []}
              allColumns={columns}
              pageId={page.id}
              onRenameColumn={handleRenameColumn}
              onDeleteColumn={handleDeleteColumn}
              onOpenCard={handleOpenCard}
            />
          ))}

          {/* Add column */}
          {isAddingColumn ? (
            <div className="w-72 shrink-0 space-y-2 rounded-xl border border-dashed border-border/50 bg-muted/10 p-3">
              <Input
                autoFocus
                placeholder="Column title…"
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddColumn();
                  if (e.key === "Escape") {
                    setNewColumnTitle("");
                    setIsAddingColumn(false);
                  }
                }}
                className="h-8 text-[13px]"
              />
              <div className="flex gap-1.5">
                <Button size="xs" onClick={handleAddColumn}>
                  Add
                </Button>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => {
                    setNewColumnTitle("");
                    setIsAddingColumn(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              className="h-10 w-72 shrink-0 justify-start border border-dashed border-border/40 text-muted-foreground/50 hover:text-muted-foreground"
              onClick={() => setIsAddingColumn(true)}
            >
              <Plus className="h-4 w-4" />
              Add column
            </Button>
          )}
        </div>

        {/* Drag overlay */}
        <DragOverlay>
          {activeCard ? (
            <div className="w-68 rounded-lg border border-border bg-background px-3 py-2.5 shadow-lg">
              <p className="text-[13px] font-medium text-foreground/90">
                {activeCard.title || "Untitled"}
              </p>
              {activeCard.description && (
                <p className="mt-0.5 line-clamp-2 text-[12px] text-muted-foreground/60">
                  {activeCard.description}
                </p>
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Card detail dialog */}
      <KanbanCardDetail
        card={detailCard}
        allCards={cards ?? []}
        columns={columns}
        onClose={() => setDetailCard(null)}
        onOpenCard={(card) => setDetailCard(card)}
      />
    </>
  );
}
