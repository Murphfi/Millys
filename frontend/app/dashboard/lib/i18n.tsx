"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Lang = "es" | "en" | "ca";

const LANG_STORAGE_KEY = "millys_lang";

export const TRANSLATIONS = {
  es: {
    nav: { home: "Home", global: "Global", expenses: "Gastos", config: "Config" },
    expenses: {
      viewDay: "Día", viewWeek: "Semana", viewMonth: "Mes", viewCalendar: "Calendario",
      empty: "Sin gastos", today: "Hoy", total: "Total gastos", categoryTitle: "Gastos por categoría",
      weekDays: ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"],
    },
    expense: {
      title: "Nuevo gasto",
      category: "Categoría",
      categoryPlaceholder: "Selecciona categoría",
      description: "Descripción",
      descriptionPlaceholder: "Ej. Mercadona, gasolina...",
      date: "Fecha",
      datePlaceholder: "dd/mm/aaaa",
      cancel: "Cancelar",
      add: "Añadir gasto",
    },
    settings: {
      categoriesTitle: "Categorías",
      categoryLabel: "categoría",
      categoryLabelPlural: "categorías",
      newCategory: "Nueva",
      categoryNamePlaceholder: "Nombre de categoría",
      color: "Color",
      save: "Guardar",
      cancel: "Cancelar",
      colorApply: "Aplicar",
      languageTitle: "Idioma",
    },
    calendar: {
      months: ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"],
      days: ["Lu","Ma","Mi","Ju","Vi","Sa","Do"],
    },
    languages: { es: "Español", en: "English", ca: "Català" },
    categories: {
      supers: "Supers",
      comida: "Comida",
      casa:   "Casa",
      chofa:  "Chofa",
      michis: "Michis",
      ocio:   "Ocio",
      susfij: "Suscripciones/Fijos",
      otros:  "Otros",
    },
  },
  en: {
    nav: { home: "Home", global: "Global", expenses: "Expenses", config: "Config" },
    expenses: {
      viewDay: "Day", viewWeek: "Week", viewMonth: "Month", viewCalendar: "Calendar",
      empty: "No expenses", today: "Today", total: "Total expenses", categoryTitle: "Spending by category",
      weekDays: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
    },
    expense: {
      title: "New expense",
      category: "Category",
      categoryPlaceholder: "Select category",
      description: "Description",
      descriptionPlaceholder: "E.g. Groceries, fuel...",
      date: "Date",
      datePlaceholder: "dd/mm/yyyy",
      cancel: "Cancel",
      add: "Add expense",
    },
    settings: {
      categoriesTitle: "Categories",
      categoryLabel: "category",
      categoryLabelPlural: "categories",
      newCategory: "New",
      categoryNamePlaceholder: "Category name",
      color: "Color",
      save: "Save",
      cancel: "Cancel",
      colorApply: "Apply",
      languageTitle: "Language",
    },
    calendar: {
      months: ["January","February","March","April","May","June","July","August","September","October","November","December"],
      days: ["Mo","Tu","We","Th","Fr","Sa","Su"],
    },
    languages: { es: "Español", en: "English", ca: "Català" },
    categories: {
      supers: "Supers",
      comida: "Food",
      casa:   "Home",
      chofa:  "Chofa",
      michis: "Michis",
      ocio:   "Leisure",
      susfij: "Subscriptions/Fixed",
      otros:  "Others",
    },
  },
  ca: {
    nav: { home: "Inici", global: "Global", expenses: "Despeses", config: "Config" },
    expenses: {
      viewDay: "Dia", viewWeek: "Setmana", viewMonth: "Mes", viewCalendar: "Calendari",
      empty: "Sense despeses", today: "Avui", total: "Total despeses", categoryTitle: "Despeses per categoria",
      weekDays: ["Dilluns","Dimarts","Dimecres","Dijous","Divendres","Dissabte","Diumenge"],
    },
    expense: {
      title: "Nova despesa",
      category: "Categoria",
      categoryPlaceholder: "Selecciona una categoria",
      description: "Descripció",
      descriptionPlaceholder: "Ex. Mercadona, gasolina...",
      date: "Data",
      datePlaceholder: "dd/mm/aaaa",
      cancel: "Cancel·la",
      add: "Afegir despesa",
    },
    settings: {
      categoriesTitle: "Categories",
      categoryLabel: "categoria",
      categoryLabelPlural: "categories",
      newCategory: "Nova",
      categoryNamePlaceholder: "Nom de la categoria",
      color: "Color",
      save: "Desa",
      cancel: "Cancel·la",
      colorApply: "Aplica",
      languageTitle: "Idioma",
    },
    calendar: {
      months: ["Gener","Febrer","Març","Abril","Maig","Juny","Juliol","Agost","Setembre","Octubre","Novembre","Desembre"],
      days: ["Dl","Dt","Dc","Dj","Dv","Ds","Dg"],
    },
    languages: { es: "Español", en: "English", ca: "Català" },
    categories: {
      supers: "Supers",
      comida: "Menjar",
      casa:   "Casa",
      chofa:  "Chofa",
      michis: "Michis",
      ocio:   "Lleure",
      susfij: "Subscripcions/Fixos",
      otros:  "Altres",
    },
  },
} as const;

type T = typeof TRANSLATIONS.es;

const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: T }>({
  lang: "es",
  setLang: () => {},
  t: TRANSLATIONS.es,
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("es");

  useEffect(() => {
    const stored = localStorage.getItem(LANG_STORAGE_KEY) as Lang | null;
    if (stored && stored in TRANSLATIONS) setLangState(stored);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem(LANG_STORAGE_KEY, l);
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t: TRANSLATIONS[lang] as T }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}

/**
 * Returns the translated label for a category if it's a default one,
 * or the stored label for user-created categories.
 */
export function getCategoryLabel(cat: { id: string; label: string }, t: T): string {
  const catT = t.categories as Record<string, string | undefined>;
  return catT[cat.id] ?? cat.label;
}
