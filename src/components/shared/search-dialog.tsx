import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { FileText, LayoutGrid } from "lucide-react";

export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const pages = useLiveQuery(() => db.pages.toArray());

  // ⌘+K shortcut to open
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelect = useCallback(
    (pageId: string) => {
      setOpen(false);
      navigate(`/page/${pageId}`);
    },
    [navigate]
  );

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Search pages"
      description="Find and navigate to a page"
    >
      <CommandInput placeholder="Search pages…" />
      <CommandList>
        <CommandEmpty>No pages found.</CommandEmpty>
        <CommandGroup heading="Pages">
          {pages?.map((page) => {
            const Icon = page.pageType === "kanban" ? LayoutGrid : FileText;
            return (
              <CommandItem
                key={page.id}
                value={page.title || "Untitled"}
                onSelect={() => handleSelect(page.id)}
                className="gap-2.5 cursor-pointer"
              >
                {page.icon ? (
                  <span className="text-sm leading-none shrink-0">
                    {page.icon}
                  </span>
                ) : (
                  <Icon className="h-4 w-4 shrink-0 opacity-50" />
                )}
                <span className="truncate">
                  {page.title || "Untitled"}
                </span>
                <span className="ml-auto text-[11px] text-muted-foreground/50 capitalize">
                  {page.pageType}
                </span>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
