import { useMemo, useCallback, useSyncExternalStore } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import "@blocknote/shadcn/style.css";
import { updatePageContent } from "@/lib/db-helpers";
import { useAppStore } from "@/stores/app-store";
import type { Block } from "@blocknote/core";
import type { Page } from "@/types";

// Hook to resolve the effective theme (light or dark)
function useResolvedTheme(): "light" | "dark" {
  const theme = useAppStore((s) => s.theme);

  // Subscribe to system theme changes
  const systemDark = useSyncExternalStore(
    (callback) => {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", callback);
      return () => mq.removeEventListener("change", callback);
    },
    () => window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  if (theme === "system") {
    return systemDark ? "dark" : "light";
  }
  return theme;
}

interface PageEditorProps {
  page: Page;
}

export function PageEditor({ page }: PageEditorProps) {
  const resolvedTheme = useResolvedTheme();

  // Convert stored content to BlockNote format, or use an empty default
  const initialContent = useMemo(() => {
    if (page.content && page.content.length > 0) {
      return page.content as unknown as Block[];
    }
    return undefined; // Let BlockNote create a default empty paragraph
  }, [page.content]);

  const editor = useCreateBlockNote(
    {
      initialContent,
    },
    [page.id] // Dependency — recreates editor when page changes
  );

  const handleChange = useCallback(() => {
    // Save the editor document to Dexie (debounced inside the helper)
    const blocks = editor.document;
    updatePageContent(page.id, blocks as unknown as Page["content"]);
  }, [editor, page.id]);

  return (
    <div className="-mx-[54px]">
      <BlockNoteView
        editor={editor}
        onChange={handleChange}
        theme={resolvedTheme}
        data-theming-css-variables-demo
      />
    </div>
  );
}
