"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch, isTestUser } from "./api";

export type Expense = {
  id: string;
  categoryId: string;
  userName: string;
  date: string;         // YYYY-MM-DD
  description: string;
  amount: number;
  installmentPlanId?: string | null;  // optional link to a financing plan's monthly payment
  shared: boolean;  // false = personal expense, excluded from the couple's split/comparison math
};

// ── Storage / API helpers ─────────────────────────────────────────────────

const STORAGE_KEY = "millys_expenses_v1";

// Shape returned by the API
type ApiExpense = {
  id: number;
  categoryCode: string;
  description: string;
  amount: number;
  date: string;
  userName: string;
  installmentPlanId: number | null;
  shared: boolean;
};

function mapApi(api: ApiExpense): Expense {
  return {
    id:                String(api.id),
    categoryId:        api.categoryCode  ?? "",
    userName:          api.userName      ?? "",
    date:              api.date          ?? "",
    description:       api.description   ?? "",
    amount:            Number(api.amount) || 0,
    installmentPlanId: api.installmentPlanId != null ? String(api.installmentPlanId) : null,
    shared:            api.shared !== false,
  };
}

// Shape sent to the API
type ExpensePayload = { categoryCode: string; description: string; amount: number; date: string; userName: string; installmentPlanId: number | null; shared: boolean };

function toPayload(partial: Omit<Expense, "id">): ExpensePayload {
  return {
    categoryCode:      partial.categoryId,
    description:       partial.description,
    amount:            partial.amount,
    date:              partial.date,
    userName:          partial.userName,
    installmentPlanId: partial.installmentPlanId != null ? Number(partial.installmentPlanId) : null,
    shared:            partial.shared,
  };
}

// ── Seed data (Test user only) ────────────────────────────────────────────

const SEED_EXPENSES: Expense[] = [
  { id: "1",  categoryId: "supers",  userName: "Usuario 1", date: "2026-08-15", description: "Mercadona Girada",   amount: 57.30, shared: true  },
  { id: "2",  categoryId: "comida",  userName: "Usuario 2", date: "2026-08-13", description: "Kebab Vilafranca",  amount: 12.00, shared: true  },
  { id: "3",  categoryId: "michis",  userName: "Usuario 1", date: "2026-08-12", description: "Comida gatos",      amount: 28.50, shared: true  },
  { id: "4",  categoryId: "casa",    userName: "Usuario 2", date: "2026-08-11", description: "Bazar Vilanova",    amount: 43.20, shared: true  },
  { id: "5",  categoryId: "susfij",  userName: "Usuario 1", date: "2026-08-09", description: "Netflix",           amount: 17.99, shared: true  },
  { id: "6",  categoryId: "supers",  userName: "Usuario 1", date: "2026-08-07", description: "Lidl",              amount: 33.60, shared: true  },
  { id: "7",  categoryId: "ocio",    userName: "Usuario 2", date: "2026-08-05", description: "Cine",              amount: 22.00, shared: true  },
  { id: "8",  categoryId: "supers",  userName: "Usuario 2", date: "2026-08-03", description: "Esclat",            amount: 36.68, shared: true  },
  { id: "9",  categoryId: "chofa",   userName: "Usuario 1", date: "2026-08-01", description: "",                  amount: 40.00, shared: false },
  { id: "10", categoryId: "supers",  userName: "Usuario 2", date: "2026-07-28", description: "Aldi Vilafranca",   amount: 31.45, shared: true  },
  { id: "11", categoryId: "casa",    userName: "Usuario 1", date: "2026-07-25", description: "Timbre",            amount: 59.99, shared: true  },
  { id: "12", categoryId: "comida",  userName: "Usuario 1", date: "2026-07-20", description: "Makondo",           amount: 14.00, shared: true  },
  { id: "13", categoryId: "michis",  userName: "Usuario 1", date: "2026-07-17", description: "Vet",               amount: 87.75, shared: true  },
  { id: "14", categoryId: "supers",  userName: "Usuario 1", date: "2026-07-12", description: "Esclat",            amount: 67.20, shared: true  },
  { id: "15", categoryId: "susfij",  userName: "Usuario 1", date: "2026-07-08", description: "Spotify",           amount: 10.99, shared: true  },
  { id: "16", categoryId: "otros",   userName: "Usuario 2", date: "2026-07-05", description: "Pepco",             amount: 9.10,  shared: true  },
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
