import { useEffect, useRef } from "react";
import { useAppStore } from "@/stores/app-store";

/**
 * Manages the focus timer interval. Ticks every second while a session
 * is running. Triggers audio chime when the timer reaches zero.
 */
export function useFocusTimer() {
  const activeSession = useAppStore((s) => s.activeSession);
  const audioEnabled = useAppStore((s) => s.focusSettings.audioEnabled);
  const tick = useAppStore((s) => s.tickSession);
  const pause = useAppStore((s) => s.pauseSession);
  const resume = useAppStore((s) => s.resumeSession);
  const stop = useAppStore((s) => s.endSession);
  const extend = useAppStore((s) => s.extendSession);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasPlayedRef = useRef(false);

  // Reset hasPlayed when a new session starts
  useEffect(() => {
    if (activeSession && activeSession.remainingSeconds > 0) {
      hasPlayedRef.current = false;
    }
  }, [activeSession?.cardId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Tick interval
  useEffect(() => {
    if (activeSession?.isRunning) {
      intervalRef.current = setInterval(tick, 1000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [activeSession?.isRunning, tick]);

  // Audio notification on completion
  useEffect(() => {
    if (
      activeSession &&
      activeSession.remainingSeconds <= 0 &&
      !hasPlayedRef.current
    ) {
      hasPlayedRef.current = true;
      if (audioEnabled) playChime();
    }
  }, [activeSession?.remainingSeconds, audioEnabled]); // eslint-disable-line react-hooks/exhaustive-deps

  const start = useAppStore((s) => s.startSession);

  return {
    activeSession,
    isRunning: activeSession?.isRunning ?? false,
    isPaused: activeSession !== null && !activeSession.isRunning,
    isComplete:
      activeSession !== null && activeSession.remainingSeconds <= 0,
    start,
    pause,
    resume,
    stop,
    extend,
  };
}

// ─── Audio ──────────────────────────────────────────────────────────────────

function playChime() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // Pleasant two-tone chime
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.setValueAtTime(1318.5, ctx.currentTime + 0.15); // E6
    osc.frequency.setValueAtTime(1760, ctx.currentTime + 0.3); // A6

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.8);
  } catch {
    // Silently fail if AudioContext is unavailable
  }
}
