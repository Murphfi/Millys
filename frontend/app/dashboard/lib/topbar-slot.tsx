"use client";

import { createContext, useContext } from "react";

/**
 * Desktop-only portal target inside the shell's topbar row, to the left of the
 * add-expense/avatar cluster. Pages with their own top-of-page controls (e.g.
 * Gastos' month strip) can render into it instead of stacking a second header
 * row below the shell's. Null on mobile (own topbar) and before the shell has
 * mounted the slot element — callers should fall back to rendering inline.
 */
export const TopBarSlotContext = createContext<HTMLDivElement | null>(null);

export function useTopBarSlot() {
  return useContext(TopBarSlotContext);
}
