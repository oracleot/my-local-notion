import { useEffect, useCallback } from "react";
import { useAppStore } from "@/stores/app-store";
import { useFocusTimer } from "@/lib/use-focus-timer";
import { ZenModeTimer } from "./zen-mode-timer";
import { ZenModeJournal } from "./zen-mode-journal";
import { SessionCompleteDialog } from "./session-complete-dialog";
import { X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ZenModeOverlay() {
  const zenMode = useAppStore((s) => s.zenMode);
  const session = useAppStore((s) => s.activeSession);
  const toggleZenMode = useAppStore((s) => s.toggleZenMode);
  const { pause, resume, stop, extend, isRunning, isComplete } =
    useFocusTimer();

  // Escape key to exit
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        toggleZenMode();
      }
    },
    [toggleZenMode]
  );

  useEffect(() => {
    if (!zenMode) return;
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [zenMode, handleKeyDown]);

  if (!zenMode || !session) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-neutral-950/98 backdrop-blur-sm">
      {/* Close button */}
      <div className="absolute right-4 top-4 z-10">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={toggleZenMode}
              className="rounded-lg p-2 text-white/20 transition-colors hover:bg-white/5 hover:text-white/50"
            >
              <X className="h-5 w-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="text-xs">
            Exit Zen Mode
            <kbd className="ml-1.5 font-mono text-[10px] text-muted-foreground">
              ESC
            </kbd>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Timer section */}
      <ZenModeTimer
        remainingSeconds={session.remainingSeconds}
        cardTitle={session.cardTitle}
        boardName={session.boardName}
        isRunning={isRunning}
        isComplete={isComplete}
        onPause={pause}
        onResume={resume}
        onStop={stop}
        onExtend={() => extend(15 * 60)}
      />

      {/* Journal section */}
      <ZenModeJournal cardId={session.cardId} />

      {/* Session complete dialog renders on top */}
      {isComplete && <SessionCompleteDialog />}
    </div>
  );
}
