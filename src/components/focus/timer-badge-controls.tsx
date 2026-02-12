import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Pause, Play, Square, Sparkles } from "lucide-react";

interface TimerBadgeControlsProps {
  isRunning: boolean;
  isComplete: boolean;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onZenMode: () => void;
}

export function TimerBadgeControls({
  isRunning,
  isComplete,
  onPause,
  onResume,
  onStop,
  onZenMode,
}: TimerBadgeControlsProps) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-secondary/60 p-0.5 backdrop-blur-sm">
      {!isComplete && (
        <>
          {isRunning ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg text-muted-foreground transition-all duration-200 hover:scale-105 hover:bg-amber-500/15 hover:text-amber-600 active:scale-95 dark:hover:text-amber-400"
                  onClick={onPause}
                >
                  <Pause className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="rounded-lg border-none bg-foreground/90 px-2.5 py-1.5 text-xs font-medium text-background backdrop-blur-sm"
              >
                Pause timer
              </TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg text-muted-foreground transition-all duration-200 hover:scale-105 hover:bg-emerald-500/15 hover:text-emerald-600 active:scale-95 dark:hover:text-emerald-400"
                  onClick={onResume}
                >
                  <Play className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="rounded-lg border-none bg-foreground/90 px-2.5 py-1.5 text-xs font-medium text-background backdrop-blur-sm"
              >
                Resume timer
              </TooltipContent>
            </Tooltip>
          )}
        </>
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="group/zen h-7 w-7 rounded-lg text-muted-foreground transition-all duration-200 hover:scale-105 hover:bg-violet-500/15 hover:text-violet-600 active:scale-95 dark:hover:text-violet-400"
            onClick={onZenMode}
          >
            <Sparkles className="h-3.5 w-3.5 transition-transform duration-300 group-hover/zen:rotate-12" />
          </Button>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="flex items-center gap-2 rounded-lg border-none bg-foreground/90 px-2.5 py-1.5 text-xs font-medium text-background backdrop-blur-sm"
        >
          Enter Zen mode
          <kbd className="rounded bg-background/20 px-1.5 py-0.5 font-mono text-[10px]">
            ⌘⇧Z
          </kbd>
        </TooltipContent>
      </Tooltip>

      <div className="mx-0.5 h-4 w-px bg-border/50" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg text-muted-foreground transition-all duration-200 hover:scale-105 hover:bg-rose-500/15 hover:text-rose-600 active:scale-95 dark:hover:text-rose-400"
            onClick={onStop}
          >
            <Square className="h-3 w-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="rounded-lg border-none bg-foreground/90 px-2.5 py-1.5 text-xs font-medium text-background backdrop-blur-sm"
        >
          End session
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
