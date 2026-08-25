"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useLang } from "../lib/i18n";
import { useCategories, type Category } from "../lib/categories";
import { useExpenses, type Expense } from "../lib/expenses";
import { useInstallments, type InstallmentPlan } from "../lib/installments";
import { useTopBarSlot } from "../lib/topbar-slot";
import {
  getMonthTotal, getMonthComparisonPct, getUserTotals, getCategoryTotals,
  getYearTotal, getYearComparisonPct, getYearCategoryTotals, getUserColor,
  parseExpenseDate, todayDate, sharedOnly,
} from "../lib/stats";
import { useCountUp } from "../lib/use-count-up";

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

// Fixed column width for the monthly bar chart — keeps 12 months readable on
// mobile by scrolling horizontally instead of squeezing every bar down.
const MONTH_COL_WIDTH = 46;

const SECTION_STYLE: React.CSSProperties = {
  background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: "20px 24px",
};

const LABEL_STYLE: React.CSSProperties = {
  fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: MUTED,
};

// Precomputed once per month by GlobalSummary and shared by ComparativeCard
// and every MonthRow, instead of each aggregating the same totals separately.
type MonthData = { month: number; total: number; pct: number | null; users: [string, number][] };

// ── Year strip — topbar-slot control. Single row (no scroll carousel like
// Gastos' month strip needs) since a couple's ledger only ever spans a
// handful of years. Always shows one padding year on each side of the known
// range so there's a next/prev year to click into even with no data yet. ──
function YearStrip({ year, onChange, expenses }: { year: number; onChange: (y: number) => void; expenses: Expense[] }) {
  const years = useMemo(() => {
    const known = new Set(expenses.map(e => parseExpenseDate(e.date).getFullYear()).filter(Number.isFinite));
    known.add(year);
    known.add(todayDate().getFullYear());
    const sorted = [...known].sort((a, b) => a - b);
    const out: number[] = [];
    for (let y = sorted[0] - 1; y <= sorted[sorted.length - 1] + 1; y++) out.push(y);
    return out;
  }, [expenses, year]);

  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 22, width: "100%", pointerEvents: "auto" }}>
      {years.map(y => {
        const active = y === year;
        const dist = Math.abs(y - year);
        return (
          <button
            key={y}
            onClick={() => onChange(y)}
            style={{
              background: "transparent", border: "none", cursor: "pointer", padding: 0,
              fontFamily: active ? "var(--font-display), serif" : "inherit",
              fontStyle: active ? "italic" : "normal",
              fontWeight: active ? 300 : 500,
              fontVariationSettings: active ? '"SOFT" 100, "WONK" 1' : "normal",
              letterSpacing: active ? "-0.02em" : "0",
              fontSize: active ? "1.75rem" : dist === 1 ? "1.15rem" : "1rem",
              color: active ? CHARCOAL : dist === 1 ? MUTED : "#DDD7CC",
              lineHeight: 1,
              transition: "color 0.15s ease",
            }}
          >
            {y}
          </button>
        );
      })}
    </div>
  );
}

