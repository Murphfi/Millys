"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch, isTestUser } from "./api";

export type Category = {
  id: string;     // stable code, used as local key (e.g. "supers")
  label: string;
  color: string;
  dbId?: number;         // numeric DB id, populated after syncing with the API
  noDescription?: boolean; // hide the description field for this category (e.g. Chofa)
};

// Increment this when DEFAULT_CATEGORIES changes to invalidate stale localStorage
const CATEGORIES_VERSION = 3;
const STORAGE_KEY = `millys_categories_v${CATEGORIES_VERSION}`;

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "supers",  label: "Supers",               color: "#D4845A" },
  { id: "comida",  label: "Comida",               color: "#7A96B0" },
  { id: "casa",    label: "Casa",                 color: "#5E7C64" },
  { id: "chofa",   label: "Chofa",                color: "#7A96B0", noDescription: true },
  { id: "michis",  label: "Michis",               color: "#7A96B0" },
  { id: "ocio",    label: "Ocio",                 color: "#A78BFA" },
  { id: "susfij",  label: "Suscripciones/Fijos",  color: "#9B8DC4" },
  { id: "otros",   label: "Otros",                color: "#A09890" },
];

// Color palette for category creation / editing
export const COLOR_PALETTE = [
  "#D4845A", "#E07878", "#D4BC50", "#5A9E98",
  "#7A96B0", "#5E7C64", "#9B8DC4", "#A78BFA",
  "#C49050", "#78726A", "#A09890", "#6B8FA6",
];

// Shape returned by the API
type ApiCategory = {
  id: number;
  code: string;
  label: string;
  color: string;
  default: boolean;
  noDescription: boolean;
};

function mapApi(api: ApiCategory): Category {
  return { id: api.code, label: api.label, color: api.color, dbId: api.id, noDescription: api.noDescription };
}

type CategoryPayload = { code: string; label: string; color: string; noDescription: boolean };

function makeCode(label: string): string {
  return label.toLowerCase().replace(/\s+/g, "_") + "_" + Date.now();
}

// ── Context ───────────────────────────────────────────────────────────────

export type SyncErrorAction = "add" | "update" | "delete";

type NewCategory = { label: string; color: string; noDescription?: boolean };
type CategoryEdit = { label: string; color: string; noDescription?: boolean };

type CategoriesCtx = {
  categories: Category[];
  ready: boolean;
  syncError: SyncErrorAction | null;
  dismissSyncError: () => void;
  addCategory: (data: NewCategory) => void;
  updateCategory: (id: string, data: CategoryEdit) => void;
  deleteCategory: (id: string) => void;
};

const CategoriesContext = createContext<CategoriesCtx>({
  categories: DEFAULT_CATEGORIES,
  ready: false,
  syncError: null,
  dismissSyncError: () => {},
  addCategory: () => {},
  updateCategory: () => {},
  deleteCategory: () => {},
});

// ── Provider ──────────────────────────────────────────────────────────────

export function CategoriesProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [ready, setReady]           = useState(false);
  const [syncError, setSyncError]   = useState<SyncErrorAction | null>(null);
  const test                        = useRef(false);   // true = Test user → localStorage
  const categoriesRef               = useRef(categories); // mirrors state for sync dbId lookups

  useEffect(() => { categoriesRef.current = categories; }, [categories]);

  const dismissSyncError = useCallback(() => setSyncError(null), []);

  // ── Initial load ────────────────────────────────────────────────────────
  useEffect(() => {
    test.current = isTestUser();

    if (test.current) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        setCategories(stored ? JSON.parse(stored) : DEFAULT_CATEGORIES);
      } catch { /* ignore */ }
      setReady(true);
    } else {
      apiFetch("/api/categories")
        .then(r => r.ok ? r.json() : Promise.reject())
        .then((data: ApiCategory[]) => {
          if (data.length > 0) setCategories(data.map(mapApi));
          setReady(true);
        })
        .catch(() => setReady(true));
    }
  }, []);

  // ── Persist to localStorage — Test user only ─────────────────────────────
  useEffect(() => {
    if (!ready || !test.current) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
  }, [ready, categories]);

  // ── CRUD ─────────────────────────────────────────────────────────────────

  const addCategory = useCallback((data: NewCategory) => {
    const code = makeCode(data.label);
    if (test.current) {
      setCategories(prev => [...prev, { id: code, label: data.label, color: data.color, noDescription: data.noDescription }]);
      return;
    }
    const payload: CategoryPayload = { code, label: data.label, color: data.color, noDescription: !!data.noDescription };
    apiFetch("/api/categories", { method: "POST", body: JSON.stringify(payload) })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then((created: ApiCategory) => setCategories(prev => [...prev, mapApi(created)]))
      .catch(() => setSyncError("add"));
  }, []);

  const updateCategory = useCallback((id: string, data: CategoryEdit) => {
    const dbId = categoriesRef.current.find(c => c.id === id)?.dbId;
    let rollback: Category[] = [];
    setCategories(prev => {
      rollback = prev;
      return prev.map(c => c.id === id ? { ...c, ...data } : c);
    });
    if (test.current || !dbId) return;
    apiFetch(`/api/categories/${dbId}`, {
      method: "PUT",
      body: JSON.stringify({ code: id, label: data.label, color: data.color, noDescription: !!data.noDescription }),
    })
      .then(r => { if (!r.ok) throw new Error(); })
      .catch(() => { setCategories(rollback); setSyncError("update"); });
  }, []);

  const deleteCategory = useCallback((id: string) => {
    const dbId = categoriesRef.current.find(c => c.id === id)?.dbId;
    let rollback: Category[] = [];
    setCategories(prev => {
      rollback = prev;
      return prev.filter(c => c.id !== id);
    });
    if (test.current || !dbId) return;
    apiFetch(`/api/categories/${dbId}`, { method: "DELETE", headers: { "Content-Type": "" } })
      .then(r => { if (!r.ok) throw new Error(); })
      .catch(() => { setCategories(rollback); setSyncError("delete"); });
  }, []);

  const value = useMemo(
    () => ({ categories, ready, syncError, dismissSyncError, addCategory, updateCategory, deleteCategory }),
    [categories, ready, syncError, dismissSyncError, addCategory, updateCategory, deleteCategory]
  );

  return (
    <CategoriesContext.Provider value={value}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories() {
  return useContext(CategoriesContext);
}
