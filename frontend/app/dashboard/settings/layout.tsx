import type { Metadata } from "next";

export const metadata: Metadata = { title: "Config" };

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
