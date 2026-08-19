"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export type Expense = {
  id: string;
  categoryId: string;
  userName: string;
  date: string;         // YYYY-MM-DD
  description: string;
  amount: number;
};

// ── Storage / API helpers ─────────────────────────────────────────────────

const STORAGE_KEY = "millys_expenses_v1";
const API_URL     = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

function getToken(): string {
  return localStorage.getItem("token") ?? sessionStorage.getItem("token") ?? "";
}

export function getCurrentUsername(): string {
  try {
    const token = getToken();
    if (!token) return "";
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub ?? payload.username ?? "";
  } catch { return ""; }
}

function isTestUser(): boolean {
  return getCurrentUsername().toLowerCase() === "test";
}

// Shape returned by the API
type ApiExpense = {
  id: number;
  categoryCode: string;
  description: string;
  amount: number;
  date: string;
  userName: string;
};

function mapApi(api: ApiExpense): Expense {
  return {
    id:          String(api.id),
    categoryId:  api.categoryCode  ?? "",
    userName:    api.userName      ?? "",
    date:        api.date          ?? "",
    description: api.description   ?? "",
    amount:      Number(api.amount) || 0,
  };
}

// Shape sent to the API
type ExpensePayload = { categoryCode: string; description: string; amount: number; date: string; userName: string };

