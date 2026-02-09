import { useParams, useNavigate } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { lazy, Suspense, useEffect } from "react";
import { useAppStore } from "@/stores/app-store";
import { PageHeader } from "@/components/editor/page-header";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { SubResources } from "@/components/shared/sub-resources";
import { KanbanBoard } from "@/components/kanban/kanban-board";

// Lazy-load the BlockNote editor so the ~1.5 MB chunk is only fetched on demand
const PageEditor = lazy(() =>
  import("@/components/editor/page-editor").then((m) => ({
    default: m.PageEditor,
  }))
);

export function PageView() {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const setActivePage = useAppStore((s) => s.setActivePage);

  const page = useLiveQuery(
    () => (pageId ? db.pages.get(pageId) : undefined),
    [pageId]
  );

  // Keep Zustand activePageId in sync & update document title
  useEffect(() => {
    if (pageId) setActivePage(pageId);
    return () => setActivePage(null);
  }, [pageId, setActivePage]);

  useEffect(() => {
    if (page?.title) {
      document.title = `${page.title} — My Notebook`;
    } else if (page) {
      document.title = "Untitled — My Notebook";
    }
    return () => { document.title = "My Notebook"; };
  }, [page]);

  // Redirect to home if page doesn't exist
  useEffect(() => {
    if (page === null) {
      navigate("/", { replace: true });
    }
  }, [page, navigate]);

  // Loading
  if (page === undefined) {
    return (
      <div className="mx-auto max-w-5xl px-6 pt-20">
        <div className="space-y-4 animate-pulse">
          <div className="h-10 w-2/5 rounded-lg bg-muted/50" />
          <div className="h-4 w-4/5 rounded bg-muted/30" />
          <div className="h-4 w-3/5 rounded bg-muted/30" />
          <div className="h-4 w-2/3 rounded bg-muted/30" />
        </div>
      </div>
    );
  }

  if (!page) return null;

  // Kanban pages
  if (page.pageType === "kanban") {
    return (
      <div className="flex h-full flex-col overflow-hidden pt-16">
        <div className="max-w-3xl shrink-0 px-10">
          <Breadcrumbs page={page} />
          <PageHeader key={page.id} page={page} />
          <SubResources parentId={page.id} />
        </div>
        <div className="min-h-0 flex-1">
          <KanbanBoard page={page} />
        </div>
      </div>
    );
  }

  // Document pages — BlockNote editor
  return (
    <div className="mx-auto max-w-5xl px-4 pt-16 pb-24">
      <Breadcrumbs page={page} />
      <PageHeader key={page.id} page={page} />
      <SubResources parentId={page.id} />
      {/* key forces remount when switching pages (BlockNote is uncontrolled) */}
      <Suspense
        fallback={
          <div className="space-y-3 animate-pulse pt-2">
            <div className="h-4 w-4/5 rounded bg-muted/30" />
            <div className="h-4 w-3/5 rounded bg-muted/30" />
            <div className="h-4 w-2/3 rounded bg-muted/30" />
          </div>
        }
      >
        <PageEditor key={page.id} page={page} />
      </Suspense>
    </div>
  );
}
