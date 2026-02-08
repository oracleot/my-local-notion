import { useRef, useCallback } from "react";
import { Outlet } from "react-router";
import { useAppStore } from "@/stores/app-store";
import { Sidebar } from "./sidebar";
import { SearchDialog } from "@/components/shared/search-dialog";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { FocusTimerBadge } from "@/components/focus/focus-timer-badge";
import { useGlobalShortcuts } from "@/lib/use-global-shortcuts";
import { PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

export function AppLayout() {
  const { sidebarOpen, sidebarWidth, setSidebarWidth, toggleSidebar } =
    useAppStore();
  const isResizing = useRef(false);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isResizing.current = true;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const handleMouseMove = (e: MouseEvent) => {
        if (!isResizing.current) return;
        const newWidth = Math.max(200, Math.min(480, e.clientX));
        setSidebarWidth(newWidth);
      };

      const handleMouseUp = () => {
        isResizing.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [setSidebarWidth]
  );

  useGlobalShortcuts();

  return (
    <TooltipProvider delayDuration={200}>
      <SearchDialog />
      <div className="flex h-screen w-screen overflow-hidden bg-background">
        {/* ── Sidebar ── */}
        <aside
          className="shrink-0 overflow-hidden transition-[width] duration-200 ease-out"
          style={{ width: sidebarOpen ? sidebarWidth : 0 }}
        >
          {sidebarOpen && <Sidebar />}
        </aside>

        {/* ── Resize handle ── */}
        {sidebarOpen && (
          <div
            className="group relative z-10 w-0 shrink-0 cursor-col-resize"
            onMouseDown={handleMouseDown}
          >
            <div className="absolute inset-y-0 -left-[1.5px] w-[3px] rounded-full bg-transparent transition-colors duration-150 group-hover:bg-foreground/8 active:bg-foreground/12" />
          </div>
        )}

        {/* ── Main content area ── */}
        <main className="flex min-w-0 flex-1 flex-col">
          {/* Top bar with sidebar toggle and theme toggle */}
          <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
            <div>
              {!sidebarOpen && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground/60 hover:text-foreground"
                      onClick={toggleSidebar}
                    >
                      <PanelLeft className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">
                    Open sidebar{" "}
                    <kbd className="ml-1 font-mono text-[10px] text-muted-foreground">
                      ⌘\
                    </kbd>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <FocusTimerBadge />
              <ThemeToggle />
            </div>
          </div>


          {/* Page content */}
          <div className="flex-1 overflow-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
