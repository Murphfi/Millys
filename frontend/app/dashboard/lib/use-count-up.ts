"use client";

import { useEffect, useRef, useState } from "react";

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Counts up from 0 to `target` whenever `trigger` changes (including mount) —
 * mirrors CategoryBars' width-from-0 animation in stats.tsx so hero numbers
 * "settle in" the same way the bars already do.
 */
export function useCountUp(target: number, trigger: unknown, duration = 700): number {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(target);
      return;
    }
    const start = performance.now();
    function tick(now: number) {
      const t = Math.min(1, (now - start) / duration);
      setDisplay(target * easeOutCubic(t));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, target, duration]);

  return display;
}
