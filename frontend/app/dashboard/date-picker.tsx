"use client";

import { useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

// ── Design tokens ─────────────────────────────────────────────────────────
const CHARCOAL = "#2A2720";
const MUTED    = "#A09890";
const BORDER   = "#DDD7CC";
const CARD     = "#FAF9F7";
const SAGE     = "#5E7C64";

// ── Custom date picker — shared by the expense/income and savings dialogs ──
export function DatePicker({
  value, onChange,
  months, days, placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  months: readonly string[];
  days: readonly string[];
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);

  const selectedDate = value ? new Date(value + "T12:00:00") : null;
  const [viewYear,  setViewYear]  = useState(() => selectedDate?.getFullYear()  ?? new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => selectedDate?.getMonth()     ?? new Date().getMonth());

  const displayValue = selectedDate
    ? `${String(selectedDate.getDate()).padStart(2,"0")}/${String(selectedDate.getMonth()+1).padStart(2,"0")}/${selectedDate.getFullYear()}`
    : "";

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }
  function selectDay(day: number) {
    const d  = new Date(viewYear, viewMonth, day);
    const yy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    onChange(`${yy}-${mm}-${dd}`);
    setOpen(false);
  }

  // Monday-first grid
  const startOffset = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const today = new Date();

  return (
    <div style={{ position: "relative" }}>
      {/* Trigger — same underline style as other fields */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="millys-input"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          border: "none",
          borderBottom: `1px solid ${BORDER}`,
          background: "transparent",
          padding: "0 0 8px",
          color: displayValue ? CHARCOAL : MUTED,
          fontSize: "0.875rem",
          cursor: "pointer",
          outline: "none",
          fontFamily: "var(--font-sans)",
        }}
      >
        <span>{displayValue || placeholder}</span>
        <Calendar size={14} color={MUTED} />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div style={{ position: "fixed", inset: 0, zIndex: 49 }} onClick={() => setOpen(false)} />

          {/* Calendar card */}
          <div style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            zIndex: 50,
            background: CARD,
            border: "1px solid #EDE8DF",
            borderRadius: 16,
            padding: "16px 14px 14px",
            boxShadow: "0 16px 48px rgba(42,39,32,0.16), 0 4px 16px rgba(42,39,32,0.06)",
            minWidth: 252,
          }}>
            {/* Month / year navigation */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <button type="button" onClick={prevMonth} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px 6px", borderRadius: 8, color: MUTED, display: "flex" }}>
                <ChevronLeft size={16} />
              </button>
              <span style={{
                fontFamily: "var(--font-display), serif",
                fontStyle: "italic",
                fontWeight: 300,
                fontSize: "1rem",
                letterSpacing: "-0.01em",
                fontVariationSettings: '"SOFT" 100, "WONK" 1',
                color: CHARCOAL,
              }}>
                {months[viewMonth]} {viewYear}
              </span>
              <button type="button" onClick={nextMonth} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px 6px", borderRadius: 8, color: MUTED, display: "flex" }}>
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Week day headers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 }}>
              {days.map(d => (
                <span key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", color: MUTED, paddingBottom: 4 }}>
                  {d}
                </span>
              ))}
            </div>

            {/* Day cells */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
              {cells.map((day, i) => {
                if (!day) return <span key={i} />;
                const isSelected = !!(selectedDate &&
                  day === selectedDate.getDate() &&
                  viewMonth === selectedDate.getMonth() &&
                  viewYear === selectedDate.getFullYear());
                const isToday = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => selectDay(day)}
                    style={{
                      width: "100%",
                      aspectRatio: "1",
                      borderRadius: "50%",
                      border: isToday && !isSelected ? `1px solid ${SAGE}` : "none",
                      background: isSelected ? SAGE : "transparent",
                      color: isSelected ? CARD : CHARCOAL,
                      fontSize: 12,
                      fontWeight: isSelected ? 600 : 400,
                      cursor: "pointer",
                      transition: "background 0.1s ease",
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "#EDE8DF"; }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
