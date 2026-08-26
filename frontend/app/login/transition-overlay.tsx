"use client";

import { Check } from "lucide-react";

// Where the sage circle reveal expands from — the submit button's own
// position, so the overlay reads as "diving into" the button rather than
// appearing from nowhere. Exported as the single source of truth (the login
// page computes it, this component only consumes it).
export type RevealOrigin = { x: number; y: number; radius: number };

// Full-screen overlay shown between submitting login and landing on the
// dashboard. Sage background bridges the login page (sand) to the dashboard
// chrome (sage frame), so the transition reads as one continuous motion
// instead of a hard cut. Also doubles as the Render free-tier cold-start
// screen: the message swaps after a threshold if the backend is still
// waking up, so a slow first request reads as "waking up" instead of "stuck".
//
// `origin` is the submit button's on-screen position — when present, the
// overlay expands as a circle from that exact point (clip-path), so the
// button visually "opens up" into the loading screen instead of a plain
// cross-fade. Falls back to a fade when unavailable (e.g. no layout yet).
//
// `done` marks the brief beat after a successful login but before the actual
// navigation — the pulsing dots resolve into a checkmark instead of just
// cutting away, so the login → loading → dashboard sequence reads as one
// finished motion rather than three disconnected screens.
export function LoginTransitionOverlay({
  phase,
  coldStart,
  done,
  origin,
}: {
  phase: "in" | "out";
  coldStart: boolean;
  done: boolean;
  origin: RevealOrigin | null;
}) {
  const useCircleReveal = phase === "in" && !!origin;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        background: "#5E7C64",
        ...(origin
          ? ({
              "--reveal-x": `${origin.x}px`,
              "--reveal-y": `${origin.y}px`,
              "--reveal-r": `${origin.radius}px`,
            } as React.CSSProperties)
          : {}),
        animation: phase === "in"
          ? useCircleReveal
            ? "millys-reveal-in 0.55s cubic-bezier(0.16,1,0.3,1) both"
            : "millys-overlay-in 0.3s ease-in-out both"
          : "millys-overlay-out 0.28s ease-in-out both",
      }}
    >
      {/* Faint ledger-line texture — the same "Night Ledger" nod as the login
          card's backdrop, so the two screens read as one continuous world. */}
      <div aria-hidden className="millys-ledger-lines" style={{ position: "absolute", inset: 0, ["--ledger-color" as string]: "rgba(237,232,222,0.05)" }} />
      {/* Oversized italic "M" watermark — the brand mark itself as background
          texture, premium-fintech-style, instead of illustrated characters. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          right: "-10%",
          bottom: "-22%",
          fontFamily: "var(--font-display), serif",
          fontStyle: "italic",
          fontWeight: 300,
          fontSize: "clamp(320px, 68vh, 860px)",
          lineHeight: 1,
          color: "rgba(255,255,255,0.06)",
          userSelect: "none",
        }}
      >
        M
      </div>

      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          animation: phase === "in" ? "millys-stagger-in 0.4s cubic-bezier(0.23,1,0.32,1) 0.45s both" : undefined,
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-display), serif",
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: "3rem",
            lineHeight: 1,
            letterSpacing: "-0.02em",
            fontVariationSettings: '"SOFT" 100, "WONK" 1',
            color: "#EDE8DE",
            margin: 0,
          }}
        >
          Millys<span style={{ color: "#EDE8DE", opacity: 0.6 }}>.</span>
        </h1>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 22, height: 24 }}>
          {done ? (
            <span
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 24, height: 24, borderRadius: "50%",
                background: "#EDE8DE",
                animation: "millys-month-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
              }}
            >
              <Check size={14} strokeWidth={3} color="#5E7C64" />
            </span>
          ) : (
            [0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#EDE8DE",
                  animation: `millys-dot-pulse 1.1s ease-in-out ${i * 0.15}s infinite`,
                }}
              />
            ))
          )}
        </div>

        <p style={{
          marginTop: 18,
          fontSize: "0.8rem",
          color: "#D4E8D6",
          textAlign: "center",
          maxWidth: 260,
          minHeight: "1.2em",
        }}>
          {done ? "¡Listo!" : coldStart ? "Despertando el servidor — puede tardar unos segundos…" : "Entrando…"}
        </p>
      </div>
    </div>
  );
}
