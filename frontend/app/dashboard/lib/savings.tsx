"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export type SavingsEntry = {
  id: string;
  userName: string;
  date: string;         // YYYY-MM-DD
  destinationCode: string;
  description: string;
  amount: number;
};

export type SavingsDestination = { code: string; label: string; color: string };

// The two known destinations today — free-text code on the backend (like
// categoryCode on Expense), display metadata owned entirely by the frontend.
// Colors picked from the existing palette in lib/categories.ts, distinct from
// #D9A0A8 (Lilly, in home/page.tsx's USER_COLORS) and #9AB89D (nav-off green).
export const SAVINGS_DESTINATIONS: SavingsDestination[] = [
  { code: "trade-republic",  label: "Trade Republic",  color: "#6B8FA6" },
  { code: "cuenta-conjunta", label: "Cuenta conjunta", color: "#C49050" },
];

// ── Storage / API helpers ─────────────────────────────────────────────────

const STORAGE_KEY = "millys_savings_v1";
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
type ApiSavingsEntry = {
  id: number;
  destinationCode: string;
  description: string;
  amount: number;
  date: string;
  userName: string;
};

function mapApi(api: ApiSavingsEntry): SavingsEntry {
  return {
    id:              String(api.id),
    userName:        api.userName        ?? "",
    date:            api.date            ?? "",
    destinationCode: api.destinationCode ?? "",
    description:     api.description     ?? "",
    amount:          Number(api.amount) || 0,
  };
}

// Shape sent to the API
type SavingsPayload = { destinationCode: string; description: string; amount: number; date: string; userName: string };

function toPayload(partial: Omit<SavingsEntry, "id">): SavingsPayload {
  return {
    destinationCode: partial.destinationCode,
    description:     partial.description,
    amount:          partial.amount,
    date:            partial.date,
    userName:        partial.userName,
  };
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${getToken()}`, ...options.headers },
  });
}

// ── Seed data (Test user only) ────────────────────────────────────────────

const SEED_SAVINGS: SavingsEntry[] = [
  { id: "1", userName: "Usuario 1", date: "2026-08-05", destinationCode: "trade-republic",  description: "", amount: 300.00 },
  { id: "2", userName: "Usuario 1", date: "2026-08-02", destinationCode: "cuenta-conjunta", description: "", amount: 200.00 },
  { id: "3", userName: "Usuario 2", date: "2026-08-02", destinationCode: "cuenta-conjunta", description: "", amount: 200.00 },
  { id: "4", userName: "Usuario 1", date: "2026-07-05", destinationCode: "trade-republic",  description: "", amount: 250.00 },
];

// ── Context ───────────────────────────────────────────────────────────────

export type SyncErrorAction = "add" | "update" | "delete";

type SavingsCtx = {
  savings: SavingsEntry[];
  ready: boolean;
  syncError: SyncErrorAction | null;
  dismissSyncError: () => void;
  addSaving: (partial: Omit<SavingsEntry, "id">) => void;
  updateSaving: (id: string, partial: Omit<SavingsEntry, "id">) => void;
  deleteSaving: (id: string) => void;
};

const SavingsContext = createContext<SavingsCtx>({
  savings: [],
  ready: false,
  syncError: null,
  dismissSyncError: () => {},
  addSaving: () => {},
  updateSaving: () => {},
  deleteSaving: () => {},
});

// ── Provider ──────────────────────────────────────────────────────────────

export function SavingsProvider({ children }: { children: React.ReactNode }) {
  const [savings, setSavings]   = useState<SavingsEntry[]>([]);
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
        setSavings(stored ? JSON.parse(stored) : SEED_SAVINGS);
      } catch { /* ignore */ }
      setReady(true);
    } else {
      apiFetch("/api/savings")
        .then(r => r.json())
        .then((data: ApiSavingsEntry[]) => { setSavings(data.map(mapApi)); setReady(true); })
        .catch(() => setReady(true));
    }
  }, []);

  // ── Persist to localStorage — Test user only ─────────────────────────────
  useEffect(() => {
    if (!ready || !test.current) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savings));
  }, [ready, savings]);

  // ── CRUD ─────────────────────────────────────────────────────────────────

  const addSaving = useCallback((partial: Omit<SavingsEntry, "id">) => {
    if (test.current) {
      setSavings(prev => [{ ...partial, id: crypto.randomUUID() }, ...prev]);
    } else {
      apiFetch("/api/savings", { method: "POST", body: JSON.stringify(toPayload(partial)) })
        .then(r => { if (!r.ok) throw new Error(); return r.json(); })
        .then((data: ApiSavingsEntry) => setSavings(prev => [mapApi(data), ...prev]))
        .catch(() => setSyncError("add"));
    }
  }, []);

  const updateSaving = useCallback((id: string, partial: Omit<SavingsEntry, "id">) => {
    let rollback: SavingsEntry[] = [];
    setSavings(prev => {
      rollback = prev;
      return prev.map(s => s.id === id ? { ...s, ...partial } : s);
    });
    if (!test.current) {
      apiFetch(`/api/savings/${id}`, { method: "PUT", body: JSON.stringify(toPayload(partial)) })
        .then(r => { if (!r.ok) throw new Error(); })
        .catch(() => { setSavings(rollback); setSyncError("update"); });
    }
  }, []);

  const deleteSaving = useCallback((id: string) => {
    let rollback: SavingsEntry[] = [];
    setSavings(prev => {
      rollback = prev;
      return prev.filter(s => s.id !== id);
    });
    if (!test.current) {
      apiFetch(`/api/savings/${id}`, { method: "DELETE", headers: { "Content-Type": "" } })
        .then(r => { if (!r.ok) throw new Error(); })
        .catch(() => { setSavings(rollback); setSyncError("delete"); });
    }
  }, []);

  const value = useMemo(
    () => ({ savings, ready, syncError, dismissSyncError, addSaving, updateSaving, deleteSaving }),
    [savings, ready, syncError, dismissSyncError, addSaving, updateSaving, deleteSaving]
  );

  return (
    <SavingsContext.Provider value={value}>
      {children}
    </SavingsContext.Provider>
  );
}

export function useSavings() {
  return useContext(SavingsContext);
}
