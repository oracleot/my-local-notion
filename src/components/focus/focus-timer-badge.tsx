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
import { Target } from "lucide-react";
import { TimerBadgeControls } from "./timer-badge-controls";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function FocusTimerBadge() {
  const navigate = useNavigate();
  const session = useAppStore((s) => s.activeSession);
  const activePageType = useAppStore((s) => s.activePageType);
  const toggleZenMode = useAppStore((s) => s.toggleZenMode);
  const { pause, resume, stop, remainingSeconds } = useFocusTimer();
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

  // When no active session, only show Focus button on Kanban pages
  if (!session) {
    if (activePageType !== "kanban") return null;
    
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

  const isComplete = remainingSeconds <= 0;

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
        <span className="relative flex h-2 w-2">
          {session.isRunning && !isComplete && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
          )}
          <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
        </span>
        <span className="max-w-[120px] truncate">{session.cardTitle}</span>
        <span className="font-mono text-[12px] tabular-nums opacity-80">
          {formatTime(remainingSeconds)}
        </span>
      </button>

      {showControls && (
        <TimerBadgeControls
          isRunning={session.isRunning}
          isComplete={isComplete}
          onPause={pause}
          onResume={resume}
          onStop={stop}
          onZenMode={toggleZenMode}
          onDismiss={() => setShowControls(false)}
        />
      )}
    </div>
  );
}
