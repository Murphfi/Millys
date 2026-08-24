"use client";

import { useEffect, useRef, useState, useMemo, useCallback, Suspense } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import { Pencil, Trash2, ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from "lucide-react";
import { useLang, getCategoryLabel } from "../lib/i18n";
import { useCategories, type Category } from "../lib/categories";
import { useExpenses, type Expense } from "../lib/expenses";
import { ExpenseDialog } from "../add-expense-dialog";
import { useTopBarSlot } from "../lib/topbar-slot";
import { SyncErrorBanner } from "../sync-error-banner";
import {
  CategoryBars, getMonthTotal, getMonthComparisonPct, getUserTotals, getPrevMonth,
  getMonthGrid, toDateKey, todayDate as today, isSameDay as sameDay,
} from "../lib/stats";

const CHARCOAL = "#2A2720";
const STONE    = "#78726A";
const MUTED    = "#A09890";
const BORDER   = "#EDE8DF";
const CARD     = "#FAF9F7";
const SAGE     = "#5E7C64";

type ViewMode = "day" | "week" | "month";


// ── Date helpers ─────────────────────────────────────────────────────────────

function parseDate(iso: string): Date { return new Date(iso + "T12:00:00"); }

function getWeekStart(d: Date): Date {
  const out = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = out.getDay();
  out.setDate(out.getDate() + (dow === 0 ? -6 : 1 - dow));
  return out;
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

function MonthStrip({ selectedDate, setSelectedDate, expenses, bordered = true }: {
  selectedDate: Date;
  setSelectedDate: (d: Date) => void;
  expenses: Expense[];
  bordered?: boolean;
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
    <div style={{ display: "flex", flexDirection: "column", borderBottom: bordered ? `1px solid ${BORDER}` : "none", flexShrink: 0 }}>
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


// ── Month summary (total + category bars) ────────────────────────────────────

function MonthSummary({ expenses, month, year, getCat, selectedCategory, onSelectCategory }: {
  expenses: Expense[];
  month: number;
  year: number;
  getCat: (id: string) => Category | undefined;
  selectedCategory?: string | null;
  onSelectCategory?: (id: string | null) => void;
}) {
  const { t } = useLang();
  const monthTotal  = useMemo(() => getMonthTotal(expenses, month, year), [expenses, month, year]);
  const userTotals  = useMemo(() => getUserTotals(expenses, month, year), [expenses, month, year]);
  const pct         = useMemo(() => getMonthComparisonPct(expenses, month, year), [expenses, month, year]);
  const prevMonth   = getPrevMonth(month, year).month;

  if (monthTotal === 0) return null;

  // Down = calm sage (spending less isn't inherently "good", just gentler framing).
  // Up = neutral stone, never red — this isn't an alert, just context.

  return (
    <>
      <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: MUTED, display: "block", marginBottom: 5 }}>
        {t.expenses.total}
      </span>
      <Fraunces size="1.4rem">{fmtCurrency(monthTotal)}</Fraunces>
      {pct !== null && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
          {pct <= 0
            ? <TrendingDown size={12} strokeWidth={2} color={SAGE} />
            : <TrendingUp size={12} strokeWidth={2} color={STONE} />}
          <span style={{ fontSize: "0.68rem", fontWeight: 600, color: pct <= 0 ? SAGE : STONE }}>
            {pct > 0 ? "+" : ""}{Math.round(pct)}%
          </span>
          <span style={{ fontSize: "0.68rem", color: MUTED }}>
            vs {t.calendar.months[prevMonth]}
          </span>
        </div>
      )}
      {userTotals.length > 1 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "3px 10px", marginTop: 8 }}>
          {userTotals.map(([name, amount]) => (
            <span key={name} style={{ display: "inline-flex", alignItems: "baseline", gap: 5, fontSize: "0.68rem", color: STONE, whiteSpace: "nowrap" }}>
              {name}
              <span style={{ color: CHARCOAL, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{fmtCurrency(amount)}</span>
            </span>
          ))}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 16, marginBottom: 8 }}>
        <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: MUTED }}>
          {t.expenses.categoryTitle}
        </span>
        {selectedCategory != null && (
          <button
            onClick={() => onSelectCategory?.(null)}
            style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0, fontSize: "0.6rem", fontWeight: 600, color: SAGE, textDecoration: "underline", textUnderlineOffset: 2 }}
          >
            {t.expenses.clearFilter}
          </button>
        )}
      </div>
      <CategoryBars expenses={expenses} month={month} year={year} getCat={getCat} selected={selectedCategory} onSelect={onSelectCategory} />
    </>
  );
}

