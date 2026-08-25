"use client";

// Full-screen overlay shown between submitting login and landing on the
// dashboard. Sage background bridges the login page (sand) to the dashboard
// chrome (sage frame), so the transition reads as one continuous motion
// instead of a hard cut. Also doubles as the Render free-tier cold-start
// screen: the message swaps after a threshold if the backend is still
// waking up, so a slow first request reads as "waking up" instead of "stuck".
export function LoginTransitionOverlay({
  phase,
  coldStart,
}: {
  phase: "in" | "out";
  coldStart: boolean;
}) {
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
        background: "#5E7C64",
        animation: phase === "in"
          ? "millys-overlay-in 0.3s ease-in-out both"
          : "millys-overlay-out 0.28s ease-in-out both",
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
          animation: phase === "in" ? "millys-mark-in 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.08s both" : undefined,
        }}
      >
        Millys<span style={{ color: "#A78BFA" }}>.</span>
      </h1>

      <div style={{ display: "flex", gap: 6, marginTop: 22 }}>
        {[0, 1, 2].map((i) => (
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
        ))}
      </div>

      <p style={{
        marginTop: 18,
        fontSize: "0.8rem",
        color: "#D4E8D6",
        textAlign: "center",
        maxWidth: 260,
        minHeight: "1.2em",
      }}>
        {coldStart ? "Despertando el servidor — puede tardar unos segundos…" : "Entrando…"}
      </p>
    </div>
  );
}
