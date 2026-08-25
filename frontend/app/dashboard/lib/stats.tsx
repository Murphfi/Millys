"use client";

import { useEffect, useMemo, useState } from "react";
import type { Expense } from "./expenses";
import type { Category } from "./categories";
import { getCategoryLabel, useLang } from "./i18n";

// Shared month-aggregation logic + the category-bars chart used by both the
// Gastos sidebar summary and the Home hero block — kept here so the two stay
// in sync instead of drifting apart as separately-maintained copies.

export function parseExpenseDate(iso: string): Date {
  return new Date(iso + "T12:00:00");
}

function inMonth(e: { date: string }, month: number, year: number): boolean {
  const d = parseExpenseDate(e.date);
  return d.getMonth() === month && d.getFullYear() === year;
}

export function todayDate(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Monday-first 5-6 week grid for a given month, trimmed to 5 rows when the 6th is unused. */
export function getMonthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const dow = first.getDay();
  const start = new Date(year, month, 1 + (dow === 0 ? -6 : 1 - dow));
  const grid = Array.from({ length: 42 }, (_, i) =>
    new Date(start.getFullYear(), start.getMonth(), start.getDate() + i),
  );
  return grid[35].getMonth() !== month ? grid.slice(0, 35) : grid;
}

// A personal expense (shared === false) counts only in its owner's own total —
// call sites that compute the couple's split/comparison/year totals (Home,
// Global) filter through this first. Gastos itself shows everything raw, so
// it deliberately does NOT filter through this by default.
export function sharedOnly(expenses: Expense[]): Expense[] {
  // !== false (not a plain truthy check) so records missing the field entirely
  // — e.g. Test-user localStorage saved before `shared` existed — default to
  // shared, matching the backend column's own DEFAULT TRUE.
  return expenses.filter(e => e.shared !== false);
}

export function getMonthTotal(items: { amount: number; date: string }[], month: number, year: number): number {
  return items.filter(e => inMonth(e, month, year)).reduce((s, e) => s + e.amount, 0);
}

export function getPrevMonth(month: number, year: number): { month: number; year: number } {
  return month === 0 ? { month: 11, year: year - 1 } : { month: month - 1, year };
}

/** Percent change vs. the previous month, or null when there's nothing to compare against. */
export function getMonthComparisonPct(expenses: Expense[], month: number, year: number): number | null {
  const { month: pm, year: py } = getPrevMonth(month, year);
  const prevTotal = getMonthTotal(expenses, pm, py);
  if (prevTotal <= 0) return null;
  const total = getMonthTotal(expenses, month, year);
  return ((total - prevTotal) / prevTotal) * 100;
}

const CHARCOAL = "#2A2720";
const STONE    = "#78726A";
const MUTED    = "#A09890";

export function getUserTotals(items: { userName: string; amount: number; date: string }[], month: number, year: number): [string, number][] {
  const map: Record<string, number> = {};
  items.filter(e => inMonth(e, month, year)).forEach(e => { map[e.userName] = (map[e.userName] ?? 0) + e.amount; });
  return Object.entries(map).sort((a, b) => b[1] - a[1]);
}

function inYear(e: { date: string }, year: number): boolean {
  return parseExpenseDate(e.date).getFullYear() === year;
}

export function getYearTotal(items: { amount: number; date: string }[], year: number): number {
  return items.filter(e => inYear(e, year)).reduce((s, e) => s + e.amount, 0);
}

/** Percent change vs. the previous year, or null when there's nothing to compare against. */
export function getYearComparisonPct(items: { amount: number; date: string }[], year: number): number | null {
  const prevTotal = getYearTotal(items, year - 1);
  if (prevTotal <= 0) return null;
  const total = getYearTotal(items, year);
  return ((total - prevTotal) / prevTotal) * 100;
}

// Fixed per-person colors (not by rank) so Murphfi/Lilly keep the same segment
// color everywhere regardless of who spent more. Unknown names (e.g. Test's
// seeded "Usuario 1"/"Usuario 2") fall back to the neutral brand tones. Shared
// between Home's "Reparto por persona" and Global's charts so both stay in sync.
export const USER_COLORS: Record<string, string> = {
  Murphfi: "#9AB89D", // lighter sage — same token as the sidebar's inactive nav green
  Lilly:   "#D9A0A8", // muted rose, kept as desaturated as the rest of the palette
};
const USER_COLOR_FALLBACK = ["#5E7C64", STONE, MUTED];

export function getUserColor(name: string, index: number): string {
  return USER_COLORS[name] ?? USER_COLOR_FALLBACK[index % USER_COLOR_FALLBACK.length];
}

export type CategoryEntry = { id: string; color: string; label: string; amount: number };

