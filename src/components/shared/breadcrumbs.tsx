import { useEffect, useState } from "react";
import { Link } from "react-router";
import { db } from "@/lib/db";
import { ChevronRight, FileText, LayoutGrid } from "lucide-react";
import type { Page } from "@/types";

interface BreadcrumbsProps {
  page: Page;
}

/** Builds the ancestor chain from root → current page */
async function getAncestors(page: Page): Promise<Page[]> {
  const chain: Page[] = [];
  let current: Page | undefined = page;

  while (current?.parentId) {
    current = await db.pages.get(current.parentId);
    if (current) chain.unshift(current);
  }

  return chain;
}

export function Breadcrumbs({ page }: BreadcrumbsProps) {
  const [ancestors, setAncestors] = useState<Page[]>([]);

  useEffect(() => {
    getAncestors(page).then(setAncestors);
  }, [page]);

  // No breadcrumbs for root-level pages
  if (ancestors.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-4 flex items-center gap-1 text-[13px] text-muted-foreground/60"
    >
      {ancestors.map((ancestor) => {
        const Icon = ancestor.pageType === "kanban" ? LayoutGrid : FileText;
        return (
          <span key={ancestor.id} className="flex items-center gap-1">
            <Link
              to={`/page/${ancestor.id}`}
              className="flex items-center gap-1.5 rounded-sm px-1.5 py-0.5 transition-colors hover:bg-foreground/[0.05] hover:text-foreground/80"
            >
              {ancestor.icon ? (
                <span className="text-[12px] leading-none">
                  {ancestor.icon}
                </span>
              ) : (
                <Icon className="h-3 w-3 shrink-0 opacity-50" />
              )}
              <span className="max-w-[120px] truncate">
                {ancestor.title || "Untitled"}
              </span>
            </Link>
            <ChevronRight className="h-3 w-3 shrink-0 opacity-40" />
          </span>
        );
      })}

      {/* Current page (not a link) */}
      <span className="flex items-center gap-1.5 px-1.5 py-0.5 text-foreground/70">
        {page.icon ? (
          <span className="text-[12px] leading-none">{page.icon}</span>
        ) : page.pageType === "kanban" ? (
          <LayoutGrid className="h-3 w-3 shrink-0 opacity-50" />
        ) : (
          <FileText className="h-3 w-3 shrink-0 opacity-50" />
        )}
        <span className="max-w-[160px] truncate">
          {page.title || "Untitled"}
        </span>
      </span>
    </nav>
  );
}
