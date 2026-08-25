"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { useLang, getDestinationLabel } from "../lib/i18n";
import { useIncome, type Income } from "../lib/income";
import { useSavings, SAVINGS_DESTINATIONS, type SavingsEntry } from "../lib/savings";
import { getMonthTotal, getUserTotals } from "../lib/stats";
import { useCountUp } from "../lib/use-count-up";
import { IncomeDialog } from "../add-expense-dialog";
import { SavingsDialog, AddSavingsButton } from "./add-savings-dialog";
import { SyncErrorBanner } from "../sync-error-banner";

const CHARCOAL = "#2A2720";
const STONE    = "#78726A";
const MUTED    = "#A09890";
const BORDER   = "#EDE8DF";
const CARD     = "#FAF9F7";
const SAGE     = "#5E7C64";

function fmtCurrency(n: number): string {
  return n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

function Fraunces({ children, size = "1.55rem" }: { children: React.ReactNode; size?: string }) {
  return (
    <span style={{ fontFamily: "var(--font-display), serif", fontStyle: "italic", fontWeight: 300, fontSize: size, letterSpacing: "-0.02em", fontVariationSettings: '"SOFT" 100, "WONK" 1', color: CHARCOAL, lineHeight: 1 }}>
      {children}
    </span>
  );
}

const SECTION_STYLE: React.CSSProperties = {
  background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: "20px 24px",
};

const LABEL_STYLE: React.CSSProperties = {
  fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: MUTED,
};

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

/** One income entry — same shell as MovementRow, no destination so the accent is a fixed sage bar. */
function IncomeRow({ entry, index }: { entry: Income; index: number }) {
  const { t } = useLang();
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const { deleteIncome, updateIncome } = useIncome();

  return (
    <>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "flex", alignItems: "stretch", borderRadius: 10, border: `1px solid ${BORDER}`,
          background: hovered ? "rgba(42,39,32,0.018)" : CARD, overflow: "hidden",
          boxShadow: hovered ? "0 4px 14px rgba(42,39,32,0.09)" : "0 1px 2px rgba(42,39,32,0.04)",
          transition: "box-shadow 0.18s ease, background 0.18s ease",
          animation: "millys-stagger-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both",
          animationDelay: `${index * 40}ms`,
        }}
      >
        <div style={{ width: 4, flexShrink: 0, background: SAGE }} />
        <div style={{ flex: 1, padding: "9px 11px 9px 10px", display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.875rem", color: CHARCOAL, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.25 }}>
              {entry.description || t.expense.kindIncome}
            </div>
            <div style={{ fontSize: "0.635rem", color: MUTED, marginTop: 4 }}>{entry.userName}</div>
          </div>
          <Fraunces size="1.05rem">{fmtCurrency(entry.amount)}</Fraunces>
          <div style={{ flexShrink: 0, display: "flex", gap: 1, opacity: hovered ? 1 : 0, transition: "opacity 0.18s ease" }}>
            <ActionBtn icon={Pencil} label="Editar"   hoverColor={CHARCOAL} hoverBg="#EDE8DF" onClick={() => setEditing(true)} />
            <ActionBtn icon={Trash2} label="Eliminar" hoverColor="#EF4444" hoverBg="#FEF2F2" onClick={() => deleteIncome(entry.id)} />
          </div>
        </div>
      </div>

      <IncomeDialog
        open={editing}
        onOpenChange={setEditing}
        initialValues={entry}
        onSubmit={(data) => updateIncome(entry.id, data)}
      />
    </>
  );
}

/** One savings movement — click the pencil to edit, same edit-in-place pattern as Gastos' kanban cards. */
function MovementRow({ entry, index }: { entry: SavingsEntry; index: number }) {
  const { t } = useLang();
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const { deleteSaving, updateSaving } = useSavings();
  const dest = SAVINGS_DESTINATIONS.find(d => d.code === entry.destinationCode);
  const destLabel = dest ? getDestinationLabel(dest, t) : entry.destinationCode;

  return (
    <>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "flex", alignItems: "stretch", borderRadius: 10, border: `1px solid ${BORDER}`,
          background: hovered ? "rgba(42,39,32,0.018)" : CARD, overflow: "hidden",
          boxShadow: hovered ? "0 4px 14px rgba(42,39,32,0.09)" : "0 1px 2px rgba(42,39,32,0.04)",
          transition: "box-shadow 0.18s ease, background 0.18s ease",
          animation: "millys-stagger-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both",
          animationDelay: `${index * 40}ms`,
        }}
      >
        <div style={{ width: 4, flexShrink: 0, background: dest?.color ?? MUTED }} />
        <div style={{ flex: 1, padding: "9px 11px 9px 10px", display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.875rem", color: CHARCOAL, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.25 }}>
              {entry.description || destLabel}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
              {entry.description && (
                <>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: dest?.color ?? MUTED, flexShrink: 0, display: "inline-block" }} />
                  <span style={{ fontSize: "0.635rem", color: STONE, fontWeight: 500, letterSpacing: "0.01em" }}>{destLabel}</span>
                  <span style={{ fontSize: "0.635rem", color: MUTED, lineHeight: 1 }}>·</span>
                </>
              )}
              <span style={{ fontSize: "0.635rem", color: MUTED }}>{entry.userName}</span>
            </div>
          </div>
          <Fraunces size="1.05rem">{fmtCurrency(entry.amount)}</Fraunces>
          <div style={{ flexShrink: 0, display: "flex", gap: 1, opacity: hovered ? 1 : 0, transition: "opacity 0.18s ease" }}>
            <ActionBtn icon={Pencil} label="Editar"   hoverColor={CHARCOAL} hoverBg="#EDE8DF" onClick={() => setEditing(true)} />
            <ActionBtn icon={Trash2} label="Eliminar" hoverColor="#EF4444" hoverBg="#FEF2F2" onClick={() => deleteSaving(entry.id)} />
          </div>
        </div>
      </div>

      <SavingsDialog
        open={editing}
        onOpenChange={setEditing}
        initialValues={entry}
        onSubmit={(data) => updateSaving(entry.id, data)}
      />
    </>
  );
}

