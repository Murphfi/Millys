"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Lang = "es" | "en" | "ca";

const LANG_STORAGE_KEY = "millys_lang";

export const TRANSLATIONS = {
  es: {
    nav: { home: "Home", global: "Global", expenses: "Gastos", ahorro: "Ahorro", config: "Config" },
    home: { recent: "Últimos gastos", seeAll: "Ver todos", projection: "Proyección a fin de mes", viewAllExpenses: "Ver todos los gastos", split: "Reparto", variation: "Variación por categoría", newCategory: "Nuevo", summary: "Resumen" },
    expenses: {
      viewDay: "Día", viewWeek: "Semana", viewMonth: "Mes", viewCalendar: "Calendario",
      empty: "Sin gastos", loading: "Cargando...", today: "Hoy", total: "Total gastos", categoryTitle: "Gastos por categoría", clearFilter: "Ver todas",
      weekDays: ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"],
    },
    expense: {
      title: "Nuevo gasto",
      editTitle: "Editar gasto",
      kindExpense: "Gasto",
      kindIncome: "Ingreso",
      category: "Categoría",
      categoryPlaceholder: "Selecciona categoría",
      description: "Descripción",
      descriptionPlaceholder: "Ej. Mercadona, gasolina...",
      date: "Fecha",
      datePlaceholder: "dd/mm/aaaa",
      cancel: "Cancelar",
      add: "Añadir gasto",
      save: "Guardar",
    },
    income: {
      title: "Nuevo ingreso",
      editTitle: "Editar ingreso",
      description: "Descripción",
      descriptionPlaceholder: "Ej. Nómina, freelance, reembolso...",
      date: "Fecha",
      datePlaceholder: "dd/mm/aaaa",
      cancel: "Cancelar",
      add: "Añadir ingreso",
      save: "Guardar",
    },
    savings: {
      title: "Nuevo movimiento",
      editTitle: "Editar movimiento",
      destination: "Destino",
      destinationPlaceholder: "Selecciona destino",
      description: "Descripción",
      descriptionPlaceholder: "Nota opcional",
      date: "Fecha",
      datePlaceholder: "dd/mm/aaaa",
      cancel: "Cancelar",
      add: "Añadir ahorro",
      save: "Guardar",
    },
    savingsDestinations: {
      "trade-republic": "Trade Republic",
      "cuenta-conjunta": "Cuenta conjunta",
    },
    ahorro: {
      incomeTitle: "Ingresos",
      breakdownTitle: "Reparto sugerido",
      needs: "Necesidades 50%",
      wants: "Deseos 30%",
      savingsTarget: "Ahorro 20%",
      savingsTotalTitle: "Ahorrado este mes",
      aboveTarget: "por encima del objetivo",
      belowTarget: "por debajo del objetivo",
      movementsTitle: "Movimientos",
      empty: "Sin movimientos este mes",
      emptyIncome: "Añade el ingreso del mes para ver el reparto sugerido",
      incomeListTitle: "Ingresos del mes",
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
      addIncome: "No se ha podido añadir el ingreso. Inténtalo de nuevo.",
      updateIncome: "No se ha podido guardar el cambio. Se ha revertido.",
      deleteIncome: "No se ha podido eliminar el ingreso. Se ha restaurado.",
      addSaving: "No se ha podido añadir el movimiento. Inténtalo de nuevo.",
      updateSaving: "No se ha podido guardar el cambio. Se ha revertido.",
      deleteSaving: "No se ha podido eliminar el movimiento. Se ha restaurado.",
      addCategory: "No se ha podido añadir la categoría. Inténtalo de nuevo.",
      updateCategory: "No se ha podido guardar el cambio. Se ha revertido.",
      deleteCategory: "No se ha podido eliminar la categoría. Se ha restaurado.",
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
    nav: { home: "Home", global: "Global", expenses: "Expenses", ahorro: "Savings", config: "Config" },
    home: { recent: "Recent expenses", seeAll: "See all", projection: "Projected by month's end", viewAllExpenses: "View all expenses", split: "Split", variation: "Category change", newCategory: "New", summary: "Summary" },
    expenses: {
      viewDay: "Day", viewWeek: "Week", viewMonth: "Month", viewCalendar: "Calendar",
      empty: "No expenses", loading: "Loading...", today: "Today", total: "Total expenses", categoryTitle: "Spending by category", clearFilter: "Show all",
      weekDays: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
    },
    expense: {
      title: "New expense",
      editTitle: "Edit expense",
      kindExpense: "Expense",
      kindIncome: "Income",
      category: "Category",
      categoryPlaceholder: "Select category",
      description: "Description",
      descriptionPlaceholder: "E.g. Groceries, fuel...",
      date: "Date",
      datePlaceholder: "dd/mm/yyyy",
      cancel: "Cancel",
      add: "Add expense",
      save: "Save",
    },
    income: {
      title: "New income",
      editTitle: "Edit income",
      description: "Description",
      descriptionPlaceholder: "E.g. Salary, freelance, refund...",
      date: "Date",
      datePlaceholder: "dd/mm/yyyy",
      cancel: "Cancel",
      add: "Add income",
      save: "Save",
    },
    savings: {
      title: "New movement",
      editTitle: "Edit movement",
      destination: "Destination",
      destinationPlaceholder: "Select destination",
      description: "Description",
      descriptionPlaceholder: "Optional note",
      date: "Date",
      datePlaceholder: "dd/mm/yyyy",
      cancel: "Cancel",
      add: "Add savings",
      save: "Save",
    },
    savingsDestinations: {
      "trade-republic": "Trade Republic",
      "cuenta-conjunta": "Joint account",
    },
    ahorro: {
      incomeTitle: "Income",
      breakdownTitle: "Suggested split",
      needs: "Needs 50%",
      wants: "Wants 30%",
      savingsTarget: "Savings 20%",
      savingsTotalTitle: "Saved this month",
      aboveTarget: "above target",
      belowTarget: "below target",
      movementsTitle: "Movements",
      empty: "No movements this month",
      emptyIncome: "Add this month's income to see the suggested split",
      incomeListTitle: "This month's income",
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
      addIncome: "Couldn't add the income. Please try again.",
      updateIncome: "Couldn't save the change. It's been reverted.",
      deleteIncome: "Couldn't delete the income. It's been restored.",
      addSaving: "Couldn't add the movement. Please try again.",
      updateSaving: "Couldn't save the change. It's been reverted.",
      deleteSaving: "Couldn't delete the movement. It's been restored.",
      addCategory: "Couldn't add the category. Please try again.",
      updateCategory: "Couldn't save the change. It's been reverted.",
      deleteCategory: "Couldn't delete the category. It's been restored.",
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
    nav: { home: "Inici", global: "Global", expenses: "Despeses", ahorro: "Estalvi", config: "Config" },
    home: { recent: "Últimes despeses", seeAll: "Veure-les totes", projection: "Projecció a final de mes", viewAllExpenses: "Veure totes les despeses", split: "Repartiment", variation: "Variació per categoria", newCategory: "Nou", summary: "Resum" },
    expenses: {
      viewDay: "Dia", viewWeek: "Setmana", viewMonth: "Mes", viewCalendar: "Calendari",
      empty: "Sense despeses", loading: "Carregant...", today: "Avui", total: "Total despeses", categoryTitle: "Despeses per categoria", clearFilter: "Veure-les totes",
      weekDays: ["Dilluns","Dimarts","Dimecres","Dijous","Divendres","Dissabte","Diumenge"],
    },
    expense: {
      title: "Nova despesa",
      editTitle: "Edita la despesa",
      kindExpense: "Despesa",
      kindIncome: "Ingrés",
      category: "Categoria",
      categoryPlaceholder: "Selecciona una categoria",
      description: "Descripció",
      descriptionPlaceholder: "Ex. Mercadona, gasolina...",
      date: "Data",
      datePlaceholder: "dd/mm/aaaa",
      cancel: "Cancel·la",
      add: "Afegir despesa",
      save: "Desa",
    },
    income: {
      title: "Nou ingrés",
      editTitle: "Edita l'ingrés",
      description: "Descripció",
      descriptionPlaceholder: "Ex. Nòmina, freelance, reemborsament...",
      date: "Data",
      datePlaceholder: "dd/mm/aaaa",
      cancel: "Cancel·la",
      add: "Afegir ingrés",
      save: "Desa",
    },
    savings: {
      title: "Nou moviment",
      editTitle: "Edita el moviment",
      destination: "Destí",
      destinationPlaceholder: "Selecciona destí",
      description: "Descripció",
      descriptionPlaceholder: "Nota opcional",
      date: "Data",
      datePlaceholder: "dd/mm/aaaa",
      cancel: "Cancel·la",
      add: "Afegir estalvi",
      save: "Desa",
    },
    savingsDestinations: {
      "trade-republic": "Trade Republic",
      "cuenta-conjunta": "Compte conjunt",
    },
    ahorro: {
      incomeTitle: "Ingressos",
      breakdownTitle: "Repartiment suggerit",
      needs: "Necessitats 50%",
      wants: "Desitjos 30%",
      savingsTarget: "Estalvi 20%",
      savingsTotalTitle: "Estalviat aquest mes",
      aboveTarget: "per sobre de l'objectiu",
      belowTarget: "per sota de l'objectiu",
      movementsTitle: "Moviments",
      empty: "Sense moviments aquest mes",
      emptyIncome: "Afegeix l'ingrés del mes per veure el repartiment suggerit",
      incomeListTitle: "Ingressos del mes",
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
      addIncome: "No s'ha pogut afegir l'ingrés. Torna-ho a provar.",
      updateIncome: "No s'ha pogut desar el canvi. S'ha revertit.",
      deleteIncome: "No s'ha pogut eliminar l'ingrés. S'ha restaurat.",
      addSaving: "No s'ha pogut afegir el moviment. Torna-ho a provar.",
      updateSaving: "No s'ha pogut desar el canvi. S'ha revertit.",
      deleteSaving: "No s'ha pogut eliminar el moviment. S'ha restaurat.",
      addCategory: "No s'ha pogut afegir la categoria. Torna-ho a provar.",
      updateCategory: "No s'ha pogut desar el canvi. S'ha revertit.",
      deleteCategory: "No s'ha pogut eliminar la categoria. S'ha restaurat.",
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

/**
 * Returns the translated label for a savings destination — "Cuenta conjunta"
 * varies per locale, "Trade Republic" is a brand name and stays as-is via the
 * fallback.
 */
export function getDestinationLabel(dest: { code: string; label: string }, t: T): string {
  const destT = t.savingsDestinations as Record<string, string | undefined>;
  return destT[dest.code] ?? dest.label;
}
