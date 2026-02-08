import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAppStore } from "@/stores/app-store";
import { useFocusTimer } from "@/lib/use-focus-timer";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Target, Pause, Play, Square, Plus } from "lucide-react";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function FocusTimerBadge() {
  const navigate = useNavigate();
  const session = useAppStore((s) => s.activeSession);
  const { pause, resume, stop, extend } = useFocusTimer();
  const [showControls, setShowControls] = useState(false);
  const controlsRef = useRef<HTMLDivElement>(null);

  // Close controls popover on outside click
  useEffect(() => {
    if (!showControls) return;
    function handleClick(e: MouseEvent) {
      if (
        controlsRef.current &&
        !controlsRef.current.contains(e.target as Node)
      ) {
        setShowControls(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showControls]);

  if (!session) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-[13px] text-muted-foreground/60 hover:text-foreground"
            onClick={() => navigate("/focus")}
          >
            <Target className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Focus</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          Open Focus view
          <kbd className="ml-1.5 font-mono text-[10px] text-muted-foreground">
            ⌘⇧F
          </kbd>
        </TooltipContent>
      </Tooltip>
    );
  }

  const isComplete = session.remainingSeconds <= 0;

  return (
    <div className="relative" ref={controlsRef}>
      <button
        onClick={() => setShowControls(!showControls)}
        className={`
          flex items-center gap-2 rounded-lg px-2.5 py-1.5
          text-[13px] font-medium transition-all duration-300
          ${
            isComplete
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              : session.isRunning
                ? "bg-primary/10 text-primary"
                : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
          }
          hover:opacity-80
        `}
      >
        {/* Pulsing indicator */}
        <span className="relative flex h-2 w-2">
          {session.isRunning && !isComplete && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
          )}
          <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
        </span>

        <span className="max-w-[120px] truncate">
          {session.cardTitle}
        </span>

        <span className="font-mono text-[12px] tabular-nums opacity-80">
          {formatTime(session.remainingSeconds)}
        </span>
      </button>

      {/* Quick controls popover */}
      {showControls && (
        <div className="absolute right-0 top-full z-50 mt-1.5 flex items-center gap-1 rounded-lg border border-border bg-popover p-1.5 shadow-lg">
          {!isComplete && (
            <>
              {session.isRunning ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        pause();
                        setShowControls(false);
                      }}
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
                      onClick={() => {
                        resume();
                        setShowControls(false);
                      }}
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
                onClick={() => {
                  extend(15 * 60);
                  setShowControls(false);
                }}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              +15 min
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => {
                  stop();
                  setShowControls(false);
                }}
              >
                <Square className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Stop
            </TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  );
}