function toPayload(partial: Omit<Expense, "id">): ExpensePayload {
  return {
    categoryCode: partial.categoryId,
    description:  partial.description,
    amount:       partial.amount,
    date:         partial.date,
    userName:     partial.userName,
  };
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${getToken()}`, ...options.headers },
  });
}

// ── Seed data (Test user only) ────────────────────────────────────────────

const SEED_EXPENSES: Expense[] = [
  { id: "1",  categoryId: "supers",  userName: "Marçal", date: "2026-08-15", description: "Mercadona Girada",   amount: 57.30 },
  { id: "2",  categoryId: "comida",  userName: "Lilly",  date: "2026-08-13", description: "Kebab Vilafranca",  amount: 12.00 },
  { id: "3",  categoryId: "michis",  userName: "Marçal", date: "2026-08-12", description: "Comida gatos",      amount: 28.50 },
  { id: "4",  categoryId: "casa",    userName: "Lilly",  date: "2026-08-11", description: "Bazar Vilanova",    amount: 43.20 },
  { id: "5",  categoryId: "susfij",  userName: "Marçal", date: "2026-08-09", description: "Netflix",           amount: 17.99 },
  { id: "6",  categoryId: "supers",  userName: "Marçal", date: "2026-08-07", description: "Lidl",              amount: 33.60 },
  { id: "7",  categoryId: "ocio",    userName: "Lilly",  date: "2026-08-05", description: "Cine",              amount: 22.00 },
  { id: "8",  categoryId: "supers",  userName: "Lilly",  date: "2026-08-03", description: "Esclat",            amount: 36.68 },
  { id: "9",  categoryId: "chofa",   userName: "Marçal", date: "2026-08-01", description: "",                  amount: 40.00 },
  { id: "10", categoryId: "supers",  userName: "Lilly",  date: "2026-07-28", description: "Aldi Vilafranca",   amount: 31.45 },
  { id: "11", categoryId: "casa",    userName: "Marçal", date: "2026-07-25", description: "Timbre",            amount: 59.99 },
  { id: "12", categoryId: "comida",  userName: "Marçal", date: "2026-07-20", description: "Makondo",           amount: 14.00 },
  { id: "13", categoryId: "michis",  userName: "Marçal", date: "2026-07-17", description: "Vet",               amount: 87.75 },
  { id: "14", categoryId: "supers",  userName: "Marçal", date: "2026-07-12", description: "Esclat",            amount: 67.20 },
  { id: "15", categoryId: "susfij",  userName: "Marçal", date: "2026-07-08", description: "Spotify",           amount: 10.99 },
  { id: "16", categoryId: "otros",   userName: "Lilly",  date: "2026-07-05", description: "Pepco",             amount: 9.10  },
];

// ── Context ───────────────────────────────────────────────────────────────

export type SyncErrorAction = "add" | "update" | "delete";

type ExpensesCtx = {
  expenses: Expense[];
  ready: boolean;
  syncError: SyncErrorAction | null;
  dismissSyncError: () => void;
  addExpense: (partial: Omit<Expense, "id">) => void;
  updateExpense: (id: string, partial: Omit<Expense, "id">) => void;
  deleteExpense: (id: string) => void;
};

const ExpensesContext = createContext<ExpensesCtx>({
  expenses: [],
  ready: false,
  syncError: null,
  dismissSyncError: () => {},
  addExpense: () => {},
  updateExpense: () => {},
  deleteExpense: () => {},
});

// ── Provider ──────────────────────────────────────────────────────────────

export function ExpensesProvider({ children }: { children: React.ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [ready, setReady]       = useState(false);
  const [syncError, setSyncError] = useState<SyncErrorAction | null>(null);
  const test                    = useRef(false);   // true = Test user → localStorage

  const dismissSyncError = useCallback(() => setSyncError(null), []);

  // ── Initial load ────────────────────────────────────────────────────────
  useEffect(() => {
    test.current = isTestUser();

    if (test.current) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        setExpenses(stored ? JSON.parse(stored) : SEED_EXPENSES);
      } catch { /* ignore */ }
      setReady(true);
    } else {
      apiFetch("/api/expenses")
        .then(r => r.json())
        .then((data: ApiExpense[]) => { setExpenses(data.map(mapApi)); setReady(true); })
        .catch(() => setReady(true));
    }
  }, []);

  // ── Persist to localStorage — Test user only ─────────────────────────────
  useEffect(() => {
    if (!ready || !test.current) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  }, [ready, expenses]);

  // ── CRUD ─────────────────────────────────────────────────────────────────

  const addExpense = useCallback((partial: Omit<Expense, "id">) => {
    if (test.current) {
      setExpenses(prev => [{ ...partial, id: crypto.randomUUID() }, ...prev]);
    } else {
      apiFetch("/api/expenses", { method: "POST", body: JSON.stringify(toPayload(partial)) })
        .then(r => { if (!r.ok) throw new Error(); return r.json(); })
        .then((data: ApiExpense) => setExpenses(prev => [mapApi(data), ...prev]))
        .catch(() => setSyncError("add"));
    }
  }, []);

  const updateExpense = useCallback((id: string, partial: Omit<Expense, "id">) => {
    let rollback: Expense[] = [];
    setExpenses(prev => {
      rollback = prev;
      return prev.map(e => e.id === id ? { ...e, ...partial } : e);
    });
    if (!test.current) {
      apiFetch(`/api/expenses/${id}`, { method: "PUT", body: JSON.stringify(toPayload(partial)) })
        .then(r => { if (!r.ok) throw new Error(); })
        .catch(() => { setExpenses(rollback); setSyncError("update"); });
    }
  }, []);

  const deleteExpense = useCallback((id: string) => {
    let rollback: Expense[] = [];
    setExpenses(prev => {
      rollback = prev;
      return prev.filter(e => e.id !== id);
    });
    if (!test.current) {
      apiFetch(`/api/expenses/${id}`, { method: "DELETE", headers: { "Content-Type": "" } })
        .then(r => { if (!r.ok) throw new Error(); })
        .catch(() => { setExpenses(rollback); setSyncError("delete"); });
    }
  }, []);

  const value = useMemo(
    () => ({ expenses, ready, syncError, dismissSyncError, addExpense, updateExpense, deleteExpense }),
    [expenses, ready, syncError, dismissSyncError, addExpense, updateExpense, deleteExpense]
  );

  return (
    <ExpensesContext.Provider value={value}>
      {children}
    </ExpensesContext.Provider>
  );
}

export function useExpenses() {
  return useContext(ExpensesContext);
}
