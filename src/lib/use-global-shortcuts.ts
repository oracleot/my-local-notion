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
 * - ⌘+Shift+F → navigate to Focus view
 * (⌘+K is handled inside SearchDialog)
 */
export function useGlobalShortcuts() {
  const navigate = useNavigate();
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const cycleTheme = useAppStore((s) => s.cycleTheme);
  const activeSession = useAppStore((s) => s.activeSession);
  const pauseSession = useAppStore((s) => s.pauseSession);
  const resumeSession = useAppStore((s) => s.resumeSession);
  const toggleZenMode = useAppStore((s) => s.toggleZenMode);

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

      // ⌘+Shift+F → Focus view
      if (meta && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        navigate("/focus");
        return;
      }

      // ⌘+Shift+Z → Toggle Zen mode (only when session active)
      if (meta && e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (activeSession) {
          toggleZenMode();
        }
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
  }, [toggleSidebar, cycleTheme, navigate, activeSession, pauseSession, resumeSession, toggleZenMode]);
}
