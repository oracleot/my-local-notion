import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { KanbanCard as KanbanCardType } from "@/types";
import { GripVertical } from "lucide-react";

interface KanbanCardProps {
  card: KanbanCardType;
  onOpen: (card: KanbanCardType) => void;
}

export function KanbanCard({ card, onOpen }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group/card flex items-start gap-1 rounded-lg border border-border/60 bg-background px-3 py-2.5 shadow-xs transition-shadow hover:shadow-sm ${
        isDragging ? "z-50 opacity-50 shadow-md" : ""
      }`}
      onClick={() => onOpen(card)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(card);
        }
      }}
    >
      {/* Drag handle */}
      <button
        className="mt-0.5 shrink-0 cursor-grab rounded p-0.5 text-muted-foreground/30 opacity-0 transition-opacity group-hover/card:opacity-100 hover:text-muted-foreground/60 active:cursor-grabbing"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium leading-snug text-foreground/90">
          {card.title || "Untitled"}
        </p>
        {card.description && (
          <p className="mt-0.5 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground/60">
            {card.description}
          </p>
        )}
      </div>
    </div>
  );
}
