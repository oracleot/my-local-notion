import { useNavigate } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { FileText, LayoutGrid } from "lucide-react";
import type { Page } from "@/types";

interface SubResourcesProps {
  parentId: string;
}

export function SubResources({ parentId }: SubResourcesProps) {
  const navigate = useNavigate();

  const children = useLiveQuery(
    () => db.pages.where("parentId").equals(parentId).sortBy("createdAt"),
    [parentId]
  );

  // Hide section when loading or no children
  if (!children || children.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <h3 className="text-xs font-medium uppercase tracking-widest text-muted-foreground/60 mb-2">
        Sub-resources
      </h3>
      <div className="flex flex-wrap gap-2">
        {children.map((child) => (
          <SubResourceItem
            key={child.id}
            page={child}
            onClick={() => navigate(`/page/${child.id}`)}
          />
        ))}
      </div>
    </div>
  );
}

interface SubResourceItemProps {
  page: Page;
  onClick: () => void;
}

function SubResourceItem({ page, onClick }: SubResourceItemProps) {
  const title = page.title || "Untitled";
  const isKanban = page.pageType === "kanban";

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm 
        bg-muted/50 hover:bg-muted text-foreground/80 hover:text-foreground
        transition-colors cursor-pointer border border-transparent hover:border-border/50"
    >
      {page.icon ? (
        <span className="text-sm">{page.icon}</span>
      ) : isKanban ? (
        <LayoutGrid className="h-3.5 w-3.5 opacity-60" />
      ) : (
        <FileText className="h-3.5 w-3.5 opacity-60" />
      )}
      <span className="max-w-[200px] truncate">{title}</span>
    </button>
  );
}
