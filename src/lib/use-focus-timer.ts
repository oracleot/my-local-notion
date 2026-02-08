import { useEffect, useRef, useState, useCallback } from "react";
import { useAppStore, getRemainingSeconds } from "@/stores/app-store";

/**
 * Manages the focus timer using wall-clock timestamps.
 * Uses requestAnimationFrame for smooth, drift-free countdown.
 * Triggers continuous audio chime when the timer reaches zero.
 */
export function useFocusTimer() {
  const activeSession = useAppStore((s) => s.activeSession);
  const audioEnabled = useAppStore((s) => s.focusSettings.audioEnabled);
  const pause = useAppStore((s) => s.pauseSession);
  const resume = useAppStore((s) => s.resumeSession);
  const stop = useAppStore((s) => s.endSession);
  const start = useAppStore((s) => s.startSession);

  const chimeRef = useRef<{ stop: () => void } | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastSecondRef = useRef<number>(-1);

  // Derive remaining seconds — recalculated each animation frame
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    activeSession ? getRemainingSeconds(activeSession) : 0
  );

  // Animation frame loop — only runs while session is running
  useEffect(() => {
    if (!activeSession?.isRunning) {
      // Update once for paused state
      if (activeSession) {
        setRemainingSeconds(getRemainingSeconds(activeSession));
      }
      return;
    }

    lastSecondRef.current = -1;

    function tick() {
      const session = useAppStore.getState().activeSession;
      if (!session || !session.isRunning) return;

      const remaining = getRemainingSeconds(session);

      // Only update React state when the displayed second changes
      if (remaining !== lastSecondRef.current) {
        lastSecondRef.current = remaining;
        setRemainingSeconds(remaining);
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [activeSession?.isRunning]); // eslint-disable-line react-hooks/exhaustive-deps

  // Stop chime when session ends or component unmounts
  useEffect(() => {
    return () => {
      chimeRef.current?.stop();
      chimeRef.current = null;
    };
  }, []);

  // Stop chime if session is cleared
  useEffect(() => {
    if (!activeSession) {
      chimeRef.current?.stop();
      chimeRef.current = null;
      setRemainingSeconds(0);
    }
  }, [activeSession]);

  // Audio notification on completion — continuous until stopped
  useEffect(() => {
    if (remainingSeconds <= 0 && activeSession && !chimeRef.current) {
      if (audioEnabled) {
        chimeRef.current = playChimeLoop();
      }
    }
  }, [remainingSeconds, audioEnabled, activeSession]);

  const stopWithChime = useCallback(() => {
    chimeRef.current?.stop();
    chimeRef.current = null;
    stop();
  }, [stop]);

  const isComplete = activeSession !== null && remainingSeconds <= 0;

  return {
    activeSession,
    remainingSeconds,
    isRunning: activeSession?.isRunning ?? false,
    isPaused: activeSession !== null && !activeSession.isRunning && !isComplete,
    isComplete,
    start,
    pause,
    resume,
    stop: stopWithChime,
  };
}

// ─── Audio ──────────────────────────────────────────────────────────────────

function playChimeLoop(): { stop: () => void } {
  let stopped = false;
  let ctx: AudioContext | null = null;

  function scheduleChime() {
    if (stopped) return;
    try {
      if (!ctx) ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.setValueAtTime(1318.5, ctx.currentTime + 0.15); // E6
      osc.frequency.setValueAtTime(1760, ctx.currentTime + 0.3); // A6

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.8);

      // Repeat every 2 seconds
      osc.onended = () => {
        if (!stopped) setTimeout(scheduleChime, 1200);
      };
    } catch {
      // Silently fail if AudioContext is unavailable
    }
  }

  scheduleChime();

  return {
    stop: () => {
      stopped = true;
      if (ctx) {
        ctx.close().catch(() => {});
        ctx = null;
      }
    },
  };
}
