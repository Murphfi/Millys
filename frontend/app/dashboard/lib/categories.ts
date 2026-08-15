import { useEffect, useState } from "react";

export type Category = {
  id: string;     // stable code, used as local key (e.g. "supers")
  label: string;
  color: string;
  dbId?: number;  // numeric DB id, populated after syncing with the API
};

// Increment this when DEFAULT_CATEGORIES changes to invalidate stale localStorage
const CATEGORIES_VERSION = 2;
export const CATEGORIES_STORAGE_KEY = `millys_categories_v${CATEGORIES_VERSION}`;

// TODO: replace with GET /api/categories
export const DEFAULT_CATEGORIES: Category[] = [
  { id: "supers",  label: "Supers",               color: "#D4845A" },
  { id: "comida",  label: "Comida",               color: "#7A96B0" },
  { id: "casa",    label: "Casa",                 color: "#5E7C64" },
  { id: "chofa",   label: "Chofa",                color: "#7A96B0" },
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

// TODO: swap localStorage reads/writes for GET/POST/PUT/DELETE /api/categories
export function useCategories(): [Category[], React.Dispatch<React.SetStateAction<Category[]>>] {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [ready, setReady] = useState(false);

  // Load after mount — sets ready=true so the persist effect can start
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      if (stored) setCategories(JSON.parse(stored));
    } catch { /* ignore */ }
    setReady(true);
  }, []);

  // Only persist once ready (prevents overwriting localStorage with DEFAULT_CATEGORIES on mount)
  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
  }, [ready, categories]);

  return [categories, setCategories];
}
