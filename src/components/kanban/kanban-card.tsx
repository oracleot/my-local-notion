import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { KanbanCard as KanbanCardType, KanbanColumn } from "@/types";
import { GripVertical, ExternalLink } from "lucide-react";
import { KanbanCardSubtasks } from "@/components/kanban/kanban-card-subtasks";

interface KanbanCardProps {
  card: KanbanCardType;
  allCards: KanbanCardType[];
  columns: KanbanColumn[];
  onOpen: (card: KanbanCardType) => void;
}

export function KanbanCard({ card, allCards, columns, onOpen }: KanbanCardProps) {
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

  // Calculate subtask progress for parent cards
  const subtasks = card.parentId === null 
    ? allCards.filter(c => c.parentId === card.id)
    : [];
  const hasSubtasks = subtasks.length > 0;

  const isSubtask = card.parentId !== null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group/card flex items-start gap-1 rounded-lg border bg-background px-3 py-2.5 shadow-xs transition-shadow hover:shadow-sm ${
        isDragging ? "z-50 opacity-50 shadow-md" : ""
      } ${isSubtask ? "border-primary/30" : "border-border/60"}`}
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

        {/* Clickable link */}
        {card.link && (
          <a
            href={card.link.startsWith("http") ? card.link : `https://${card.link}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-1.5 flex items-center gap-1 text-[11px] text-primary/70 hover:text-primary transition-colors truncate"
          >
            <ExternalLink className="h-3 w-3 shrink-0" />
            <span className="truncate">{card.link.replace(/^https?:\/\//, "")}</span>
          </a>
        )}

        {!isSubtask && hasSubtasks && (
          <KanbanCardSubtasks
            subtasks={subtasks}
            columns={columns}
          />
        )}
      </div>
    </div>
  );
}
