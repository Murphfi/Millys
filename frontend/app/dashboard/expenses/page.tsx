"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useLang, getCategoryLabel } from "../lib/i18n";
import { useCategories, type Category } from "../lib/categories";
import { useExpenses, type Expense } from "../lib/expenses";
import { ExpenseDialog } from "../add-expense-dialog";

const CHARCOAL = "#2A2720";
const STONE    = "#78726A";
const MUTED    = "#A09890";
const BORDER   = "#EDE8DF";
const CARD     = "#FAF9F7";

type ViewMode = "day" | "week" | "month";


// ── Date helpers ─────────────────────────────────────────────────────────────

function parseDate(iso: string): Date { return new Date(iso + "T12:00:00"); }

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getWeekStart(d: Date): Date {
  const out = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = out.getDay();
  out.setDate(out.getDate() + (dow === 0 ? -6 : 1 - dow));
  return out;
}

function getMonthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const dow = first.getDay();
  const start = new Date(year, month, 1 + (dow === 0 ? -6 : 1 - dow));
  const grid = Array.from({ length: 42 }, (_, i) =>
    new Date(start.getFullYear(), start.getMonth(), start.getDate() + i),
  );
  return grid[35].getMonth() !== month ? grid.slice(0, 35) : grid;
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtCurrency(n: number): string {
  return n.toLocaleString("es-ES", { minimumFractionDigits: 2 }) + " €";
}

// Mon-indexed weekday (Mon=0 … Sun=6)
function wdIdx(d: Date): number { return (d.getDay() + 6) % 7; }

// ── Shared primitives ─────────────────────────────────────────────────────────

function NavBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{ background: "transparent", border: "none", cursor: "pointer", color: STONE, display: "flex", padding: 5, borderRadius: 7, transition: "background 0.15s" }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "#EDE8DF"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >{children}</button>
  );
}

function ActionBtn({ icon: Icon, label, hoverColor, hoverBg, onClick }: {
  icon: typeof Pencil; label: string; hoverColor: string; hoverBg: string; onClick?: () => void;
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      style={{ background: "transparent", border: "none", cursor: "pointer", padding: 5, borderRadius: 6, color: MUTED, display: "flex", alignItems: "center", transition: "all 0.15s" }}
      onMouseEnter={(e) => { e.currentTarget.style.color = hoverColor; e.currentTarget.style.background = hoverBg; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = MUTED; e.currentTarget.style.background = "transparent"; }}
    >
      <Icon size={11} strokeWidth={1.8} />
    </button>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, color: MUTED, fontSize: "0.8rem", letterSpacing: "0.01em" }}>
      {label}
    </div>
  );
}

function Fraunces({ children, size = "1.55rem" }: { children: React.ReactNode; size?: string }) {
  return (
    <span style={{ fontFamily: "var(--font-display), serif", fontStyle: "italic", fontWeight: 300, fontSize: size, letterSpacing: "-0.02em", fontVariationSettings: '"SOFT" 100, "WONK" 1', color: CHARCOAL, lineHeight: 1 }}>
      {children}
    </span>
  );
}

// ── Kanban card ───────────────────────────────────────────────────────────────
// Amount in Fraunces — display font as ledger signature.
// Category shown as colored dot + text instead of filled badge.

