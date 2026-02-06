import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { KanbanCard as KanbanCardType, KanbanColumn } from "@/types";
import { GripVertical, ListTodo, ArrowUpRight } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  
  // Find "done" column (last column by order)
  const sortedColumns = [...columns].sort((a, b) => a.order - b.order);
  const doneColumnId = sortedColumns[sortedColumns.length - 1]?.id;
  const completedSubtasks = subtasks.filter(s => s.columnId === doneColumnId).length;

  // For subtask cards, get parent info
  const isSubtask = card.parentId !== null;
  const parentCard = isSubtask 
    ? allCards.find(c => c.id === card.parentId) 
    : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group/card flex items-start gap-1 rounded-lg border bg-background px-3 py-2.5 shadow-xs transition-shadow hover:shadow-sm ${
        isDragging ? "z-50 opacity-50 shadow-md" : ""
      } ${isSubtask ? "border-primary/30 border-l-2 border-l-primary/50" : "border-border/60"}`}
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
        {/* Parent indicator for subtasks */}
        {isSubtask && parentCard && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="mb-1 flex items-center gap-1 text-[10px] text-primary/70">
                <ArrowUpRight className="h-2.5 w-2.5" />
                <span className="truncate max-w-[140px]">{parentCard.title || "Untitled"}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[11px]">
              Subtask of: {parentCard.title || "Untitled"}
            </TooltipContent>
          </Tooltip>
        )}

        <p className="text-[13px] font-medium leading-snug text-foreground/90">
          {card.title || "Untitled"}
        </p>
        {card.description && (
          <p className="mt-0.5 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground/60">
            {card.description}
          </p>
        )}

        {/* Subtask progress badge for parent cards */}
        {hasSubtasks && (
          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
            <ListTodo className="h-3 w-3" />
            <span>
              {completedSubtasks}/{subtasks.length} done
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
