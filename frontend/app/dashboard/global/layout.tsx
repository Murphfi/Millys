import type { Metadata } from "next";

export const metadata: Metadata = { title: "Global" };

export default function GlobalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