function KanbanCard({ expense, catColor, catLabel }: {
  expense: Expense; catColor: string; catLabel: string;
}) {
  const [hovered,  setHovered]  = useState(false);
  const [editing,  setEditing]  = useState(false);
  const { deleteExpense, updateExpense } = useExpenses();
  return (
    <>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "flex",
          alignItems: "stretch",
          borderRadius: 10,
          border: `1px solid ${BORDER}`,
          background: hovered ? "rgba(42,39,32,0.018)" : CARD,
          overflow: "hidden",
          boxShadow: hovered
            ? "0 4px 14px rgba(42,39,32,0.09)"
            : "0 1px 2px rgba(42,39,32,0.04)",
          transition: "box-shadow 0.18s ease, background 0.18s ease",
          cursor: "default",
        }}
      >
        {/* Category color accent bar */}
        <div style={{ width: 4, flexShrink: 0, background: catColor }} />

        {/* Content */}
        <div style={{ flex: 1, padding: "9px 11px 9px 10px", display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.875rem", color: CHARCOAL, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.25 }}>
              {expense.description || catLabel}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
              {expense.description && (
                <>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: catColor, flexShrink: 0, display: "inline-block" }} />
                  <span style={{ fontSize: "0.635rem", color: STONE, fontWeight: 500, letterSpacing: "0.01em" }}>
                    {catLabel}
                  </span>
                  <span style={{ fontSize: "0.635rem", color: MUTED, lineHeight: 1 }}>·</span>
                </>
              )}
              <span style={{ fontSize: "0.635rem", color: MUTED }}>
                {expense.userName}
              </span>
            </div>
          </div>

          <Fraunces size="1.05rem">{fmtCurrency(expense.amount)}</Fraunces>

          <div style={{ flexShrink: 0, display: "flex", gap: 1, opacity: hovered ? 1 : 0, transition: "opacity 0.18s ease" }}>
            <ActionBtn icon={Pencil} label="Editar"   hoverColor={CHARCOAL}  hoverBg="#EDE8DF" onClick={() => setEditing(true)} />
            <ActionBtn icon={Trash2} label="Eliminar" hoverColor="#EF4444"   hoverBg="#FEF2F2" onClick={() => deleteExpense(expense.id)} />
          </div>
        </div>
      </div>

      <ExpenseDialog
        open={editing}
        onOpenChange={setEditing}
        initialValues={expense}
        onSubmit={(data) => updateExpense(expense.id, data)}
      />
    </>
  );
}

// ── Day section header ────────────────────────────────────────────────────────
// Total only shown when count ≥ 2, to avoid repeating the same figure as the lone card.

