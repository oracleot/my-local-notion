import { useAppStore } from "@/stores/app-store";
import { useFocusTimer } from "@/lib/use-focus-timer";
import { TimerBadgeControls } from "./timer-badge-controls";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function ProgressRing({
  progress,
  isRunning,
  isComplete,
}: {
  progress: number;
  isRunning: boolean;
  isComplete: boolean;
}) {
  const size = 24;
  const strokeWidth = 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <div className="relative flex shrink-0 items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="opacity-15"
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-1000 ease-linear"
        />
      </svg>
      {/* Center indicator */}
      <span
        className={`
          absolute h-1.5 w-1.5 rounded-full bg-current
          ${isRunning && !isComplete ? "animate-[pulse_2s_ease-in-out_infinite]" : ""}
        `}
      />
    </div>
  );
}

export function FocusTimerBadge() {
  const session = useAppStore((s) => s.activeSession);
  const toggleZenMode = useAppStore((s) => s.toggleZenMode);
  const { pause, resume, stop, remainingSeconds, totalSeconds } =
    useFocusTimer();
  if (!session) return null;

  const isComplete = remainingSeconds <= 0;
  const progress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;

  // Dynamic status-based styling
  const statusStyles = isComplete
    ? "from-emerald-500/20 to-emerald-500/5 text-emerald-600 dark:text-emerald-400 ring-emerald-500/30"
    : session.isRunning
      ? "from-violet-500/15 to-indigo-500/10 text-violet-600 dark:text-violet-400 ring-violet-500/25"
      : "from-amber-500/15 to-orange-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/25";

  const glowStyles = session.isRunning && !isComplete
    ? "shadow-[0_0_20px_rgba(139,92,246,0.15)] dark:shadow-[0_0_20px_rgba(167,139,250,0.2)]"
    : "";

  return (
    <div className="group flex min-w-0 items-center gap-1.5">
      {/* Main timer display */}
      <div
        className={`
          relative flex min-w-0 items-center gap-2.5 
          rounded-xl bg-gradient-to-r px-3 py-1.5
          ring-1 ring-inset backdrop-blur-sm
          transition-all duration-500 ease-out
          ${statusStyles}
          ${glowStyles}
        `}
      >
        {/* Subtle animated background shimmer when running */}
        {session.isRunning && !isComplete && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
            <div className="absolute -inset-full animate-[shimmer_3s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
          </div>
        )}

        {/* Progress ring with center dot */}
        <ProgressRing
          progress={progress}
          isRunning={session.isRunning}
          isComplete={isComplete}
        />

        {/* Task info */}
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="max-w-[120px] truncate text-xs font-semibold leading-tight tracking-tight">
            {session.cardTitle}
          </span>
          <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider opacity-70">
            {isComplete ? (
              "Complete"
            ) : session.isRunning ? (
              <>
                <span className="inline-block h-1 w-1 animate-pulse rounded-full bg-current" />
                Running
              </>
            ) : (
              "Paused"
            )}
          </span>
        </div>

        {/* Time display */}
        <div className="ml-0.5 flex flex-col items-end">
          <span className="font-mono text-base font-bold tabular-nums leading-none tracking-tight">
            {formatTime(remainingSeconds)}
          </span>
          <span className="text-[9px] font-medium uppercase tracking-wider opacity-50">
            remaining
          </span>
        </div>
      </div>

      {/* Controls */}
      <TimerBadgeControls
        isRunning={session.isRunning}
        isComplete={isComplete}
        onPause={pause}
        onResume={resume}
        onStop={stop}
        onZenMode={toggleZenMode}
      />
    </div>
  );
}
