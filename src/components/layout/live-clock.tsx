import { useState, useEffect } from "react";

function formatTime(date: Date) {
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDate(date: Date) {
  return date.toLocaleDateString([], {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export function LiveClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    // Sync to the start of the next minute for precise updates
    const msUntilNextMinute =
      (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

    const initialTimeout = setTimeout(() => {
      setNow(new Date());
      const interval = setInterval(() => setNow(new Date()), 60_000);
      return () => clearInterval(interval);
    }, msUntilNextMinute);

    return () => clearTimeout(initialTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const time = formatTime(now);
  const date = formatDate(now);

  // Split time into the numeric part and the AM/PM suffix
  const [timePart, meridiem] = time.split(/\s/);

  return (
    <div className="px-3.5 py-3 select-none">
      <div className="flex items-baseline gap-1.5">
        <span className="font-serif text-[22px] font-medium tabular-nums leading-none tracking-tight text-sidebar-foreground/70">
          {timePart}
        </span>
        <span className="text-[10px] font-medium uppercase tracking-wider text-sidebar-foreground/30">
          {meridiem}
        </span>
      </div>
      <p className="mt-1 text-[11px] font-medium text-sidebar-foreground/30 tracking-wide">
        {date}
      </p>
    </div>
  );
}
