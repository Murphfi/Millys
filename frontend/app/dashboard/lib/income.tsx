"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export type Income = {
  id: string;
  userName: string;
  date: string;         // YYYY-MM-DD
  description: string;
  amount: number;
};

// ── Storage / API helpers ─────────────────────────────────────────────────

const STORAGE_KEY = "millys_income_v1";
const API_URL     = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

function getToken(): string {
  return localStorage.getItem("token") ?? sessionStorage.getItem("token") ?? "";
}

function getCurrentUsername(): string {
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
type ApiIncome = {
  id: number;
  description: string;
  amount: number;
  date: string;
  userName: string;
};

function mapApi(api: ApiIncome): Income {
  return {
    id:          String(api.id),
    userName:    api.userName    ?? "",
    date:        api.date        ?? "",
    description: api.description ?? "",
    amount:      Number(api.amount) || 0,
  };
}

// Shape sent to the API
type IncomePayload = { description: string; amount: number; date: string; userName: string };

function toPayload(partial: Omit<Income, "id">): IncomePayload {
  return {
    description: partial.description,
    amount:      partial.amount,
    date:        partial.date,
    userName:    partial.userName,
  };
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${getToken()}`, ...options.headers },
  });
}

// ── Seed data (Test user only) ────────────────────────────────────────────

// Dated for the month each paycheck funds (both salaries actually land at
// month-end, so entering them on the 1st of the month they cover keeps the
// "this month" filter simple — no special-casing needed anywhere downstream).
const SEED_INCOME: Income[] = [
  { id: "1", userName: "Usuario 1", date: "2026-08-01", description: "Nómina",   amount: 2100.00 },
  { id: "2", userName: "Usuario 2", date: "2026-08-01", description: "Nómina",   amount: 1450.00 },
  { id: "3", userName: "Usuario 1", date: "2026-07-01", description: "Nómina",   amount: 2100.00 },
  { id: "4", userName: "Usuario 2", date: "2026-07-01", description: "Nómina",   amount: 1320.00 },
];

// ── Context ───────────────────────────────────────────────────────────────

export type SyncErrorAction = "add" | "update" | "delete";

type IncomeCtx = {
  income: Income[];
  ready: boolean;
  syncError: SyncErrorAction | null;
  dismissSyncError: () => void;
  addIncome: (partial: Omit<Income, "id">) => void;
  updateIncome: (id: string, partial: Omit<Income, "id">) => void;
  deleteIncome: (id: string) => void;
};

const IncomeContext = createContext<IncomeCtx>({
  income: [],
  ready: false,
  syncError: null,
  dismissSyncError: () => {},
  addIncome: () => {},
  updateIncome: () => {},
  deleteIncome: () => {},
});

// ── Provider ──────────────────────────────────────────────────────────────

export function IncomeProvider({ children }: { children: React.ReactNode }) {
  const [income, setIncome]     = useState<Income[]>([]);
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
        setIncome(stored ? JSON.parse(stored) : SEED_INCOME);
      } catch { /* ignore */ }
      setReady(true);
    } else {
      apiFetch("/api/incomes")
        .then(r => r.json())
        .then((data: ApiIncome[]) => { setIncome(data.map(mapApi)); setReady(true); })
        .catch(() => setReady(true));
    }
  }, []);

  // ── Persist to localStorage — Test user only ─────────────────────────────
  useEffect(() => {
    if (!ready || !test.current) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(income));
  }, [ready, income]);

  // ── CRUD ─────────────────────────────────────────────────────────────────

  const addIncome = useCallback((partial: Omit<Income, "id">) => {
    if (test.current) {
      setIncome(prev => [{ ...partial, id: crypto.randomUUID() }, ...prev]);
    } else {
      apiFetch("/api/incomes", { method: "POST", body: JSON.stringify(toPayload(partial)) })
        .then(r => { if (!r.ok) throw new Error(); return r.json(); })
        .then((data: ApiIncome) => setIncome(prev => [mapApi(data), ...prev]))
        .catch(() => setSyncError("add"));
    }
  }, []);

  const updateIncome = useCallback((id: string, partial: Omit<Income, "id">) => {
    let rollback: Income[] = [];
    setIncome(prev => {
      rollback = prev;
      return prev.map(i => i.id === id ? { ...i, ...partial } : i);
    });
    if (!test.current) {
      apiFetch(`/api/incomes/${id}`, { method: "PUT", body: JSON.stringify(toPayload(partial)) })
        .then(r => { if (!r.ok) throw new Error(); })
        .catch(() => { setIncome(rollback); setSyncError("update"); });
    }
  }, []);

  const deleteIncome = useCallback((id: string) => {
    let rollback: Income[] = [];
    setIncome(prev => {
      rollback = prev;
      return prev.filter(i => i.id !== id);
    });
    if (!test.current) {
      apiFetch(`/api/incomes/${id}`, { method: "DELETE", headers: { "Content-Type": "" } })
        .then(r => { if (!r.ok) throw new Error(); })
        .catch(() => { setIncome(rollback); setSyncError("delete"); });
    }
  }, []);

  const value = useMemo(
    () => ({ income, ready, syncError, dismissSyncError, addIncome, updateIncome, deleteIncome }),
    [income, ready, syncError, dismissSyncError, addIncome, updateIncome, deleteIncome]
  );

  return (
    <IncomeContext.Provider value={value}>
      {children}
    </IncomeContext.Provider>
  );
}

export function useIncome() {
  return useContext(IncomeContext);
}