// ── Mini calendar (right panel) ───────────────────────────────────────────────

function MiniCalendar({ selectedDate, setSelectedDate, expenses, getCat, categoryFilter, onCategoryFilterChange }: {
  selectedDate: Date;
  setSelectedDate: (d: Date) => void;
  expenses: Expense[];
  getCat: (id: string) => Category | undefined;
  categoryFilter?: string | null;
  onCategoryFilterChange?: (id: string | null) => void;
}) {
  const { t } = useLang();

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
          const isToday   = sameDay(day, today());
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
        <MonthSummary expenses={expenses} month={month} year={year} getCat={getCat} selectedCategory={categoryFilter} onSelectCategory={onCategoryFilterChange} />
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

  const dayExps = useMemo(() =>
    expenses
      .filter(e => sameDay(parseDate(e.date), selectedDate))
      .sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime()),
    [expenses, selectedDate],
  );
  const isToday = sameDay(selectedDate, today());

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

// ── Day-grouped list (shared by Week and Month views) ─────────────────────────

function DayGroupedList({ groups, getCat, t, emptyLabel }: {
  groups: { key: string; day: Date; exps: Expense[] }[];
  getCat: (id: string) => Category | undefined;
  t: ReturnType<typeof useLang>["t"];
  emptyLabel: string;
}) {
  return (
    <div className="millys-scroll-hidden" style={{ flex: 1, overflowY: "auto", padding: "14px 16px 20px" }}>
      {groups.length === 0 ? (
        <EmptyState label={emptyLabel} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {groups.map(({ key, day, exps }) => {
            const isToday  = sameDay(day, today());
            const dayTotal = exps.reduce((s, e) => s + e.amount, 0);
            const label    = `${t.expenses.weekDays[wdIdx(day)]} ${day.getDate()}`;
            return (
              <DaySection key={key} label={label} total={dayTotal} count={exps.length} isToday={isToday} todayLabel={t.expenses.today}>
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

      <DayGroupedList
        groups={byDay.map(({ day, exps }) => ({ key: toDateKey(day), day, exps }))}
        getCat={getCat}
        t={t}
        emptyLabel={t.expenses.empty}
      />
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
      <DayGroupedList
        groups={byDay.map(({ date, exps }) => ({ key: date, day: parseDate(date), exps }))}
        getCat={getCat}
        t={t}
        emptyLabel={t.expenses.empty}
      />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const SESSION_DATE   = "millys_expenses_date";
const SESSION_VIEW   = "millys_expenses_view";
const MIN_RIGHT_W    = 340;
const RIGHT_W_KEY    = "millys_right_panel_w";

export default function ExpensesPage() {
  return (
    <Suspense fallback={null}>
      <ExpensesPageInner />
    </Suspense>
  );
}

// useSearchParams() (for the ?category= deep link from Home) requires a Suspense
// boundary around its caller in the App Router — the wrapper above provides it.
function ExpensesPageInner() {
  const { categories }    = useCategories();
  const { expenses, ready, syncError, dismissSyncError } = useExpenses();
  const { t }              = useLang();
  const searchParams       = useSearchParams();
  const topBarSlot         = useTopBarSlot();
  const now = new Date();

  useEffect(() => {
    if (!syncError) return;
    const timer = setTimeout(dismissSyncError, 6000);
    return () => clearTimeout(timer);
  }, [syncError, dismissSyncError]);

  // Deep-linked from Home (?category=xyz, ?date=yyyy-mm-dd&view=day) — read once on
  // mount, then behave as normal state. Takes precedence over the sessionStorage
  // restore below, since arriving via a link is a more specific intent than whatever
  // was left over from the last visit.
  const deepLinkedDate = searchParams.get("date");
  const deepLinkedView = searchParams.get("view") as ViewMode | null;

  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    deepLinkedView && ["day", "week", "month"].includes(deepLinkedView) ? deepLinkedView : "month",
  );
  const [categoryFilter, setCategoryFilter] = useState<string | null>(() => searchParams.get("category"));
  const [selectedDate, setSelectedDate] = useState(() => {
    if (deepLinkedDate) {
      const parts = deepLinkedDate.split("-").map(Number);
      if (parts.length === 3) return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });
  const [rightWidth, setRightWidth] = useState(MIN_RIGHT_W);
  const [isDesktop,  setIsDesktop]  = useState(false);

  // Refs for drag-to-resize (no re-renders during drag)
  const isDragging     = useRef(false);
  const dragStartX     = useRef(0);
  const dragStartW     = useRef(0);
  const currentW       = useRef(MIN_RIGHT_W);

  // Restore persisted state after hydration (survives devtools responsive-mode reloads).
  // Skipped when a deep link provided its own date/view — that intent wins.
  useEffect(() => {
    if (!deepLinkedDate) {
      const rawDate = sessionStorage.getItem(SESSION_DATE);
      if (rawDate) {
        const parts = rawDate.split("-").map(Number);
        if (parts.length === 3) setSelectedDate(new Date(parts[0], parts[1] - 1, parts[2]));
      }
    }
    if (!deepLinkedView) {
      const rawView = sessionStorage.getItem(SESSION_VIEW) as ViewMode | null;
      if (rawView && ["day", "week", "month"].includes(rawView)) setViewMode(rawView);
    }

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

  // Category filter narrows the expense LIST only — the calendar dots and the
  // category bars themselves keep showing the full month, so you can still see
  // what you'd be switching to and clear the filter without losing context.
  const listExpenses = categoryFilter ? expenses.filter(e => e.categoryId === categoryFilter) : expenses;

  const shared = { expenses: listExpenses, selectedDate, setSelectedDate: updateDate, getCat };

  if (!ready) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <EmptyState label={t.expenses.loading} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {syncError && <SyncErrorBanner message={t.errors[syncError]} onDismiss={dismissSyncError} />}

      {/* Month + year scroll strip — portaled into the shell's topbar row on
          desktop (reuses that space instead of stacking a second header row);
          falls back to rendering inline here on mobile / before the slot mounts. */}
      {topBarSlot
        ? createPortal(
            <MonthStrip selectedDate={selectedDate} setSelectedDate={updateDate} expenses={expenses} bordered={false} />,
            topBarSlot,
          )
        : <MonthStrip selectedDate={selectedDate} setSelectedDate={updateDate} expenses={expenses} />}

      {/* Body */}
      <div className="flex-col md:flex-row millys-mobile-body" style={{ flex: 1, overflow: "hidden", display: "flex" }}>
        {/* Left column: expense views + mobile-only summary below the list */}
        <div className="millys-mobile-col" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
          <div className="millys-mobile-card" style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 0 }}>
            {viewMode === "day"   && <DayView   {...shared} />}
            {viewMode === "week"  && <WeekView  {...shared} />}
            {viewMode === "month" && <MonthView selectedDate={selectedDate} expenses={listExpenses} getCat={getCat} />}
          </div>
          {/* Mobile-only: total + bars after the expense list */}
          <div className="md:hidden millys-mobile-card" style={{ flexShrink: 0, padding: "14px 16px 20px" }}>
            <MonthSummary expenses={expenses} month={selectedDate.getMonth()} year={selectedDate.getFullYear()} getCat={getCat} selectedCategory={categoryFilter} onSelectCategory={setCategoryFilter} />
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
          <MiniCalendar selectedDate={selectedDate} setSelectedDate={updateDate} expenses={expenses} getCat={getCat} categoryFilter={categoryFilter} onCategoryFilterChange={setCategoryFilter} />
        </div>
      </div>
    </div>
  );
}