// ── Comparativa card — Murphfi vs Lilly grouped bars per month, toggling to
// annual category totals. Two views of the same year, one chart area. ──
function ComparativeCard({ expenses, year, getCat, monthly }: {
  expenses: Expense[];
  year: number;
  getCat: (id: string) => Category | undefined;
  monthly: MonthData[];
}) {
  const { t } = useLang();
  const [mode, setMode] = useState<"person" | "category">("person");
  const scrollRef = useRef<HTMLDivElement>(null);
  const isCurrentYear = year === todayDate().getFullYear();

  // Default scroll position: current month when viewing the current year (so
  // it's visible without scrolling), otherwise January — re-centers whenever
  // the year changes or the chart is switched back into view.
  useEffect(() => {
    const strip = scrollRef.current;
    if (!strip || mode !== "person") return;
    const targetMonth = isCurrentYear ? todayDate().getMonth() : 0;
    const colLeft = 4 + targetMonth * (MONTH_COL_WIDTH + 8);
    const target = colLeft + MONTH_COL_WIDTH / 2 - strip.clientWidth / 2;
    strip.scrollLeft = Math.max(0, target);
  }, [year, isCurrentYear, mode]);

  const maxMonthTotal = Math.max(1, ...monthly.map(m => m.total));

  const categoryTotals = useMemo(
    () => getYearCategoryTotals(expenses, year, getCat, t, MUTED),
    [expenses, year, getCat, t],
  );
  const maxCatAmt = categoryTotals[0]?.amount ?? 1;

  // Stable legend across all 12 months — union of everyone who appears at least once,
  // ordered by their annual total so the chart's leading color matches the biggest spender.
  const allUsers = useMemo(() => {
    const totals: Record<string, number> = {};
    monthly.forEach(m => m.users.forEach(([name, amt]) => { totals[name] = (totals[name] ?? 0) + amt; }));
    return Object.entries(totals).sort((a, b) => b[1] - a[1]).map(([name]) => name);
  }, [monthly]);

  return (
    <div style={SECTION_STYLE}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <span style={LABEL_STYLE}>{t.global.comparative}</span>
        <div style={{ display: "flex", gap: 2, background: "#F2EBE1", borderRadius: 999, padding: 3 }}>
          {(["person", "category"] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                padding: "5px 13px", borderRadius: 999, border: "none",
                background: mode === m ? SAGE : "transparent",
                color: mode === m ? CARD : STONE,
                fontSize: "0.72rem", fontWeight: mode === m ? 600 : 400,
                cursor: "pointer", transition: "background 0.15s ease, color 0.15s ease",
              }}
            >
              {m === "person" ? t.global.byPerson : t.global.byCategory}
            </button>
          ))}
        </div>
      </div>

      {mode === "person" ? (
        allUsers.length === 0 ? (
          <div style={{ color: MUTED, fontSize: "0.8rem", padding: "40px 0", textAlign: "center" }}>{t.expenses.empty}</div>
        ) : (
          <>
            <div ref={scrollRef} className="millys-scroll-hidden" style={{ overflowX: "auto" }}>
              <div style={{ minWidth: 12 * MONTH_COL_WIDTH + 11 * 8 }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 170, padding: "0 4px" }}>
                  {monthly.map(({ month, users }) => {
                    const byName = new Map(users);
                    return (
                      <div key={month} style={{ flex: `1 0 ${MONTH_COL_WIDTH}px`, display: "flex", alignItems: "flex-end", gap: 3, height: "100%" }}>
                        {allUsers.map((name, i) => {
                          const amt = byName.get(name) ?? 0;
                          const heightPct = (amt / maxMonthTotal) * 100;
                          const heightPx = (heightPct / 100) * 170;
                          return (
                            <div
                              key={name}
                              title={`${name}: ${fmtCurrency(amt)}`}
                              style={{
                                flex: 1,
                                height: `${heightPct}%`,
                                minHeight: amt > 0 ? 2 : 0,
                                background: getUserColor(name, i),
                                borderRadius: "3px 3px 0 0",
                                display: "flex", alignItems: "flex-end", justifyContent: "center",
                                paddingBottom: 4, boxSizing: "border-box", overflow: "visible",
                              }}
                            >
                              {amt > 0 && heightPx > 24 && (
                                <span style={{ fontSize: "0.56rem", fontWeight: 700, color: "#fff", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", pointerEvents: "none" }}>
                                  {fmtCurrency(amt)}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: "flex", gap: 8, padding: "8px 4px 0" }}>
                  {t.calendar.months.map((m, i) => (
                    <span key={i} style={{ flex: `1 0 ${MONTH_COL_WIDTH}px`, fontSize: "0.62rem", color: MUTED, textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "center" }}>
                      {m.slice(0, 3)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 18, marginTop: 14, paddingTop: 14, borderTop: `1px solid ${BORDER}` }}>
              {allUsers.map((name, i) => (
                <div key={name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: getUserColor(name, i) }} />
                  <span style={{ fontSize: "0.78rem", color: STONE }}>{name}</span>
                </div>
              ))}
            </div>
          </>
        )
      ) : (
        categoryTotals.length === 0 ? (
          <div style={{ color: MUTED, fontSize: "0.8rem", padding: "40px 0", textAlign: "center" }}>{t.expenses.empty}</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {categoryTotals.map(({ id, color, label, amount }) => (
              <div key={id}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: "0.75rem", fontWeight: 500, color: STONE, flex: 1 }}>{label}</span>
                  <span style={{ fontSize: "0.75rem", color: CHARCOAL, fontVariantNumeric: "tabular-nums" }}>{fmtCurrency(amount)}</span>
                </div>
                <div style={{ height: 8, background: "#EDE8DF", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(amount / maxCatAmt) * 100}%`, background: color, borderRadius: 999 }} />
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

// ── One row in "Mes a mes" — click the month to expand its top category and
// person split, click again to collapse. `data` is precomputed once for all
// 12 months by the parent (shared with ComparativeCard) so the same totals
// aren't aggregated twice; only the top category is computed here, and only
// once the row is actually expanded. ──
function MonthRow({ year, expenses, getCat, data, expanded, onToggle, isCurrent, index }: {
  year: number;
  expenses: Expense[];
  getCat: (id: string) => Category | undefined;
  data: MonthData;
  expanded: boolean;
  onToggle: () => void;
  isCurrent: boolean;
  index: number;
}) {
  const { t } = useLang();
  const { month, total, pct, users: userTotals } = data;
  const topCat = useMemo(
    () => (expanded && total > 0 ? getCategoryTotals(expenses, month, year, getCat, t, MUTED)[0] : undefined),
    [expanded, total, expenses, month, year, getCat, t],
  );
  const userSum = userTotals.reduce((s, [, a]) => s + a, 0) || 1;

  return (
    <div style={{
      borderRadius: 10, overflow: "hidden", background: isCurrent ? "#F6F3EE" : "transparent",
      animation: "millys-stagger-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both",
      animationDelay: `${index * 30}ms`,
    }}>
      <button
        onClick={onToggle}
        style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 8px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
      >
        <span style={{ fontSize: "0.85rem", color: CHARCOAL, fontWeight: isCurrent ? 700 : 500, flexShrink: 0, width: 84 }}>
          {t.calendar.months[month]}
        </span>
        <span style={{ flex: 1, alignSelf: "flex-end", marginBottom: 5, borderBottom: "1px dotted #DDD7CC" }} />
        <Fraunces size="0.95rem">{fmtCurrency(total)}</Fraunces>
        <span style={{ fontSize: "0.72rem", fontWeight: 600, minWidth: 44, textAlign: "right", color: pct === null ? "#C7C0B4" : pct <= 0 ? SAGE : STONE }}>
          {pct === null ? "—" : `${pct <= 0 ? "↓" : "↑"}${Math.round(Math.abs(pct))}%`}
        </span>
        <ChevronDown size={13} strokeWidth={2} color={MUTED} style={{ flexShrink: 0, transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }} />
      </button>
      <div style={{ maxHeight: expanded ? 110 : 0, overflow: "hidden", transition: "max-height 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)", boxSizing: "border-box" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "4px 8px 14px" }}>
          {total === 0 ? (
            <span style={{ fontSize: "0.75rem", color: MUTED }}>{t.expenses.empty}</span>
          ) : (
            <>
              {topCat && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: topCat.color, flexShrink: 0 }} />
                  <span style={{ fontSize: "0.72rem", color: STONE, flex: 1 }}>
                    {t.global.topCategory}: <span style={{ color: CHARCOAL, fontWeight: 600 }}>{topCat.label}</span>
                  </span>
                  <span style={{ fontSize: "0.75rem", color: CHARCOAL, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{fmtCurrency(topCat.amount)}</span>
                </div>
              )}
              {userTotals.length > 1 && (
                <>
                  <div style={{ display: "flex", height: 6, borderRadius: 999, overflow: "hidden", background: "#EDE8DF" }}>
                    {userTotals.map(([name, amount], i) => (
                      <div key={name} style={{ width: `${(amount / userSum) * 100}%`, background: getUserColor(name, i) }} />
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                    {userTotals.map(([name, amount], i) => (
                      <span key={name} style={{ fontSize: "0.68rem", color: STONE }}>
                        {name} <span style={{ color: CHARCOAL, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{fmtCurrency(amount)}</span>
                      </span>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── One financing plan — read-only progress, counted from real linked
// expenses (paidAmount/paidCount come from the backend), not a calendar
// formula. Editing/deleting the plan itself lives in Config, not here —
// Global only tracks progress, it doesn't manage the definition. ──
function InstallmentRow({ plan, colorIndex }: { plan: InstallmentPlan; colorIndex: number }) {
  const { t } = useLang();
  const color        = getUserColor(plan.userName, colorIndex);
  const progressPct  = plan.totalAmount > 0 ? Math.min(100, (plan.paidAmount / plan.totalAmount) * 100) : 0;
  const remaining     = Math.max(0, plan.totalAmount - plan.paidAmount);
  const monthsLeft    = plan.monthlyAmount > 0 ? Math.ceil(remaining / plan.monthlyAmount) : 0;
  const isComplete    = plan.paidAmount >= plan.totalAmount;

  return (
    <div
      style={{
        display: "flex", alignItems: "stretch", borderRadius: 10, border: `1px solid ${BORDER}`,
        background: CARD, overflow: "hidden", boxShadow: "0 1px 2px rgba(42,39,32,0.04)",
      }}
    >
      <div style={{ width: 4, flexShrink: 0, background: color }} />
      <div style={{ flex: 1, padding: "12px 11px 12px 11px", display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.875rem", color: CHARCOAL, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.25 }}>
              {plan.description}
            </div>
            <div style={{ fontSize: "0.635rem", color: MUTED, marginTop: 4 }}>{plan.userName}</div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <Fraunces size="1.05rem">{fmtCurrency(plan.paidAmount)}</Fraunces>
            <div style={{ fontSize: "0.635rem", color: MUTED }}>{t.global.installmentsOf} {fmtCurrency(plan.totalAmount)}</div>
          </div>
        </div>
        <div style={{ height: 6, borderRadius: 999, overflow: "hidden", background: "#EDE8DF" }}>
          <div style={{ height: "100%", width: `${progressPct}%`, background: color, borderRadius: 999 }} />
        </div>
        <div style={{ fontSize: "0.68rem", color: STONE }}>
          {t.global.monthlyQuota} {fmtCurrency(plan.monthlyAmount)}
          {" · "}
          {isComplete ? t.global.completed : `${monthsLeft} ${t.global.monthsRemaining}`}
        </div>
      </div>
    </div>
  );
}

function InstallmentsCard({ installments, ownerNames }: { installments: InstallmentPlan[]; ownerNames: string[] }) {
  const { t } = useLang();
  return (
    <div style={SECTION_STYLE}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={LABEL_STYLE}>{t.global.installmentsTitle}</span>
        <Link href="/dashboard/settings" style={{ fontSize: "0.72rem", fontWeight: 600, color: STONE, textDecoration: "none" }}>
          {t.global.installmentsManage}
        </Link>
      </div>
      {installments.length === 0 ? (
        <div style={{ color: MUTED, fontSize: "0.8rem", padding: "24px 0", textAlign: "center" }}>{t.global.installmentsEmpty}</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {installments.map(plan => (
            <InstallmentRow key={plan.id} plan={plan} colorIndex={ownerNames.indexOf(plan.userName)} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function GlobalSummary() {
  const { t } = useLang();
  const { categories } = useCategories();
  const { expenses, ready } = useExpenses();
  const { installments } = useInstallments();
  const topBarSlot = useTopBarSlot();
  const [year, setYear] = useState(() => todayDate().getFullYear());
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);

  function getCat(id: string) { return categories.find(c => c.id === id); }

  // Global is the multi-month view of the couple's SHARED ledger — a personal
  // expense (Murphfas' own car payment) is excluded here for the same reason
  // it's excluded from Home's totals/split: it shouldn't inflate anyone's
  // part of the shared picture. It's still fully visible/filterable in Gastos.
  const sharedExpenses = useMemo(() => sharedOnly(expenses), [expenses]);

  // Stable color per owner, shared with ComparativeCard's convention (known
  // names get a fixed color; others fall back to index-based color).
  const ownerNames = useMemo(() => Array.from(new Set(installments.map(p => p.userName))), [installments]);

  const yearTotal = useMemo(() => getYearTotal(sharedExpenses, year), [sharedExpenses, year]);
  const displayedYearTotal = useCountUp(yearTotal, year);
  const yearPct = useMemo(() => getYearComparisonPct(sharedExpenses, year), [sharedExpenses, year]);
  const prevYearTotal = useMemo(() => getYearTotal(sharedExpenses, year - 1), [sharedExpenses, year]);

  // Computed once for all 12 months and shared by the chart and the month list
  // below, instead of each aggregating the same totals independently.
  const monthlyData: MonthData[] = useMemo(() => Array.from({ length: 12 }, (_, m) => ({
    month: m,
    total: getMonthTotal(sharedExpenses, m, year),
    pct: getMonthComparisonPct(sharedExpenses, m, year),
    users: getUserTotals(sharedExpenses, m, year),
  })), [sharedExpenses, year]);

  const today = todayDate();
  const isCurrentYear = year === today.getFullYear();

  const yearStrip = <YearStrip year={year} onChange={(y) => { setYear(y); setExpandedMonth(null); }} expenses={expenses} />;

  if (!ready) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: MUTED, fontSize: "0.8rem" }}>
        {t.expenses.loading}
      </div>
    );
  }

  return (
    <div className="millys-scroll-hidden" style={{ height: "100%", overflowY: "auto", padding: "8px 20px 32px" }}>
      {topBarSlot ? createPortal(yearStrip, topBarSlot) : <div style={{ padding: "20px 20px 0" }}>{yearStrip}</div>}

      <div className="max-w-xl md:max-w-none w-full mx-auto flex flex-col gap-5">
        {/* Hero */}
        <div className="w-full" style={{ textAlign: "center", padding: "8px 28px 4px" }}>
          <span style={{ ...LABEL_STYLE, display: "block", marginBottom: 8 }}>{t.global.totalYear}</span>
          <Fraunces as="h1" size="clamp(2.8rem, 5.5vw, 3.75rem)">{fmtCurrency(displayedYearTotal)}</Fraunces>
          {yearPct !== null && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 14 }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 600, color: yearPct <= 0 ? SAGE : STONE }}>
                {yearPct <= 0 ? "↓" : "↑"} {Math.abs(Math.round(yearPct * 10) / 10)}%
              </span>
              <span style={{ fontSize: "0.78rem", color: MUTED }}>
                {t.global.vsPreviousYear} {year - 1} <span style={{ fontVariantNumeric: "tabular-nums" }}>({fmtCurrency(prevYearTotal)})</span>
              </span>
            </div>
          )}
        </div>

        <ComparativeCard expenses={sharedExpenses} year={year} getCat={getCat} monthly={monthlyData} />

        <InstallmentsCard installments={installments} ownerNames={ownerNames} />

        <div style={SECTION_STYLE}>
          <span style={{ ...LABEL_STYLE, display: "block", marginBottom: 8 }}>{t.global.monthly}</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {monthlyData.map((data, i) => (
              <MonthRow
                key={`${year}-${data.month}`}
                year={year}
                expenses={sharedExpenses}
                getCat={getCat}
                data={data}
                expanded={expandedMonth === data.month}
                onToggle={() => setExpandedMonth(prev => prev === data.month ? null : data.month)}
                isCurrent={isCurrentYear && data.month === today.getMonth()}
                index={i}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
