import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAppStore } from "@/stores/app-store";
import { createPage } from "@/lib/db-helpers";
import { exportWorkspace, downloadExport } from "@/lib/data-transfer";

/**
 * Registers global keyboard shortcuts:
 * - ⌘+\ → toggle sidebar
 * - ⌘+N → create new page
 * - ⌘+Shift+L → cycle theme (light → dark → system)
 * - ⌘+Shift+E → quick export (direct download)
 * (⌘+K is handled inside SearchDialog)
 */
export function useGlobalShortcuts() {
  const navigate = useNavigate();
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const cycleTheme = useAppStore((s) => s.cycleTheme);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;

      // ⌘+\ → toggle sidebar
      if (meta && e.key === "\\") {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      // ⌘+Shift+L → cycle theme
      if (meta && e.shiftKey && e.key.toLowerCase() === "l") {
        e.preventDefault();
        cycleTheme();
        return;
      }

      // ⌘+Shift+E → quick export
      if (meta && e.shiftKey && e.key.toLowerCase() === "e") {
        e.preventDefault();
        exportWorkspace().then(downloadExport);
        return;
      }

      // ⌘+N → new page
      if (meta && e.key === "n") {
        e.preventDefault();
        createPage("Untitled").then((page) => {
          navigate(`/page/${page.id}`);
        });
        return;
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar, cycleTheme, navigate]);
}
