import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import {
  createPage,
  deletePage,
  updatePageTitle,
} from "@/lib/db-helpers";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronRight,
  FileText,
  LayoutGrid,
  MoreHorizontal,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Page, PageType } from "@/types";

interface PageTreeItemProps {
  page: Page;
  depth: number;
}

export function PageTreeItem({ page, depth }: PageTreeItemProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(page.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const isActive = location.pathname === `/page/${page.id}`;

  // Fetch children (only when expanded)
  const children = useLiveQuery(
    () =>
      expanded
        ? db.pages.where("parentId").equals(page.id).sortBy("createdAt")
        : Promise.resolve([] as Page[]),
    [expanded, page.id]
  );

  const hasChildren = useLiveQuery(
    () => db.pages.where("parentId").equals(page.id).count(),
    [page.id]
  );

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    navigate(`/page/${page.id}`);
  };

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((prev) => !prev);
  };

  const handleRename = () => {
    setEditTitle(page.title);
    setIsEditing(true);
  };

  const handleRenameSubmit = async () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== page.title) {
      await updatePageTitle(page.id, trimmed);
    }
    setIsEditing(false);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRenameSubmit();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditTitle(page.title);
    }
  };

  const handleAddChild = async (pageType: PageType) => {
    const child = await createPage("Untitled", page.id, pageType);
    setExpanded(true);
    navigate(`/page/${child.id}`);
  };

  const handleDelete = async () => {
    await deletePage(page.id);
    if (isActive) {
      navigate("/");
    }
  };

  const icon = page.icon ? (
    <span className="text-[14px] leading-none shrink-0 w-[18px] text-center">
      {page.icon}
    </span>
  ) : page.pageType === "kanban" ? (
    <LayoutGrid className="h-[14px] w-[14px] shrink-0 opacity-45" />
  ) : (
    <FileText className="h-[14px] w-[14px] shrink-0 opacity-45" />
  );

  return (
    <div>
      {/* ── Tree node row ── */}
      <div
        className={cn(
          "group flex items-center gap-0.5 rounded-md mx-0.5 pr-1 cursor-pointer transition-colors duration-100",
          "hover:bg-sidebar-accent",
          isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
        )}
        style={{ paddingLeft: `${depth * 20 + 4}px` }}
        onClick={handleClick}
      >
        {/* Expand/collapse chevron */}
        <button
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-sm transition-colors",
            "text-sidebar-foreground/30 hover:text-sidebar-foreground/60 hover:bg-sidebar-accent",
            (hasChildren ?? 0) === 0 && "invisible"
          )}
          onClick={handleToggleExpand}
        >
          <ChevronRight
            className={cn(
              "h-3 w-3 transition-transform duration-150",
              expanded && "rotate-90"
            )}
          />
        </button>

        {/* Icon */}
        {icon}

        {/* Title */}
        {isEditing ? (
          <Input
            ref={inputRef}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={handleRenameKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="h-6 flex-1 min-w-0 border-none bg-background/80 px-1.5 py-0 text-[13px] shadow-sm focus-visible:ring-1"
          />
        ) : (
          <span className="flex-1 min-w-0 truncate text-[13px] py-[3px] pl-1 select-none">
            {page.title || "Untitled"}
          </span>
        )}

        {/* Hover actions */}
        {!isEditing && (
          <div className="flex items-center gap-0 opacity-0 group-hover:opacity-100 transition-opacity duration-100 shrink-0">
            {/* Add child page dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex h-5 w-5 items-center justify-center rounded-sm text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                  onClick={(e) => e.stopPropagation()}
                  title="Add sub-page"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-36">
                <DropdownMenuItem
                  className="gap-2 text-[13px]"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddChild("document");
                  }}
                >
                  <FileText className="h-3.5 w-3.5 opacity-60" />
                  Document
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2 text-[13px]"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddChild("kanban");
                  }}
                >
                  <LayoutGrid className="h-3.5 w-3.5 opacity-60" />
                  Board
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* More menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex h-5 w-5 items-center justify-center rounded-sm text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40">
                <DropdownMenuItem
                  className="gap-2 text-[13px]"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRename();
                  }}
                >
                  <Pencil className="h-3.5 w-3.5 opacity-60" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2 text-[13px] text-destructive focus:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 opacity-60" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* ── Children (recursive) ── */}
      {expanded && children && children.length > 0 && (
        <div>
          {children.map((child) => (
            <PageTreeItem key={child.id} page={child} depth={depth + 1} />
          ))}
        </div>
      )}

      {/* Expanded but no children yet */}
      {expanded && children && children.length === 0 && (
        <p
          className="text-[11px] text-sidebar-foreground/25 italic py-1 select-none"
          style={{ paddingLeft: `${(depth + 1) * 20 + 28}px` }}
        >
          No sub-pages
        </p>
      )}
    </div>
  );
}
