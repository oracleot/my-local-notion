import { useEffect, useState } from "react";

export function CurrentTimeIndicator() {
  const [offsetRatio, setOffsetRatio] = useState(() => {
    const now = new Date();
    return (now.getMinutes() * 60 + now.getSeconds()) / 3600;
  });

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setOffsetRatio((now.getMinutes() * 60 + now.getSeconds()) / 3600);
    };

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <div
        className="absolute inset-y-0 bg-primary/[0.03] pointer-events-none"
        style={{
          left: "calc(4rem + 0.75rem)",
          width: `calc((100% - 4rem - 0.75rem - 0.5rem) * ${offsetRatio})`,
        }}
      />
      <div
        className="absolute h-[100%] w-[3px] bg-red-300 pointer-events-none z-10 rounded-full"
        style={{
          left: `calc(4rem + 0.75rem + (100% - 4rem - 0.75rem - 0.5rem) * ${offsetRatio})`,
        }}
      />
    </>
  );
}
