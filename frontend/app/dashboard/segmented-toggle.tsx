"use client";

import { useLayoutEffect, useRef, useState } from "react";

const SAGE     = "#5E7C64";
const CARD     = "#FAF9F7";
const TRACK    = "#F2EBE1";
const INACTIVE = "#78726A";

// Sage-filled pill toggle with a background that slides between options
// instead of just swapping color — same track/fill language as the
// Gasto/Ingreso and Compartido/Personal toggles, now with real motion.
export function SegmentedToggle<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: readonly { value: T; label: React.ReactNode }[];
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Map<T, HTMLButtonElement>>(new Map());
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const el = btnRefs.current.get(value);
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [value, options.length]);

  return (
    <div
      ref={trackRef}
      style={{ position: "relative", display: "flex", gap: 3, padding: 3, background: TRACK, borderRadius: 999 }}
    >
      {indicator && (
        <div
          aria-hidden
          style={{
            position: "absolute", top: 3, bottom: 3, left: indicator.left, width: indicator.width,
            background: SAGE, borderRadius: 999,
            transition: "left 0.3s cubic-bezier(0.34,1.56,0.64,1), width 0.3s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        />
      )}
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            ref={(el) => { if (el) btnRefs.current.set(opt.value, el); }}
            type="button"
            onClick={() => onChange(opt.value)}
            style={{
              position: "relative", zIndex: 1, flex: 1, padding: "7px 11px", borderRadius: 999, border: "none",
              background: "transparent",
              color: active ? CARD : INACTIVE,
              fontSize: "0.72rem", fontWeight: active ? 600 : 500,
              cursor: "pointer", transition: "color 0.15s ease",
              whiteSpace: "nowrap",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
