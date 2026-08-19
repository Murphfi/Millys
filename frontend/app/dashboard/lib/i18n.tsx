"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Lang = "es" | "en" | "ca";

const LANG_STORAGE_KEY = "millys_lang";

export const TRANSLATIONS = {
  es: {
    nav: { home: "Home", global: "Global", expenses: "Gastos", config: "Config" },
    home: { recent: "Últimos gastos", seeAll: "Ver todos", projection: "Proyección a fin de mes", viewAllExpenses: "Ver todos los gastos" },
    expenses: {
      viewDay: "Día", viewWeek: "Semana", viewMonth: "Mes", viewCalendar: "Calendario",
      empty: "Sin gastos", loading: "Cargando...", today: "Hoy", total: "Total gastos", categoryTitle: "Gastos por categoría", clearFilter: "Ver todas",
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
      noDescription: "No necesita descripción",
    },
    calendar: {
      months: ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"],
      days: ["Lu","Ma","Mi","Ju","Vi","Sa","Do"],
    },
    errors: {
      add: "No se ha podido añadir el gasto. Inténtalo de nuevo.",
      update: "No se ha podido guardar el cambio. Se ha revertido.",
      delete: "No se ha podido eliminar el gasto. Se ha restaurado.",
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
    home: { recent: "Recent expenses", seeAll: "See all", projection: "Projected by month's end", viewAllExpenses: "View all expenses" },
    expenses: {
      viewDay: "Day", viewWeek: "Week", viewMonth: "Month", viewCalendar: "Calendar",
      empty: "No expenses", loading: "Loading...", today: "Today", total: "Total expenses", categoryTitle: "Spending by category", clearFilter: "Show all",
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
      noDescription: "No description needed",
    },
    calendar: {
      months: ["January","February","March","April","May","June","July","August","September","October","November","December"],
      days: ["Mo","Tu","We","Th","Fr","Sa","Su"],
    },
    errors: {
      add: "Couldn't add the expense. Please try again.",
      update: "Couldn't save the change. It's been reverted.",
      delete: "Couldn't delete the expense. It's been restored.",
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
    home: { recent: "Últimes despeses", seeAll: "Veure-les totes", projection: "Projecció a final de mes", viewAllExpenses: "Veure totes les despeses" },
    expenses: {
      viewDay: "Dia", viewWeek: "Setmana", viewMonth: "Mes", viewCalendar: "Calendari",
      empty: "Sense despeses", loading: "Carregant...", today: "Avui", total: "Total despeses", categoryTitle: "Despeses per categoria", clearFilter: "Veure-les totes",
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
      noDescription: "No necessita descripció",
    },
    calendar: {
      months: ["Gener","Febrer","Març","Abril","Maig","Juny","Juliol","Agost","Setembre","Octubre","Novembre","Desembre"],
      days: ["Dl","Dt","Dc","Dj","Dv","Ds","Dg"],
    },
    errors: {
      add: "No s'ha pogut afegir la despesa. Torna-ho a provar.",
      update: "No s'ha pogut desar el canvi. S'ha revertit.",
      delete: "No s'ha pogut eliminar la despesa. S'ha restaurat.",
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

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem(LANG_STORAGE_KEY, l);
  }, []);

  const value = useMemo(
    () => ({ lang, setLang, t: TRANSLATIONS[lang] as T }),
    [lang, setLang]
  );

  return (
    <LangContext.Provider value={value}>
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