function aggregateCategoryTotals(
  expenses: Expense[],
  predicate: (e: Expense) => boolean,
  getCat: (id: string) => Category | undefined,
  t: ReturnType<typeof useLang>["t"],
  fallbackColor: string,
): CategoryEntry[] {
  const map: Record<string, CategoryEntry> = {};
  expenses.filter(predicate).forEach(e => {
    const cat = getCat(e.categoryId);
    map[e.categoryId] ??= {
      id: e.categoryId,
      color: cat?.color ?? fallbackColor,
      label: cat ? getCategoryLabel(cat, t) : e.categoryId,
      amount: 0,
    };
    map[e.categoryId].amount += e.amount;
  });
  return Object.values(map).sort((a, b) => b.amount - a.amount);
}

export function getCategoryTotals(
  expenses: Expense[],
  month: number,
  year: number,
  getCat: (id: string) => Category | undefined,
  t: ReturnType<typeof useLang>["t"],
  fallbackColor: string,
): CategoryEntry[] {
  return aggregateCategoryTotals(expenses, e => inMonth(e, month, year), getCat, t, fallbackColor);
}

export function getYearCategoryTotals(
  expenses: Expense[],
  year: number,
  getCat: (id: string) => Category | undefined,
  t: ReturnType<typeof useLang>["t"],
  fallbackColor: string,
): CategoryEntry[] {
  return aggregateCategoryTotals(expenses, e => inYear(e, year), getCat, t, fallbackColor);
}

function fmtCurrency(n: number): string {
  return n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

export type CategoryComparisonEntry = CategoryEntry & { prevAmount: number; pctChange: number | null };

/**
 * Same categories/order as getCategoryTotals (current month, sorted by spend
 * descending), each annotated with its previous-month amount and % change.
 * pctChange is null when there's nothing to compare against (new category).
 */
export function getCategoryComparison(
  expenses: Expense[],
  month: number,
  year: number,
  getCat: (id: string) => Category | undefined,
  t: ReturnType<typeof useLang>["t"],
  fallbackColor: string,
): CategoryComparisonEntry[] {
  const current = getCategoryTotals(expenses, month, year, getCat, t, fallbackColor);
  const { month: pm, year: py } = getPrevMonth(month, year);
  const prevTotals = getCategoryTotals(expenses, pm, py, getCat, t, fallbackColor);
  const prevMap = new Map(prevTotals.map(e => [e.id, e.amount]));
  return current.map(e => {
    const prevAmount = prevMap.get(e.id) ?? 0;
    const pctChange = prevAmount > 0 ? ((e.amount - prevAmount) / prevAmount) * 100 : null;
    return { ...e, prevAmount, pctChange };
  });
}

/**
 * Horizontal bar-per-category breakdown, sorted by spend descending with the
 * amount labeled on every bar (accessibility rule: never rely on bar length
 * alone). Clicking a bar toggles it as the active filter via `onSelect`.
 */
export function CategoryBars({ expenses, month, year, getCat, selected, onSelect, barHeight = 5 }: {
  expenses: Expense[];
  month: number;
  year: number;
  getCat: (id: string) => Category | undefined;
  selected?: string | null;
  onSelect?: (id: string | null) => void;
  barHeight?: number;
}) {
  const { t } = useLang();
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 50);
    return () => { clearTimeout(timer); setAnimated(false); };
  }, [month]);

  const entries = useMemo(
    () => getCategoryTotals(expenses, month, year, getCat, t, MUTED),
    [expenses, month, year, getCat, t],
  );

  if (entries.length === 0) return null;

  const maxAmt = entries[0].amount;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {entries.map(({ id, color, label, amount }, i) => {
        const isSelected = selected === id;
        const dimmed = selected != null && !isSelected;
        return (
          <button
            key={id}
            onClick={() => onSelect?.(isSelected ? null : id)}
            style={{
              display: "block", width: "100%", background: "transparent", border: "none",
              padding: "4px 2px", cursor: onSelect ? "pointer" : "default", textAlign: "left",
              opacity: dimmed ? 0.4 : 1, transition: "opacity 0.15s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: color, flexShrink: 0, display: "inline-block" }} />
              <span style={{ fontSize: "0.595rem", fontWeight: isSelected ? 700 : 500, color: isSelected ? CHARCOAL : STONE, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                {label}
              </span>
              <span style={{ fontSize: "0.595rem", color: CHARCOAL, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
                {fmtCurrency(amount)}
              </span>
            </div>
            <div style={{ height: barHeight, background: "#EDE8DF", borderRadius: 999, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: animated ? `${(amount / maxAmt) * 100}%` : "0%",
                background: color,
                borderRadius: 999,
                transition: "width 0.55s cubic-bezier(0.34, 1.56, 0.64, 1)",
                transitionDelay: `${i * 60}ms`,
              }} />
            </div>
          </button>
        );
      })}
    </div>
  );
}
