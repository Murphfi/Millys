"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch, isTestUser } from "./api";

export type InstallmentPlan = {
  id: string;
  userName: string;
  description: string;
  totalAmount: number;
  monthlyAmount: number;
  startDate: string;   // YYYY-MM-DD
  initialPaidAmount: number; // manual starting balance for payments made before this plan existed in Millys
  paidAmount: number;  // initialPaidAmount + sum of real expenses linked to this plan
  paidCount: number;
};

// ── Storage / API helpers ─────────────────────────────────────────────────

const STORAGE_KEY = "millys_installments_v1";

// Shape returned by the API
type ApiInstallmentPlan = {
  id: number;
  description: string;
  totalAmount: number;
  monthlyAmount: number;
  startDate: string;
  userName: string;
  paidAmount: number;
  paidCount: number;
  initialPaidAmount: number;
};

function mapApi(api: ApiInstallmentPlan): InstallmentPlan {
  return {
    id:                String(api.id),
    userName:          api.userName ?? "",
    description:       api.description ?? "",
    totalAmount:       Number(api.totalAmount) || 0,
    monthlyAmount:     Number(api.monthlyAmount) || 0,
    startDate:         api.startDate ?? "",
    initialPaidAmount: Number(api.initialPaidAmount) || 0,
    paidAmount:        Number(api.paidAmount) || 0,
    paidCount:         Number(api.paidCount) || 0,
  };
}

// Shape sent to the API
type InstallmentPlanPayload = { description: string; totalAmount: number; monthlyAmount: number; startDate: string; userName: string; initialPaidAmount: number };

function toPayload(partial: Omit<InstallmentPlan, "id" | "paidAmount" | "paidCount">): InstallmentPlanPayload {
  return {
    description:       partial.description,
    totalAmount:       partial.totalAmount,
    monthlyAmount:     partial.monthlyAmount,
    startDate:         partial.startDate,
    userName:          partial.userName,
    initialPaidAmount: partial.initialPaidAmount,
  };
}

// ── Seed data (Test user only) ────────────────────────────────────────────

const SEED_INSTALLMENTS: InstallmentPlan[] = [
  { id: "1", userName: "Usuario 1", description: "Coche", totalAmount: 12000, monthlyAmount: 250, startDate: "2026-01-01", initialPaidAmount: 0, paidAmount: 2000, paidCount: 8 },
];

// ── Context ───────────────────────────────────────────────────────────────

export type SyncErrorAction = "add" | "update" | "delete";

type InstallmentPlanInput = Omit<InstallmentPlan, "id" | "paidAmount" | "paidCount">;

type InstallmentsCtx = {
  installments: InstallmentPlan[];
  ready: boolean;
  syncError: SyncErrorAction | null;
  dismissSyncError: () => void;
  addInstallment: (partial: InstallmentPlanInput) => void;
  updateInstallment: (id: string, partial: InstallmentPlanInput) => void;
  deleteInstallment: (id: string) => void;
};

const InstallmentsContext = createContext<InstallmentsCtx>({
  installments: [],
  ready: false,
  syncError: null,
  dismissSyncError: () => {},
  addInstallment: () => {},
  updateInstallment: () => {},
  deleteInstallment: () => {},
});

// ── Provider ──────────────────────────────────────────────────────────────

export function InstallmentsProvider({ children }: { children: React.ReactNode }) {
  const [installments, setInstallments] = useState<InstallmentPlan[]>([]);
  const [ready, setReady]               = useState(false);
  const [syncError, setSyncError]       = useState<SyncErrorAction | null>(null);
  const test                            = useRef(false);   // true = Test user → localStorage

  const dismissSyncError = useCallback(() => setSyncError(null), []);

  // ── Initial load ────────────────────────────────────────────────────────
  useEffect(() => {
    test.current = isTestUser();

    if (test.current) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        setInstallments(stored ? JSON.parse(stored) : SEED_INSTALLMENTS);
      } catch { /* ignore */ }
      setReady(true);
    } else {
      apiFetch("/api/installment-plans")
        .then(r => r.json())
        .then((data: ApiInstallmentPlan[]) => { setInstallments(data.map(mapApi)); setReady(true); })
        .catch(() => setReady(true));
    }
  }, []);

  // ── Persist to localStorage — Test user only ─────────────────────────────
  useEffect(() => {
    if (!ready || !test.current) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(installments));
  }, [ready, installments]);

  // ── CRUD ─────────────────────────────────────────────────────────────────

  const addInstallment = useCallback((partial: InstallmentPlanInput) => {
    if (test.current) {
      setInstallments(prev => [{ ...partial, id: crypto.randomUUID(), paidAmount: partial.initialPaidAmount, paidCount: 0 }, ...prev]);
    } else {
      apiFetch("/api/installment-plans", { method: "POST", body: JSON.stringify(toPayload(partial)) })
        .then(r => { if (!r.ok) throw new Error(); return r.json(); })
        .then((data: ApiInstallmentPlan) => setInstallments(prev => [mapApi(data), ...prev]))
        .catch(() => setSyncError("add"));
    }
  }, []);

  const updateInstallment = useCallback((id: string, partial: InstallmentPlanInput) => {
    let rollback: InstallmentPlan[] = [];
    setInstallments(prev => {
      rollback = prev;
      return prev.map(p => p.id === id ? { ...p, ...partial, paidAmount: test.current ? partial.initialPaidAmount : p.paidAmount } : p);
    });
    if (!test.current) {
      apiFetch(`/api/installment-plans/${id}`, { method: "PUT", body: JSON.stringify(toPayload(partial)) })
        .then(r => { if (!r.ok) throw new Error(); return r.json(); })
        .then((data: ApiInstallmentPlan) => setInstallments(prev => prev.map(p => p.id === id ? mapApi(data) : p)))
        .catch(() => { setInstallments(rollback); setSyncError("update"); });
    }
  }, []);

  const deleteInstallment = useCallback((id: string) => {
    let rollback: InstallmentPlan[] = [];
    setInstallments(prev => {
      rollback = prev;
      return prev.filter(p => p.id !== id);
    });
    if (!test.current) {
      apiFetch(`/api/installment-plans/${id}`, { method: "DELETE", headers: { "Content-Type": "" } })
        .then(r => { if (!r.ok) throw new Error(); })
        .catch(() => { setInstallments(rollback); setSyncError("delete"); });
    }
  }, []);

  const value = useMemo(
    () => ({ installments, ready, syncError, dismissSyncError, addInstallment, updateInstallment, deleteInstallment }),
    [installments, ready, syncError, dismissSyncError, addInstallment, updateInstallment, deleteInstallment]
  );

  return (
    <InstallmentsContext.Provider value={value}>
      {children}
    </InstallmentsContext.Provider>
  );
}

export function useInstallments() {
  return useContext(InstallmentsContext);
}
