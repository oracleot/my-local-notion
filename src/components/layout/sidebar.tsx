import { useState } from "react";
import { useNavigate } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { createPage } from "@/lib/db-helpers";
import { useAppStore } from "@/stores/app-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PageTreeItem } from "@/components/shared/page-tree-item";
import { DataTransferDialog } from "@/components/shared/data-transfer-dialog";
import {
  Plus,
  Search,
  PanelLeftClose,
  FileText,
  LayoutGrid,
  Settings,
  Upload,
} from "lucide-react";
import type { PageType } from "@/types";

export function Sidebar() {
  const navigate = useNavigate();
  const { toggleSidebar } = useAppStore();
  const [dataTransferOpen, setDataTransferOpen] = useState(false);

  const rootPages = useLiveQuery(() =>
    db.pages.filter((p) => p.parentId === null).sortBy("createdAt")
  );

  const handleNewPage = async (type: PageType) => {
    const page = await createPage("Untitled", null, type);
    navigate(`/page/${page.id}`);
  };

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-3.5 pt-3 pb-1">
        <span className="font-serif text-[15px] font-semibold tracking-tight opacity-85 select-none">
          My Notebook
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={toggleSidebar}
            >
              <PanelLeftClose className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            Close sidebar{" "}
            <kbd className="ml-1 font-mono text-[10px] text-muted-foreground">
              ⌘\
            </kbd>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* ── Quick actions ── */}
      <div className="px-2.5 py-1.5">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2.5 h-7 px-2 text-[13px] text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent font-normal"
          onClick={() => {
            // Trigger ⌘+K programmatically to open search dialog
            document.dispatchEvent(
              new KeyboardEvent("keydown", {
                key: "k",
                metaKey: true,
                bubbles: true,
              })
            );
          }}
        >
          <Search className="h-3.5 w-3.5 opacity-60" />
          Search
          <kbd className="ml-auto font-mono text-[10px] opacity-40">⌘K</kbd>
        </Button>
      </div>

      <Separator className="mx-3 bg-sidebar-border/50" />

      {/* ── Pages section header ── */}
      <div className="flex items-center justify-between px-3.5 pt-3.5 pb-1">
        <span className="text-[11px] font-medium uppercase tracking-widest text-sidebar-foreground/35 select-none">
          Pages
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-sidebar-foreground/35 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            <DropdownMenuItem
              className="gap-2 text-[13px]"
              onClick={() => handleNewPage("document")}
            >
              <FileText className="h-4 w-4 opacity-60" />
              Document
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 text-[13px]"
              onClick={() => handleNewPage("kanban")}
            >
              <LayoutGrid className="h-4 w-4 opacity-60" />
              Board
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── Page tree ── */}
      <ScrollArea className="flex-1 px-1.5">
        <div className="py-0.5 pb-4">
          {rootPages === undefined ? (
            <div className="space-y-1.5 px-2 pt-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-[26px] rounded-md bg-sidebar-accent/40 animate-pulse"
                  style={{ width: `${50 + i * 12}%` }}
                />
              ))}
            </div>
          ) : rootPages.length === 0 ? (
            <p className="px-3 py-6 text-[12px] text-sidebar-foreground/25 text-center italic leading-relaxed">
              No pages yet.
              <br />
              Click + above to get started.
            </p>
          ) : (
            rootPages.map((page) => (
              <PageTreeItem key={page.id} page={page} depth={0} />
            ))
          )}
        </div>
      </ScrollArea>

      {/* ── Settings / Import-Export ── */}
      <div className="border-t border-sidebar-border/50 px-2.5 py-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2.5 h-7 px-2 text-[13px] text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent font-normal"
            >
              <Settings className="h-3.5 w-3.5 opacity-60" />
              Settings
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem
              className="gap-2 text-[13px]"
              onClick={() => setDataTransferOpen(true)}
            >
              <Upload className="h-4 w-4 opacity-60" />
              Import / Export
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <DataTransferDialog
        open={dataTransferOpen}
        onOpenChange={setDataTransferOpen}
      />
    </div>
  );
}