/** One 50/30/20 tile — combined amount plus each person's own share of that percentage. */
function SplitTile({ label, pct, userTotals, trigger }: { label: string; pct: number; userTotals: [string, number][]; trigger: unknown }) {
  const total = userTotals.reduce((s, [, amount]) => s + amount, 0);
  const displayedAmount = useCountUp(total * pct, trigger);
  return (
    <div className="md:flex-1" style={SECTION_STYLE}>
      <span style={{ ...LABEL_STYLE, display: "block", marginBottom: 10 }}>{label}</span>
      <Fraunces size="1.4rem">{fmtCurrency(displayedAmount)}</Fraunces>
      {userTotals.length > 1 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "3px 14px", marginTop: 10 }}>
          {userTotals.map(([name, amount]) => (
            <span key={name} style={{ fontSize: "0.7rem", color: STONE }}>
              {name} <span style={{ color: CHARCOAL, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{fmtCurrency(amount * pct)}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AhorroPage() {
  const { t } = useLang();
  const { income, ready: incomeReady, syncError: incomeSyncError, dismissSyncError: dismissIncomeSyncError } = useIncome();
  const { savings, ready: savingsReady, syncError: savingsSyncError, dismissSyncError: dismissSavingsSyncError } = useSavings();

  useEffect(() => {
    if (!incomeSyncError) return;
    const timer = setTimeout(dismissIncomeSyncError, 6000);
    return () => clearTimeout(timer);
  }, [incomeSyncError, dismissIncomeSyncError]);

  useEffect(() => {
    if (!savingsSyncError) return;
    const timer = setTimeout(dismissSavingsSyncError, 6000);
    return () => clearTimeout(timer);
  }, [savingsSyncError, dismissSavingsSyncError]);

  const now   = new Date();
  const month = now.getMonth();
  const year  = now.getFullYear();

  // Both salaries land at month-end, so income is entered dated for the month it
  // funds (e.g. Murphfi's July paycheck is dated 01/08) rather than the actual pay
  // date — same "this month" filter as everywhere else, no special-casing needed.
  const monthIncomeTotal = useMemo(() => getMonthTotal(income, month, year), [income, month, year]);
  const displayedIncomeTotal = useCountUp(monthIncomeTotal, `${month}-${year}`);
  const incomeUserTotals = useMemo(() => getUserTotals(income, month, year), [income, month, year]);
  const monthIncome = useMemo(() =>
    income.filter(i => {
      const d = new Date(i.date + "T12:00:00");
      return d.getMonth() === month && d.getFullYear() === year;
    }),
    [income, month, year],
  );

  const monthSavings = useMemo(() =>
    savings.filter(s => {
      const d = new Date(s.date + "T12:00:00");
      return d.getMonth() === month && d.getFullYear() === year;
    }),
    [savings, month, year],
  );

  const monthSavingsTotal = useMemo(() => monthSavings.reduce((sum, s) => sum + s.amount, 0), [monthSavings]);
  const displayedSavingsTotal = useCountUp(monthSavingsTotal, `${month}-${year}`);

  const byDestination = useMemo(() => {
    const map: Record<string, number> = {};
    monthSavings.forEach(s => { map[s.destinationCode] = (map[s.destinationCode] ?? 0) + s.amount; });
    return map;
  }, [monthSavings]);

  const target20 = monthIncomeTotal * 0.2;
  const delta    = monthSavingsTotal - target20;

  const incomeErrorMessage   = incomeSyncError   ? t.errors[`${incomeSyncError}Income` as keyof typeof t.errors]   : null;
  const savingsErrorMessage  = savingsSyncError  ? t.errors[`${savingsSyncError}Saving` as keyof typeof t.errors]  : null;

  if (!incomeReady || !savingsReady) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: MUTED, fontSize: "0.8rem" }}>
        {t.expenses.loading}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {incomeErrorMessage  && <SyncErrorBanner message={incomeErrorMessage}  onDismiss={dismissIncomeSyncError} />}
      {savingsErrorMessage && <SyncErrorBanner message={savingsErrorMessage} onDismiss={dismissSavingsSyncError} />}
      <div className="millys-scroll-hidden" style={{ flex: 1, overflowY: "auto", padding: "16px 20px 32px" }}>
      <div className="max-w-xl md:max-w-none w-full mx-auto flex flex-col gap-5">

        {/* Hero — same headline treatment as Home */}
        <div className="w-full" style={{ textAlign: "center", padding: "8px 28px 4px" }}>
          <span style={{ ...LABEL_STYLE, display: "block", marginBottom: 4 }}>
            {t.ahorro.incomeTitle}
          </span>
          <span style={{ ...LABEL_STYLE, fontSize: "1rem", letterSpacing: "0.05em", display: "block", marginBottom: 8 }}>
            {t.calendar.months[month]} {year}
          </span>
          <Fraunces size="clamp(3rem, 6vw, 4.5rem)">{fmtCurrency(displayedIncomeTotal)}</Fraunces>

          {incomeUserTotals.length > 1 && (
            <div className="flex flex-wrap" style={{ marginTop: 16, gap: "4px 14px", justifyContent: "center" }}>
              {incomeUserTotals.map(([name, amount]) => (
                <span key={name} style={{ display: "inline-flex", alignItems: "baseline", gap: 6, fontSize: "0.78rem", color: STONE }}>
                  {name}
                  <span style={{ color: CHARCOAL, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{fmtCurrency(amount)}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Income list — this month's entries, editable/deletable like Gastos */}
        <div style={SECTION_STYLE}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={LABEL_STYLE}>{t.ahorro.incomeListTitle}</span>
          </div>
          {monthIncome.length === 0 ? (
            <div style={{ color: MUTED, fontSize: "0.8rem", padding: "12px 0" }}>{t.ahorro.emptyIncome}</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {monthIncome
                .slice()
                .sort((a, b) => (a.date < b.date ? 1 : -1))
                .map((entry, i) => <IncomeRow key={entry.id} entry={entry} index={i} />)}
            </div>
          )}
        </div>

        {/* 50/30/20 suggested split — needs at least this month's income to mean anything */}
        {monthIncomeTotal > 0 ? (
          <div className="flex flex-col md:flex-row gap-5">
            <SplitTile label={t.ahorro.needs} pct={0.5} userTotals={incomeUserTotals} trigger={`${month}-${year}`} />
            <SplitTile label={t.ahorro.wants} pct={0.3} userTotals={incomeUserTotals} trigger={`${month}-${year}`} />
            <SplitTile label={t.ahorro.savingsTarget} pct={0.2} userTotals={incomeUserTotals} trigger={`${month}-${year}`} />
          </div>
        ) : (
          <div style={{ textAlign: "center", color: MUTED, fontSize: "0.8rem", padding: "4px 0" }}>
            {t.ahorro.emptyIncome}
          </div>
        )}

        {/* Saved this month — total, per-destination breakdown, comparison vs the 20% target */}
        <div style={SECTION_STYLE}>
          <span style={{ ...LABEL_STYLE, display: "block", marginBottom: 12 }}>
            {t.ahorro.savingsTotalTitle}
          </span>
          <div className="flex flex-col md:flex-row md:items-end" style={{ gap: 16, marginBottom: 16 }}>
            <Fraunces size="2rem">{fmtCurrency(displayedSavingsTotal)}</Fraunces>
            {monthIncomeTotal > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                {delta >= 0
                  ? <TrendingUp size={14} strokeWidth={2} color={SAGE} />
                  : <TrendingDown size={14} strokeWidth={2} color={STONE} />}
                <span style={{ fontSize: "0.8rem", fontWeight: 600, color: delta >= 0 ? SAGE : STONE }}>
                  {delta >= 0 ? "+" : ""}{fmtCurrency(delta)}
                </span>
                <span style={{ fontSize: "0.8rem", color: MUTED }}>
                  {delta >= 0 ? t.ahorro.aboveTarget : t.ahorro.belowTarget}
                </span>
              </div>
            )}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 24px" }}>
            {SAVINGS_DESTINATIONS.map(dest => (
              <div key={dest.code} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: dest.color, flexShrink: 0 }} />
                <span style={{ fontSize: "0.8rem", color: STONE }}>{getDestinationLabel(dest, t)}</span>
                <span style={{ fontSize: "0.8rem", fontWeight: 600, color: CHARCOAL, fontVariantNumeric: "tabular-nums" }}>
                  {fmtCurrency(byDestination[dest.code] ?? 0)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Movements — this month's savings entries, editable/deletable like Gastos */}
        <div style={SECTION_STYLE}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={LABEL_STYLE}>{t.ahorro.movementsTitle}</span>
            <AddSavingsButton />
          </div>
          {monthSavings.length === 0 ? (
            <div style={{ color: MUTED, fontSize: "0.8rem", padding: "12px 0" }}>{t.ahorro.empty}</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {monthSavings
                .slice()
                .sort((a, b) => (a.date < b.date ? 1 : -1))
                .map((entry, i) => <MovementRow key={entry.id} entry={entry} index={i} />)}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
