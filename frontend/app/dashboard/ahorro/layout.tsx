import type { Metadata } from "next";

export const metadata: Metadata = { title: "Ahorro" };

export default function AhorroLayout({ children }: { children: React.ReactNode }) {
  return children;
}
