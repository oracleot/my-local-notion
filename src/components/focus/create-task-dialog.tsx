import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getKanbanBoards, getFirstColumn } from "@/lib/focus-helpers";
import { useAppStore } from "@/stores/app-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTask: (title: string, pageId: string, columnId: string) => void;
}

export function CreateTaskDialog({
  open,
  onOpenChange,
  onCreateTask,
}: CreateTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [selectedPageId, setSelectedPageId] = useState<string>("");
  const activePageId = useAppStore((s) => s.activePageId);

  const boards = useLiveQuery(
    () => (open ? getKanbanBoards() : Promise.resolve([])),
    [open]
  );

  // Initialize selectedPageId when boards load and there's no selection yet
  const defaultPageId = boards && boards.length > 0
    ? (boards.find((b) => b.id === activePageId) ?? boards[0]).id
    : "";
  
  const effectivePageId = selectedPageId || defaultPageId;

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      // Reset form when closing
      setTitle("");
      setSelectedPageId("");
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !effectivePageId) return;

    const board = boards?.find((b) => b.id === effectivePageId);
    if (!board) return;

    const firstCol = getFirstColumn(board);
    if (!firstCol) return;

    onCreateTask(title.trim(), effectivePageId, firstCol.id);
    handleOpenChange(false);
  };

  const isValid = title.trim().length > 0 && effectivePageId.length > 0;
  const selectedBoard = boards?.find((b) => b.id === effectivePageId);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create new task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="task-title" className="text-sm font-medium">
              Task title
            </label>
            <Input
              id="task-title"
              placeholder="Enter task title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Board</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between"
                >
                  {selectedBoard ? (
                    <span>
                      {selectedBoard.icon} {selectedBoard.title || "Untitled Board"}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Select a board</span>
                  )}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                {boards?.map((board) => (
                  <DropdownMenuItem
                    key={board.id}
                    onClick={() => setSelectedPageId(board.id)}
                  >
                    {board.icon} {board.title || "Untitled Board"}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid}>
              Create & Schedule
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
