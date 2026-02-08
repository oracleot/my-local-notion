import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Pause, Play, Square, Maximize } from "lucide-react";

interface TimerBadgeControlsProps {
  isRunning: boolean;
  isComplete: boolean;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onZenMode: () => void;
  onDismiss: () => void;
}

export function TimerBadgeControls({
  isRunning,
  isComplete,
  onPause,
  onResume,
  onStop,
  onZenMode,
  onDismiss,
}: TimerBadgeControlsProps) {
  return (
    <div className="absolute right-0 top-full z-50 mt-1.5 flex items-center gap-1 rounded-lg border border-border bg-popover p-1.5 shadow-lg">
      {!isComplete && (
        <>
          {isRunning ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => { onPause(); onDismiss(); }}
                >
                  <Pause className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Pause
              </TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => { onResume(); onDismiss(); }}
                >
                  <Play className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Resume
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
            className="h-7 w-7"
            onClick={() => { onZenMode(); onDismiss(); }}
          >
            <Maximize className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          Zen Mode
          <kbd className="ml-1.5 font-mono text-[10px] text-muted-foreground">
            ⌘⇧Z
          </kbd>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => { onStop(); onDismiss(); }}
          >
            <Square className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          Stop
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
