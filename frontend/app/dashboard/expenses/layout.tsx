import type { Metadata } from "next";

export const metadata: Metadata = { title: "Gastos" };

export default function ExpensesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
