"use client";

import { X } from "lucide-react";

const BORDER = "#EDE8DF";

export function SyncErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div
      style={{
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 16px",
        background: "#FEF2F2",
        borderBottom: `1px solid ${BORDER}`,
        color: "#B91C1C",
        fontSize: "0.78rem",
      }}
    >
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={onDismiss}
        aria-label="Cerrar"
        style={{ background: "transparent", border: "none", cursor: "pointer", color: "#B91C1C", display: "flex", padding: 2 }}
      >
        <X size={13} strokeWidth={2} />
      </button>
    </div>
  );
}