function DaySection({ label, total, count, isToday, todayLabel, children }: {
  label: string; total: number; count: number; isToday: boolean; todayLabel: string; children: React.ReactNode;
}) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: "0.695rem", fontWeight: 700, letterSpacing: "0.065em", textTransform: "uppercase", color: isToday ? CHARCOAL : STONE, flexShrink: 0 }}>
          {label}
        </span>
        {isToday && (
          <span style={{ fontSize: "0.565rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: CARD, background: CHARCOAL, padding: "1.5px 6px", borderRadius: 999, flexShrink: 0 }}>
            {todayLabel}
          </span>
        )}
        <div style={{ flex: 1, height: 1, background: "rgba(42,39,32,0.10)" }} />
        {count >= 2 && <Fraunces size="0.92rem">{fmtCurrency(total)}</Fraunces>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {children}
      </div>
    </div>
  );
}

// ── View mode tabs ────────────────────────────────────────────────────────────

function ViewTabs({ active, onChange }: { active: ViewMode; onChange: (v: ViewMode) => void }) {
  const { t } = useLang();
  const tabs: { key: ViewMode; label: string }[] = [
    { key: "day",   label: t.expenses.viewDay },
    { key: "week",  label: t.expenses.viewWeek },
    { key: "month", label: t.expenses.viewMonth },
  ];
  return (
    <div style={{ display: "flex", gap: 2, background: "#EEEBE4", borderRadius: 999, padding: 3 }}>
      {tabs.map(({ key, label }) => {
        const on = active === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            style={{
              padding: "4px 14px", borderRadius: 999, border: "none",
              background: on ? CARD : "transparent",
              color: on ? CHARCOAL : STONE,
              fontSize: "0.72rem", fontWeight: on ? 600 : 400,
              cursor: "pointer", transition: "all 0.2s ease",
              boxShadow: on ? "0 1px 3px rgba(42,39,32,0.10)" : "none",
              whiteSpace: "nowrap",
              letterSpacing: on ? "0.01em" : "0",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ── Month scroll strip ────────────────────────────────────────────────────────
// Two rows: year strip (centered) + month strip (centered carousel with edge fades).
// Active: Fraunces italic. Adjacent ±1: intermediate weight/size.
// Hover: spring scale. Edges: gradient fade revealing depth.

function MonthStrip({ selectedDate, setSelectedDate, expenses }: {
  selectedDate: Date;
  setSelectedDate: (d: Date) => void;
  expenses: Expense[];
}) {
  const { t } = useLang();
  const scrollRef  = useRef<HTMLDivElement>(null);
  const btnRefs    = useRef<(HTMLButtonElement | null)[]>([]);
  const mounted    = useRef(false);
  const month      = selectedDate.getMonth();
  const year       = selectedDate.getFullYear();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const availableYears = useMemo(() => {
    const s = new Set(
      expenses.map(e => parseDate(e.date).getFullYear()).filter(Number.isFinite)
    );
    return [...s].sort();
  }, [expenses]);

  useEffect(() => {
    const btn   = btnRefs.current[month];
    const strip = scrollRef.current;
    if (!btn || !strip) return;

    btn.style.animation = "none";
    void btn.offsetHeight;
    btn.style.animation = "millys-month-pop 0.42s cubic-bezier(0.34, 1.56, 0.64, 1) both";

    const target = btn.offsetLeft - strip.clientWidth / 2 + btn.offsetWidth / 2;
    if (!mounted.current) {
      strip.scrollLeft = target;
      mounted.current = true;
    } else {
      strip.scrollTo({ left: target, behavior: "smooth" });
    }
  }, [month]);

  function handleYearClick(y: number) {
    if (y === year) return;
    const maxDay = new Date(y, month + 1, 0).getDate();
    setSelectedDate(new Date(y, month, Math.min(selectedDate.getDate(), maxDay)));
  }

  function handleMonthClick(i: number) {
    if (i === month) return;
    const maxDay = new Date(year, i + 1, 0).getDate();
    setSelectedDate(new Date(year, i, Math.min(selectedDate.getDate(), maxDay)));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
      {/* Year strip — centered */}
      <div
        className="millys-scroll-hidden"
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 2,
          overflowX: "auto",
          padding: "5px 16px 4px",
          borderBottom: `1px solid rgba(42,39,32,0.07)`,
        }}
      >
        {availableYears.map(y => {
          const active = y === year;
          return (
            <button
              key={y}
              onClick={() => handleYearClick(y)}
              style={{
                flexShrink: 0,
                padding: "1px 10px",
                borderRadius: 999,
                border: "none",
                background: active ? CHARCOAL : "transparent",
                color: active ? CARD : MUTED,
                fontSize: "0.6rem",
                fontWeight: active ? 700 : 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: availableYears.length > 1 ? "pointer" : "default",
                transition: "background 0.15s ease, color 0.15s ease",
              }}
              onMouseEnter={(e) => { if (!active && availableYears.length > 1) e.currentTarget.style.background = "#EDE8DF"; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
            >
              {y}
            </button>
          );
        })}
      </div>

      {/* Month strip — centered carousel with gradient edge fades */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 560, position: "relative" }}>
          {/* Left edge fade */}
          <div style={{
            position: "absolute", left: 0, top: 0, bottom: 0, width: 56,
            background: `linear-gradient(to right, ${CARD} 15%, transparent 100%)`,
            pointerEvents: "none", zIndex: 1,
          }} />
          {/* Right edge fade */}
          <div style={{
            position: "absolute", right: 0, top: 0, bottom: 0, width: 56,
            background: `linear-gradient(to left, ${CARD} 15%, transparent 100%)`,
            pointerEvents: "none", zIndex: 1,
          }} />

          {/* Scrollable months — padding centers first/last at scroll extremes */}
          <div
            ref={scrollRef}
            className="millys-scroll-hidden"
            style={{
              display: "flex",
              gap: 3,
              overflowX: "auto",
              padding: "8px calc(50% - 48px)",
            }}
          >
            {(t.calendar.months as readonly string[]).map((name, i) => {
              const active   = i === month;
              const dist     = Math.abs(i - month);
              const isHov    = hoveredIdx === i;
              const scale    = isHov ? 1.12 : 1;

              return (
                <button
                  key={i}
                  ref={el => { btnRefs.current[i] = el; }}
                  onClick={() => handleMonthClick(i)}
                  onMouseEnter={() => { if (!active) setHoveredIdx(i); }}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{
                    flexShrink: 0,
                    padding: active ? "5px 18px" : "5px 14px",
                    borderRadius: 999,
                    border: "none",
                    background: active ? CHARCOAL : isHov ? "#EDE8DF" : "transparent",
                    // Active: Fraunces. Adjacent: bolder weight. Others: regular.
                    color: active ? CARD : dist === 1 ? CHARCOAL : STONE,
                    fontFamily: active ? "var(--font-display), serif" : "inherit",
                    fontStyle: active ? "italic" : "normal",
                    fontWeight: active ? 300 : dist === 1 ? 600 : 400,
                    fontVariationSettings: active ? '"SOFT" 100, "WONK" 1' : "normal",
                    fontSize: active ? "0.88rem" : dist === 1 ? "0.79rem" : "0.72rem",
                    letterSpacing: active ? "-0.01em" : "0.01em",
                    cursor: "pointer",
                    transform: `scale(${scale})`,
                    transition: "background 0.18s ease, color 0.18s ease, transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    transformOrigin: "center",
                  }}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Category bar chart ────────────────────────────────────────────────────────

function CategoryBars({ expenses, month, year, getCat }: {
  expenses: Expense[];
  month: number;
  year: number;
  getCat: (id: string) => Category | undefined;
}) {
  const { t } = useLang();
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 50);
    return () => { clearTimeout(timer); setAnimated(false); };
  }, [month]);

  const entries = useMemo(() => {
    const map: Record<string, { color: string; label: string; amount: number }> = {};
    expenses
      .filter(e => { const d = parseDate(e.date); return d.getMonth() === month && d.getFullYear() === year; })
      .forEach(e => {
        const cat = getCat(e.categoryId);
        map[e.categoryId] ??= { color: cat?.color ?? MUTED, label: cat ? getCategoryLabel(cat, t) : e.categoryId, amount: 0 };
        map[e.categoryId].amount += e.amount;
      });
    return Object.values(map).sort((a, b) => b.amount - a.amount);
  }, [expenses, month, year, getCat, t]);

  if (entries.length === 0) return null;

  const maxAmt = entries[0].amount;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      {entries.map(({ color, label, amount }, i) => (
        <div key={label}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: color, flexShrink: 0, display: "inline-block" }} />
            <span style={{ fontSize: "0.595rem", fontWeight: 500, color: STONE, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
              {label}
            </span>
            <span style={{ fontSize: "0.595rem", color: CHARCOAL, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
              {fmtCurrency(amount)}
            </span>
          </div>
          <div style={{ height: 5, background: "#EDE8DF", borderRadius: 999, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: animated ? `${(amount / maxAmt) * 100}%` : "0%",
              background: color,
              borderRadius: 999,
              transition: "width 0.55s cubic-bezier(0.34, 1.56, 0.64, 1)",
              transitionDelay: `${i * 60}ms`,
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Month summary (total + category bars) ────────────────────────────────────

function MonthSummary({ expenses, month, year, getCat }: {
  expenses: Expense[];
  month: number;
  year: number;
  getCat: (id: string) => Category | undefined;
}) {
  const { t } = useLang();
  const monthTotal = useMemo(() =>
    expenses
      .filter(e => { const d = parseDate(e.date); return d.getMonth() === month && d.getFullYear() === year; })
      .reduce((s, e) => s + e.amount, 0),
    [expenses, month, year],
  );
  if (monthTotal === 0) return null;
  return (
    <>
      <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: MUTED, display: "block", marginBottom: 5 }}>
        {t.expenses.total}
      </span>
      <Fraunces size="1.4rem">{fmtCurrency(monthTotal)}</Fraunces>
      <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: MUTED, display: "block", marginTop: 16, marginBottom: 8 }}>
        {t.expenses.categoryTitle}
      </span>
      <CategoryBars expenses={expenses} month={month} year={year} getCat={getCat} />
    </>
  );
}

// ── Mini calendar (right panel) ───────────────────────────────────────────────

function MiniCalendar({ selectedDate, setSelectedDate, expenses, getCat }: {
  selectedDate: Date;
  setSelectedDate: (d: Date) => void;
  expenses: Expense[];
  getCat: (id: string) => Category | undefined;
}) {
  const { t } = useLang();
  const today = useMemo(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }, []);

  const month = selectedDate.getMonth();
  const year  = selectedDate.getFullYear();
  const grid  = useMemo(() => getMonthGrid(year, month), [year, month]);

  const expByDate = useMemo(() => {
    const map: Record<string, Expense[]> = {};
    expenses.forEach(e => { (map[e.date] ??= []).push(e); });
    return map;
  }, [expenses]);

  return (
    <div
      className="millys-scroll-hidden"
      style={{
        padding: "12px 16px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        overflowY: "auto",
        flex: 1,
        minHeight: 0,
      }}
    >
      {/* Day-of-week headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
        {(t.calendar.days as readonly string[]).map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: "0.56rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: MUTED, padding: "1px 0 3px" }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "1px 0" }}>
        {grid.map((day, idx) => {
          const inMonth   = day.getMonth() === month;
          const isToday   = sameDay(day, today);
          const isSel     = sameDay(day, selectedDate);
          const dayExps   = expByDate[toDateKey(day)] ?? [];
          const dotColors = [...new Set(dayExps.map(e => getCat(e.categoryId)?.color ?? MUTED))].slice(0, 3);

          return (
            <button
              key={idx}
              onClick={() => setSelectedDate(new Date(day.getFullYear(), day.getMonth(), day.getDate()))}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                padding: "4px 1px 2px", borderRadius: 6,
                border: isToday && !isSel ? "1.5px solid rgba(42,39,32,0.20)" : "1.5px solid transparent",
                cursor: "pointer",
                background: isSel ? CHARCOAL : "transparent",
                color: isSel ? "#FAF9F7" : inMonth ? CHARCOAL : MUTED,
                opacity: inMonth ? 1 : 0.3,
                transition: "background 0.12s, border-color 0.12s",
                minHeight: 34,
                outline: "none",
              }}
              onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.background = "#EDE8DF"; }}
              onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ fontSize: "0.7rem", fontWeight: isToday || isSel ? 700 : 400, lineHeight: 1.2, fontVariantNumeric: "tabular-nums" }}>
                {day.getDate()}
              </span>
              <div style={{ display: "flex", gap: 1.5, marginTop: 2, minHeight: 4 }}>
                {dotColors.map((color, i) => (
                  <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: isSel ? "rgba(250,249,247,0.55)" : color }} />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Desktop-only: total + category bars */}
      <div className="hidden md:block" style={{ marginTop: 4, paddingTop: 12, borderTop: `1px solid ${BORDER}` }}>
        <MonthSummary expenses={expenses} month={month} year={year} getCat={getCat} />
      </div>
    </div>
  );
}

// ── Day view ──────────────────────────────────────────────────────────────────

function DayView({ expenses, selectedDate, setSelectedDate, getCat }: {
  expenses: Expense[];
  selectedDate: Date;
  setSelectedDate: (d: Date) => void;
  getCat: (id: string) => Category | undefined;
}) {
  const { t } = useLang();
  const today = useMemo(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }, []);

  const dayExps = useMemo(() =>
    expenses
      .filter(e => sameDay(parseDate(e.date), selectedDate))
      .sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime()),
    [expenses, selectedDate],
  );
  const isToday = sameDay(selectedDate, today);

  function shiftDay(d: number) {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + d);
    setSelectedDate(next);
  }

  const monthNames = t.calendar.months;
  const dayLabel = `${t.expenses.weekDays[wdIdx(selectedDate)]} ${selectedDate.getDate()} ${monthNames[selectedDate.getMonth()]}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 2, padding: "11px 20px", borderBottom: `1px solid ${BORDER}` }}>
        <NavBtn onClick={() => shiftDay(-1)}><ChevronLeft size={15} strokeWidth={1.8} /></NavBtn>
        <span style={{ fontSize: "0.875rem", color: CHARCOAL, fontWeight: 600, minWidth: 190, textAlign: "center" }}>
          {dayLabel}
          {isToday && (
            <span style={{ marginLeft: 8, fontSize: "0.565rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: CARD, background: CHARCOAL, padding: "2px 7px", borderRadius: 999, verticalAlign: "middle" }}>
              {t.expenses.today}
            </span>
          )}
        </span>
        <NavBtn onClick={() => shiftDay(1)}><ChevronRight size={15} strokeWidth={1.8} /></NavBtn>
      </div>

      <div className="millys-scroll-hidden" style={{ flex: 1, overflowY: "auto", padding: "14px 16px 20px" }}>
        {dayExps.length === 0 ? (
          <EmptyState label={t.expenses.empty} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {dayExps.map(e => {
              const cat = getCat(e.categoryId);
              return <KanbanCard key={e.id} expense={e} catColor={cat?.color ?? MUTED} catLabel={cat ? getCategoryLabel(cat, t) : e.categoryId} />;
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Week view ─────────────────────────────────────────────────────────────────

function WeekView({ expenses, selectedDate, setSelectedDate, getCat }: {
  expenses: Expense[];
  selectedDate: Date;
  setSelectedDate: (d: Date) => void;
  getCat: (id: string) => Category | undefined;
}) {
  const { t } = useLang();
  const today = useMemo(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }, []);

  const weekStart = getWeekStart(selectedDate);
  const weekEnd   = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6);

  const weekDays = useMemo(() =>
    Array.from({ length: 7 }, (_, i) =>
      new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i),
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [toDateKey(weekStart)],
  );

  const byDay = useMemo(() =>
    weekDays
      .map(day => ({ day, exps: expenses.filter(e => sameDay(parseDate(e.date), day)).sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime()) }))
      .filter(({ exps }) => exps.length > 0),
    [weekDays, expenses],
  );

  function shiftWeek(d: number) {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + d * 7);
    setSelectedDate(next);
  }

  const monthNames = t.calendar.months;
  const weekLabel = weekStart.getMonth() === weekEnd.getMonth()
    ? `${weekStart.getDate()}–${weekEnd.getDate()} ${monthNames[weekStart.getMonth()].slice(0, 3)}`
    : `${weekStart.getDate()} ${monthNames[weekStart.getMonth()].slice(0, 3)} – ${weekEnd.getDate()} ${monthNames[weekEnd.getMonth()].slice(0, 3)}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 2, padding: "11px 20px", borderBottom: `1px solid ${BORDER}` }}>
        <NavBtn onClick={() => shiftWeek(-1)}><ChevronLeft size={15} strokeWidth={1.8} /></NavBtn>
        <span style={{ fontSize: "0.875rem", color: CHARCOAL, fontWeight: 600, minWidth: 160, textAlign: "center" }}>
          {weekLabel}
        </span>
        <NavBtn onClick={() => shiftWeek(1)}><ChevronRight size={15} strokeWidth={1.8} /></NavBtn>
      </div>

      <div className="millys-scroll-hidden" style={{ flex: 1, overflowY: "auto", padding: "14px 16px 20px" }}>
        {byDay.length === 0 ? (
          <EmptyState label={t.expenses.empty} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {byDay.map(({ day, exps }) => {
              const isToday  = sameDay(day, today);
              const dayTotal = exps.reduce((s, e) => s + e.amount, 0);
              const label    = `${t.expenses.weekDays[wdIdx(day)]} ${day.getDate()}`;
              return (
                <DaySection key={toDateKey(day)} label={label} total={dayTotal} count={exps.length} isToday={isToday} todayLabel={t.expenses.today}>
                  {exps.map(e => {
                    const cat = getCat(e.categoryId);
                    return <KanbanCard key={e.id} expense={e} catColor={cat?.color ?? MUTED} catLabel={cat ? getCategoryLabel(cat, t) : e.categoryId} />;
                  })}
                </DaySection>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Month view ────────────────────────────────────────────────────────────────

function MonthView({ expenses, selectedDate, getCat }: {
  expenses: Expense[];
  selectedDate: Date;
  getCat: (id: string) => Category | undefined;
}) {
  const { t } = useLang();
  const today = useMemo(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }, []);

  const month = selectedDate.getMonth();
  const year  = selectedDate.getFullYear();

  const byDay = useMemo(() => {
    const monthExps = expenses.filter(e => {
      const d = parseDate(e.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });

    const groups: Record<string, Expense[]> = {};
    monthExps.forEach(e => { (groups[e.date] ??= []).push(e); });

    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, exps]) => ({ date, exps: exps.sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime()) }));
  }, [expenses, month, year]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div className="millys-scroll-hidden" style={{ flex: 1, overflowY: "auto", padding: "14px 16px 20px" }}>
        {byDay.length === 0 ? (
          <EmptyState label={t.expenses.empty} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {byDay.map(({ date, exps }) => {
              const day      = parseDate(date);
              const isToday  = sameDay(day, today);
              const dayTotal = exps.reduce((s, e) => s + e.amount, 0);
              const label    = `${t.expenses.weekDays[wdIdx(day)]} ${day.getDate()}`;
              return (
                <DaySection key={date} label={label} total={dayTotal} count={exps.length} isToday={isToday} todayLabel={t.expenses.today}>
                  {exps.map(e => {
                    const cat = getCat(e.categoryId);
                    return <KanbanCard key={e.id} expense={e} catColor={cat?.color ?? MUTED} catLabel={cat ? getCategoryLabel(cat, t) : e.categoryId} />;
                  })}
                </DaySection>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const SESSION_DATE   = "millys_expenses_date";
const SESSION_VIEW   = "millys_expenses_view";
const MIN_RIGHT_W    = 340;
const RIGHT_W_KEY    = "millys_right_panel_w";

export default function ExpensesPage() {
  const [categories]      = useCategories();
  const { expenses }      = useExpenses();
  const now = new Date();

  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedDate, setSelectedDate] = useState(() =>
    new Date(now.getFullYear(), now.getMonth(), now.getDate()),
  );
  const [rightWidth, setRightWidth] = useState(MIN_RIGHT_W);
  const [isDesktop,  setIsDesktop]  = useState(false);

  // Refs for drag-to-resize (no re-renders during drag)
  const isDragging     = useRef(false);
  const dragStartX     = useRef(0);
  const dragStartW     = useRef(0);
  const currentW       = useRef(MIN_RIGHT_W);

  // Restore persisted state after hydration (survives devtools responsive-mode reloads)
  useEffect(() => {
    const rawDate = sessionStorage.getItem(SESSION_DATE);
    if (rawDate) {
      const parts = rawDate.split("-").map(Number);
      if (parts.length === 3) setSelectedDate(new Date(parts[0], parts[1] - 1, parts[2]));
    }
    const rawView = sessionStorage.getItem(SESSION_VIEW) as ViewMode | null;
    if (rawView && ["day", "week", "month"].includes(rawView)) setViewMode(rawView);

    const savedW = parseInt(localStorage.getItem(RIGHT_W_KEY) ?? "");
    if (!isNaN(savedW) && savedW >= MIN_RIGHT_W) { setRightWidth(savedW); currentW.current = savedW; }

    const mq = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mq.matches);
    const onMq = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", onMq);
    return () => mq.removeEventListener("change", onMq);
  }, []);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current  = true;
    dragStartX.current  = e.clientX;
    dragStartW.current  = currentW.current;

    function onMove(ev: MouseEvent) {
      if (!isDragging.current) return;
      const delta = dragStartX.current - ev.clientX;
      const newW  = Math.max(MIN_RIGHT_W, Math.min(window.innerWidth * 0.5, dragStartW.current + delta));
      setRightWidth(newW);
      currentW.current = newW;
    }
    function onUp() {
      isDragging.current = false;
      localStorage.setItem(RIGHT_W_KEY, String(currentW.current));
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, []);

  function updateDate(d: Date) {
    sessionStorage.setItem(SESSION_DATE, toDateKey(d));
    setSelectedDate(d);
  }

  function updateView(v: ViewMode) {
    sessionStorage.setItem(SESSION_VIEW, v);
    setViewMode(v);
  }

  function getCat(id: string) { return categories.find(c => c.id === id); }

  const shared = { expenses, selectedDate, setSelectedDate: updateDate, getCat };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Month + year scroll strip */}
      <MonthStrip selectedDate={selectedDate} setSelectedDate={updateDate} expenses={expenses} />

      {/* Body */}
      <div className="flex-col md:flex-row millys-mobile-body" style={{ flex: 1, overflow: "hidden", display: "flex" }}>
        {/* Left column: expense views + mobile-only summary below the list */}
        <div className="millys-mobile-col" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
          <div className="millys-mobile-card" style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 0 }}>
            {viewMode === "day"   && <DayView   {...shared} />}
            {viewMode === "week"  && <WeekView  {...shared} />}
            {viewMode === "month" && <MonthView selectedDate={selectedDate} expenses={expenses} getCat={getCat} />}
          </div>
          {/* Mobile-only: total + bars after the expense list */}
          <div className="md:hidden millys-mobile-card" style={{ flexShrink: 0, padding: "14px 16px 20px" }}>
            <MonthSummary expenses={expenses} month={selectedDate.getMonth()} year={selectedDate.getFullYear()} getCat={getCat} />
          </div>
        </div>

        {/* Right panel — ViewTabs + calendar + bars */}
        <div
          className="order-first md:order-last flex-shrink-0 w-full md:border-l millys-mobile-card"
          style={{
            borderColor: BORDER,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            position: "relative",
            ...(isDesktop ? { width: rightWidth, flexShrink: 0 } : {}),
          }}
        >
          {/* Drag handle — desktop only */}
          <div
            className="hidden md:flex"
            onMouseDown={handleResizeStart}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 8,
              cursor: "col-resize",
              zIndex: 10,
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(94,124,100,0.10)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <div style={{ width: 2, height: 28, borderRadius: 1, background: "rgba(42,39,32,0.12)" }} />
          </div>

          {/* View tabs live here — contextually near the calendar */}
          <div style={{ flexShrink: 0, display: "flex", justifyContent: "center", padding: "10px 16px 9px", borderBottom: `1px solid ${BORDER}` }}>
            <ViewTabs active={viewMode} onChange={updateView} />
          </div>
          <MiniCalendar {...shared} />
        </div>
      </div>
    </div>
  );
}
