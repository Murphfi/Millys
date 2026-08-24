"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { useLang, getCategoryLabel } from "../lib/i18n";
import { useCategories, type Category } from "../lib/categories";
import { useExpenses, type Expense } from "../lib/expenses";
import { useIncome } from "../lib/income";
import {
  CategoryBars, getMonthTotal, getMonthComparisonPct, getUserTotals, getPrevMonth, parseExpenseDate,
  getMonthGrid, toDateKey, todayDate, isSameDay, getCategoryComparison,
} from "../lib/stats";
import { ExpenseDialog } from "../add-expense-dialog";

const CHARCOAL = "#2A2720";
const STONE    = "#78726A";
const MUTED    = "#A09890";
const BORDER   = "#EDE8DF";
const CARD     = "#FAF9F7";
const SAGE     = "#5E7C64";

function fmtCurrency(n: number): string {
  return n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

function Fraunces({ children, size = "1.55rem", as: As = "span" }: { children: React.ReactNode; size?: string; as?: "span" | "h1" }) {
  return (
    <As style={{ fontFamily: "var(--font-display), serif", fontStyle: "italic", fontWeight: 300, fontSize: size, letterSpacing: "-0.02em", fontVariationSettings: '"SOFT" 100, "WONK" 1', color: CHARCOAL, lineHeight: 1, margin: 0 }}>
      {children}
    </As>
  );
}

const SECTION_STYLE: React.CSSProperties = {
  background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: "20px 24px",
};

const LABEL_STYLE: React.CSSProperties = {
  fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: MUTED,
};

/**
 * Current-month calendar grid — every day is a shortcut to that day's view in
 * Gastos, not a second place to analyze spending. Days outside the current
 * month are shown for grid completeness but aren't clickable (Home never
 * navigates you to a different month — that's what Global is for).
 */
function MonthCalendar({ expenses, month, year, getCat }: {
  expenses: Expense[];
  month: number;
  year: number;
  getCat: (id: string) => Category | undefined;
}) {
  const { t } = useLang();
  const router = useRouter();
  const grid = useMemo(() => getMonthGrid(year, month), [year, month]);
  const today = todayDate();

  const expByDate = useMemo(() => {
    const map: Record<string, Expense[]> = {};
    expenses.forEach(e => { (map[e.date] ??= []).push(e); });
    return map;
  }, [expenses]);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
        {(t.calendar.days as readonly string[]).map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: MUTED, padding: "1px 0 6px" }}>
            {d}
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "3px 0" }}>
        {grid.map((day, idx) => {
          const inMonth   = day.getMonth() === month;
          const isToday   = isSameDay(day, today);
          const dayExps   = inMonth ? (expByDate[toDateKey(day)] ?? []) : [];
          const dotColors = [...new Set(dayExps.map(e => getCat(e.categoryId)?.color ?? MUTED))].slice(0, 3);

          if (!inMonth) {
            return <div key={idx} className="min-h-11" />;
          }

          return (
            <button
              key={idx}
              className="millys-day-cell min-h-11"
              onClick={() => router.push(`/dashboard/expenses?date=${toDateKey(day)}&view=day`)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                padding: "7px 1px 4px", borderRadius: 8,
                border: isToday ? `1.5px solid ${SAGE}` : "1.5px solid transparent",
                cursor: "pointer", background: "transparent", color: CHARCOAL,
                outline: "none",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(42,39,32,0.045)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ fontSize: "0.88rem", fontWeight: isToday ? 700 : 400, lineHeight: 1.2, fontVariantNumeric: "tabular-nums" }}>
                {day.getDate()}
              </span>
              <div style={{ display: "flex", gap: 3, marginTop: 4, minHeight: 5 }}>
                {dotColors.map((color, i) => (
                  <div key={i} style={{ width: 4.5, height: 4.5, borderRadius: "50%", background: color }} />
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Fixed per-person colors (not by rank) so Murphfi/Lilly keep the same segment
// color every month regardless of who spent more. Unknown names (e.g. Test's
// seeded "Usuario 1"/"Usuario 2") fall back to the neutral brand tones.
const USER_COLORS: Record<string, string> = {
  Murphfi: "#9AB89D", // lighter sage — same token as the sidebar's inactive nav green
  Lilly:   "#D9A0A8", // muted rose, kept as desaturated as the rest of the palette
};
const USER_COLOR_FALLBACK = [SAGE, STONE, MUTED];

function getUserColor(name: string, index: number): string {
  return USER_COLORS[name] ?? USER_COLOR_FALLBACK[index % USER_COLOR_FALLBACK.length];
}

/** Stacked bar + legend showing how the month splits between the people spending. */
function UserSplit({ userTotals, total }: { userTotals: [string, number][]; total: number }) {
  return (
    <div>
      <div style={{ display: "flex", height: 10, borderRadius: 999, overflow: "hidden", background: "#EDE8DF" }}>
        {userTotals.map(([name, amount], i) => (
          <div key={name} style={{ width: `${(amount / total) * 100}%`, background: getUserColor(name, i) }} />
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 22px", marginTop: 14 }}>
        {userTotals.map(([name, amount], i) => (
          <div key={name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: getUserColor(name, i), flexShrink: 0 }} />
            <span style={{ fontSize: "0.8rem", color: STONE }}>{name}</span>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: CHARCOAL, fontVariantNumeric: "tabular-nums" }}>{fmtCurrency(amount)}</span>
            <span style={{ fontSize: "0.7rem", color: MUTED }}>{Math.round((amount / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Every category with spend this month, each with its % change vs the previous
 * month — same set and order as the category-breakdown panel it sits next to,
 * so the two stay the same length instead of one trailing off with blank space.
 */
function CategoryVariation({ expenses, month, year, getCat }: {
  expenses: Expense[];
  month: number;
  year: number;
  getCat: (id: string) => Category | undefined;
}) {
  const { t } = useLang();
  const router = useRouter();
  const entries = useMemo(
    () => getCategoryComparison(expenses, month, year, getCat, t, MUTED),
    [expenses, month, year, getCat, t],
  );

  if (entries.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {entries.map(({ id, color, label, amount, pctChange }) => (
        <button
          key={id}
          className="millys-recent-row"
          onClick={() => router.push(`/dashboard/expenses?category=${id}`)}
          style={{
            display: "flex", alignItems: "center", gap: 10, width: "100%",
            padding: "8px 6px", borderRadius: 10, border: "none", background: "transparent",
            cursor: "pointer", textAlign: "left",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(42,39,32,0.03)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: "0.82rem", color: CHARCOAL, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {label}
          </span>
          <span style={{ fontSize: "0.78rem", color: MUTED, fontVariantNumeric: "tabular-nums" }}>{fmtCurrency(amount)}</span>
          {pctChange === null ? (
            <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: SAGE, background: "#E4EDE5", padding: "2px 7px", borderRadius: 999, flexShrink: 0 }}>
              {t.home.newCategory}
            </span>
          ) : (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: "0.75rem", fontWeight: 600, color: pctChange <= 0 ? SAGE : STONE, minWidth: 48, justifyContent: "flex-end", flexShrink: 0 }}>
              {pctChange <= 0 ? <TrendingDown size={12} strokeWidth={2} /> : <TrendingUp size={12} strokeWidth={2} />}
              {pctChange > 0 ? "+" : ""}{Math.round(pctChange)}%
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export default function DashboardHome() {
  const router = useRouter();
  const { t } = useLang();
  const { categories } = useCategories();
  const { expenses, ready, updateExpense } = useExpenses();
  const { income } = useIncome();
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const now   = new Date();
  const month = now.getMonth();
  const year  = now.getFullYear();

  function getCat(id: string) { return categories.find(c => c.id === id); }

  const monthTotal = useMemo(() => getMonthTotal(expenses, month, year), [expenses, month, year]);
  const pct        = useMemo(() => getMonthComparisonPct(expenses, month, year), [expenses, month, year]);
  const { month: prevMonth, year: prevYear } = getPrevMonth(month, year);
  const prevMonthTotal = useMemo(() => getMonthTotal(expenses, prevMonth, prevYear), [expenses, prevMonth, prevYear]);
  const userTotals = useMemo(() => getUserTotals(expenses, month, year), [expenses, month, year]);
  const monthIncomeTotal = useMemo(() => getMonthTotal(income, month, year), [income, month, year]);
  const incomeUserTotals = useMemo(() => getUserTotals(income, month, year), [income, month, year]);

  const recent = useMemo(() =>
    expenses
      .slice()
      .sort((a, b) => parseExpenseDate(b.date).getTime() - parseExpenseDate(a.date).getTime())
      .slice(0, 6),
    [expenses],
  );

  // Simple linear projection from days elapsed — not shown until there are at least
  // a few days of data, since 1-2 days extrapolated over a month is just noise.
  const daysElapsed  = now.getDate();
  const daysInMonth  = new Date(year, month + 1, 0).getDate();
  const projection   = daysElapsed >= 3 && monthTotal > 0
    ? (monthTotal / daysElapsed) * daysInMonth
    : null;

  if (!ready) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: MUTED, fontSize: "0.8rem" }}>
        {t.expenses.loading}
      </div>
    );
  }

  return (
    <div className="millys-scroll-hidden" style={{ height: "100%", overflowY: "auto", padding: "28px 20px 32px" }}>
      <div className="max-w-xl md:max-w-none w-full mx-auto flex flex-col gap-5">

        {/* Hero — deliberately NOT a bordered card like the panels below it (or like
            Gastos' sidebar summary, which this used to just be a scaled-up copy of).
            It sits straight on the page as a headline; the boxed panels are for data
            you'd scan, this is the one number you're here to see. */}
        <div className="w-full" style={{ textAlign: "center", padding: "8px 28px 4px" }}>
          <span style={{ ...LABEL_STYLE, display: "block", marginBottom: 4 }}>
            {t.expenses.total}
          </span>
          <span style={{ ...LABEL_STYLE, fontSize: "1rem", letterSpacing: "0.05em", display: "block", marginBottom: 8 }}>
            {t.calendar.months[month]} {year}
          </span>
          <Fraunces as="h1" size="clamp(3rem, 6vw, 4.5rem)">{fmtCurrency(monthTotal)}</Fraunces>

          {(pct !== null || projection !== null) && (
            <div className="flex flex-col md:flex-row md:items-center md:justify-center" style={{ marginTop: 16, gap: "10px 32px" }}>
              {pct !== null && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "center" }}>
                  {pct <= 0
                    ? <TrendingDown size={14} strokeWidth={2} color={SAGE} />
                    : <TrendingUp size={14} strokeWidth={2} color={STONE} />}
                  <span style={{ fontSize: "0.78rem", fontWeight: 600, color: pct <= 0 ? SAGE : STONE }}>
                    {pct > 0 ? "+" : ""}{Math.round(pct)}%
                  </span>
                  <span style={{ fontSize: "0.78rem", color: MUTED }}>
                    vs {t.calendar.months[prevMonth]} <span style={{ fontVariantNumeric: "tabular-nums" }}>({fmtCurrency(prevMonthTotal)})</span>
                  </span>
                </div>
              )}
              {projection !== null && (
                <span style={{ fontSize: "0.78rem", color: STONE }}>
                  {t.home.projection} <span style={{ color: CHARCOAL, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>≈ {fmtCurrency(projection)}</span>
                </span>
              )}
            </div>
          )}

          <Link
            href="/dashboard/expenses"
            className="inline-flex items-center"
            style={{ gap: 4, marginTop: 18, fontSize: "0.72rem", fontWeight: 600, color: SAGE }}
          >
            {t.home.viewAllExpenses}
            <ArrowRight size={13} strokeWidth={2} />
          </Link>
        </div>

        {/* Main content — left column (category chart + variation, then recent expenses)
            plus a right-hand sidebar (calendar + split), mirroring Gastos' list-vs-sidebar
            layout instead of three same-width panels in a row. */}
        <div className="flex flex-col md:flex-row gap-5">
          {/* Left column */}
          <div className="flex-1 min-w-0 flex flex-col gap-5">
            {monthTotal > 0 && (
              <div className="flex flex-col md:flex-row md:items-start gap-5">
                {/* Category breakdown — same chart as Gastos, clicking deep-links there pre-filtered.
                    Wider bars than Gastos' sidebar version (a mid-point with Reparto's bar) since
                    this panel has more room to itself here. */}
                <div className="md:flex-[1.5]" style={SECTION_STYLE}>
                  <span style={{ ...LABEL_STYLE, display: "block", marginBottom: 12 }}>
                    {t.expenses.categoryTitle}
                  </span>
                  <CategoryBars
                    expenses={expenses}
                    month={month}
                    year={year}
                    getCat={getCat}
                    barHeight={8}
                    onSelect={(id) => router.push(id ? `/dashboard/expenses?category=${id}` : "/dashboard/expenses")}
                  />
                </div>

                {/* Category variation vs last month — paired with the breakdown above */}
                <div className="md:flex-1" style={SECTION_STYLE}>
                  <span style={{ ...LABEL_STYLE, display: "block", marginBottom: 12 }}>
                    {t.home.variation}
                  </span>
                  <CategoryVariation expenses={expenses} month={month} year={year} getCat={getCat} />
                </div>
              </div>
            )}

            {/* Recent expenses — click opens the edit dialog directly, no navigation needed */}
            <div style={SECTION_STYLE}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={LABEL_STYLE}>{t.home.recent}</span>
                <Link
                  href="/dashboard/expenses"
                  style={{ fontSize: "0.65rem", fontWeight: 600, color: SAGE, textDecoration: "underline", textUnderlineOffset: 2 }}
                >
                  {t.home.seeAll}
                </Link>
              </div>
              {recent.length === 0 ? (
                <div style={{ color: MUTED, fontSize: "0.8rem", padding: "12px 0" }}>{t.expenses.empty}</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {recent.map(e => {
                    const cat = getCat(e.categoryId);
                    return (
                      <button
                        key={e.id}
                        className="millys-recent-row"
                        onClick={() => setEditingExpense(e)}
                        style={{
                          display: "flex", alignItems: "center", gap: 10, width: "100%",
                          padding: "11px 8px", borderRadius: 10, border: "none", background: "transparent",
                          cursor: "pointer", textAlign: "left",
                        }}
                        onMouseEnter={(ev) => { ev.currentTarget.style.background = "rgba(42,39,32,0.03)"; }}
                        onMouseLeave={(ev) => { ev.currentTarget.style.background = "transparent"; }}
                      >
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: cat?.color ?? MUTED, flexShrink: 0 }} />
                        <span style={{ fontSize: "0.82rem", color: CHARCOAL, fontWeight: 500, whiteSpace: "nowrap", flexShrink: 0, maxWidth: "50%", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {e.description || (cat ? getCategoryLabel(cat, t) : e.categoryId)}
                        </span>
                        {/* Dotted leader — ledger/receipt style, fills the gap to the amount
                            instead of leaving it blank on wide rows. */}
                        <span style={{ flex: 1, alignSelf: "flex-end", marginBottom: 5, borderBottom: `1px dotted #DDD7CC`, minWidth: 16 }} />
                        <Fraunces size="0.9rem">{fmtCurrency(e.amount)}</Fraunces>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar — calendar + split, like Gastos' stacked right panel */}
          <div className="md:w-105 shrink-0 flex flex-col gap-5">
            <div style={SECTION_STYLE}>
              <span style={{ ...LABEL_STYLE, display: "block", marginBottom: 12 }}>
                {t.expenses.viewCalendar}
              </span>
              <MonthCalendar expenses={expenses} month={month} year={year} getCat={getCat} />
            </div>

            {/* Ingresos redirect card — Home doesn't duplicate the Ahorro screen,
                just teases the month's income (+ per-user split) and links out to it. */}
            <Link
              href="/dashboard/ahorro"
              style={{ ...SECTION_STYLE, display: "block", textDecoration: "none", transition: "box-shadow 0.15s ease" }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 14px rgba(42,39,32,0.09)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={LABEL_STYLE}>{t.ahorro.incomeTitle}</span>
                <ArrowRight size={13} strokeWidth={2} color={SAGE} />
              </div>
              <Fraunces size="1.6rem">{fmtCurrency(monthIncomeTotal)}</Fraunces>
              {incomeUserTotals.length > 1 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "3px 14px", marginTop: 10 }}>
                  {incomeUserTotals.map(([name, amount]) => (
                    <span key={name} style={{ fontSize: "0.7rem", color: STONE }}>
                      {name} <span style={{ color: CHARCOAL, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{fmtCurrency(amount)}</span>
                    </span>
                  ))}
                </div>
              )}
            </Link>

            {userTotals.length > 1 && (
              <div style={SECTION_STYLE}>
                <span style={{ ...LABEL_STYLE, display: "block", marginBottom: 14 }}>
                  {t.home.split}
                </span>
                <UserSplit userTotals={userTotals} total={monthTotal} />
              </div>
            )}
          </div>
        </div>
      </div>

      {editingExpense && (
        <ExpenseDialog
          open={!!editingExpense}
          onOpenChange={(v) => { if (!v) setEditingExpense(null); }}
          initialValues={editingExpense}
          onSubmit={(data) => { updateExpense(editingExpense.id, data); setEditingExpense(null); }}
        />
      )}
    </div>
  );
}
