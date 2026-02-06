import { useNavigate } from "react-router";
import { createPage } from "@/lib/db-helpers";
import { FileText, LayoutGrid, Sparkles } from "lucide-react";
import type { PageType } from "@/types";

export function EmptyState() {
  const navigate = useNavigate();

  const handleCreate = async (type: PageType) => {
    const page = await createPage("Untitled", null, type);
    navigate(`/page/${page.id}`);
  };

  return (
    <div className="flex h-full items-center justify-center px-6">
      <div className="max-w-md text-center">
        {/* Decorative element */}
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground/[0.04]">
          <Sparkles className="h-6 w-6 text-foreground/25" strokeWidth={1.5} />
        </div>

        {/* Heading */}
        <h2 className="font-serif text-2xl font-semibold tracking-tight text-foreground/85">
          Start writing
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground/70">
          Create your first page to begin capturing
          <br />
          ideas, notes, and projects.
        </p>

        {/* Create buttons */}
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            className="group flex flex-col items-center gap-3 rounded-xl border border-border/60 bg-background px-8 py-5 transition-all duration-200 hover:border-border hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0"
            onClick={() => handleCreate("document")}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground/[0.04] transition-colors group-hover:bg-foreground/[0.07]">
              <FileText
                className="h-5 w-5 text-foreground/40 group-hover:text-foreground/60"
                strokeWidth={1.5}
              />
            </div>
            <div>
              <p className="text-[13px] font-medium text-foreground/80">
                Document
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground/50">
                Write freely
              </p>
            </div>
          </button>

          <button
            className="group flex flex-col items-center gap-3 rounded-xl border border-border/60 bg-background px-8 py-5 transition-all duration-200 hover:border-border hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0"
            onClick={() => handleCreate("kanban")}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground/[0.04] transition-colors group-hover:bg-foreground/[0.07]">
              <LayoutGrid
                className="h-5 w-5 text-foreground/40 group-hover:text-foreground/60"
                strokeWidth={1.5}
              />
            </div>
            <div>
              <p className="text-[13px] font-medium text-foreground/80">
                Board
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground/50">
                Organize tasks
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
