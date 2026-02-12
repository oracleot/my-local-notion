import { useNavigate } from "react-router";
import { Target } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function FocusEntryButton() {
  const navigate = useNavigate();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => navigate("/focus")}
          className="group relative flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-500/10 to-indigo-500/10 px-2.5 py-1.5 text-xs font-medium text-violet-600 ring-1 ring-inset ring-violet-500/20 transition-all duration-300 hover:from-violet-500/15 hover:to-indigo-500/15 hover:shadow-[0_0_12px_rgba(139,92,246,0.12)] dark:text-violet-400 dark:ring-violet-500/25 dark:hover:shadow-[0_0_12px_rgba(167,139,250,0.15)]"
        >
          {/* Subtle shimmer on hover */}
          <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <span className="absolute -inset-full animate-[shimmer_2s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </span>

          <Target className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-45 group-hover:scale-105" />
          <span className="hidden sm:inline">Focus</span>
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        className="flex items-center gap-2 rounded-lg border-none bg-foreground/90 px-2.5 py-1.5 text-xs font-medium text-background backdrop-blur-sm"
      >
        Open Focus view
        <kbd className="rounded bg-background/20 px-1.5 py-0.5 font-mono text-[10px]">
          ⌘⇧F
        </kbd>
      </TooltipContent>
    </Tooltip>
  );
}
