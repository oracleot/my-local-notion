import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Pause, Play, Square } from "lucide-react";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

interface ZenModeTimerProps {
  remainingSeconds: number;
  cardTitle: string;
  boardName: string;
  isRunning: boolean;
  isComplete: boolean;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export function ZenModeTimer({
  remainingSeconds,
  cardTitle,
  boardName,
  isRunning,
  isComplete,
  onPause,
  onResume,
  onStop,
}: ZenModeTimerProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      {/* Board name */}
      <p className="text-[13px] tracking-wide text-white/30 uppercase">
        {boardName}
      </p>

      {/* Task title */}
      <h2 className="max-w-[80vw] truncate text-center text-2xl font-semibold text-white/90 sm:text-3xl">
        {cardTitle}
      </h2>

      {/* Large countdown */}
      <div className="font-mono text-7xl font-light tabular-nums tracking-wider text-white sm:text-8xl md:text-9xl">
        {formatTime(remainingSeconds)}
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-2 text-[13px] text-white/40">
        <span className="relative flex h-2 w-2">
          {isRunning && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          )}
          <span
            className={`relative inline-flex h-2 w-2 rounded-full ${
              isComplete
                ? "bg-emerald-400"
                : isRunning
                  ? "bg-emerald-400"
                  : "bg-amber-400"
            }`}
          />
        </span>
        <span>
          {isComplete ? "complete" : isRunning ? "running" : "paused"}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {!isComplete && (
          <>
            {isRunning ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-white/60 hover:bg-white/10 hover:text-white"
                    onClick={onPause}
                  >
                    <Pause className="h-5 w-5" />
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
                    className="h-10 w-10 text-white/60 hover:bg-white/10 hover:text-white"
                    onClick={onResume}
                  >
                    <Play className="h-5 w-5" />
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
              className="h-10 w-10 text-white/60 hover:bg-white/10 hover:text-white"
              onClick={onStop}
            >
              <Square className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            Stop
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
