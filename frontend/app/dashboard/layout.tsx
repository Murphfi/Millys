"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Home, BarChart3, Receipt, LogOut, Settings, PiggyBank } from "lucide-react";
import { AddExpenseButton } from "./add-expense-dialog";
import { LangProvider, useLang } from "./lib/i18n";
import { CategoriesProvider } from "./lib/categories";
import { ExpensesProvider } from "./lib/expenses";
import { IncomeProvider } from "./lib/income";
import { SavingsProvider } from "./lib/savings";
import { InstallmentsProvider } from "./lib/installments";
import { TopBarSlotContext } from "./lib/topbar-slot";

const SAGE     = "#5E7C64";
const CARD     = "#FAF9F7";
const CHARCOAL = "#2A2720";
const STONE    = "#78726A";
const MUTED    = "#A09890";
const NAV_OFF  = "#9AB89D";

// Route definitions — labels are resolved from translations inside the component
const NAV_ROUTES = [
  { key: "home"     as const, href: "/dashboard/home",     icon: Home },
  { key: "expenses" as const, href: "/dashboard/expenses", icon: Receipt },
  { key: "ahorro"   as const, href: "/dashboard/ahorro",   icon: PiggyBank },
  { key: "global"   as const, href: "/dashboard/global",   icon: BarChart3 },
  { key: "config"   as const, href: "/dashboard/settings", icon: Settings },
];

function decodeUsername(token: string): string {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub ?? payload.username ?? "";
  } catch { return ""; }
}

// ── Inner layout — consumes LangProvider ─────────────────────────────────
function DashboardContent({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { t }   = useLang();
  const [username, setUsername] = useState("");
  // null = not yet determined (avoids a hydration mismatch); set once on mount.
  // Gates which layout branch mounts so page content and dialogs exist exactly once —
  // rendering both and hiding one with CSS let Radix dialog portals (which escape to
  // document.body) stay open-but-invisible across a breakpoint-crossing resize.
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);
  // Desktop topbar portal target — see lib/topbar-slot.tsx
  const [topBarSlot, setTopBarSlot] = useState<HTMLDivElement | null>(null);

  // Build translated nav items on each render
  const navItems = NAV_ROUTES.map(r => ({ ...r, label: t.nav[r.key] }));

  useEffect(() => {
    const token = localStorage.getItem("token") ?? sessionStorage.getItem("token");
    if (!token) { router.replace("/login"); return; }
    setUsername(decodeUsername(token));
  }, [router]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    router.replace("/login");
  }

  function isActive(href: string) {
    return pathname.startsWith(href);
  }

  // Breakpoint not yet known on first paint — render nothing rather than guess wrong.
  if (isDesktop === null) return null;

  if (!isDesktop) {
    return (
      <div className="flex flex-col" style={{ minHeight: "100dvh", background: SAGE }}>
        {/* White content card */}
        <div style={{ flex: 1, background: CARD, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Topbar */}
          <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: 52, borderBottom: "1px solid #EDE8DF", flexShrink: 0 }}>
            <h1 style={{ fontFamily: "var(--font-display), serif", fontStyle: "italic", fontWeight: 300, fontSize: "1.55rem", lineHeight: 1, letterSpacing: "-0.02em", fontVariationSettings: '"SOFT" 100, "WONK" 1', color: CHARCOAL }}>
              Millys
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {username && <span style={{ fontSize: 12, color: MUTED, fontWeight: 500 }}>{username}</span>}
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#EDE8DF", border: "1px solid #DDD7CC", display: "flex", alignItems: "center", justifyContent: "center", color: STONE, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                {username ? username[0].toUpperCase() : "·"}
              </div>
              <AddExpenseButton />
              <button onClick={handleLogout} style={{ background: "transparent", border: "none", color: STONE, cursor: "pointer", display: "flex", alignItems: "center", padding: 4, opacity: 0.7 }} aria-label="Cerrar sesión">
                <LogOut size={15} strokeWidth={1.6} />
              </button>
            </div>
          </header>

          {/* Page content */}
          <main style={{ flex: 1, overflow: "auto" }}>{children}</main>
        </div>

        {/* Bottom navigation */}
        <nav style={{ background: SAGE, display: "flex", height: 60, paddingBottom: "env(safe-area-inset-bottom, 0px)", flexShrink: 0 }}>
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link key={href} href={href} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, color: active ? "#FAF9F7" : NAV_OFF, textDecoration: "none", fontSize: 10, fontWeight: active ? 600 : 400 }}>
                <div style={{ height: 5, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {active && <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#FAF9F7" }} />}
                </div>
                <Icon size={18} strokeWidth={active ? 2.2 : 1.6} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-screen p-4" style={{ background: "#F2EBE1" }}>
        <div className="flex flex-1 overflow-hidden" style={{ background: SAGE, borderRadius: 28, border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 20px 60px rgba(42,39,32,0.14), 0 4px 14px rgba(42,39,32,0.06)" }}>
          {/* Sidebar */}
          <aside style={{ width: 182, flexShrink: 0, background: SAGE, display: "flex", flexDirection: "column", padding: "32px 0 24px", position: "relative", zIndex: 2 }}>
            {/* Brand */}
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <h1 style={{ fontFamily: "var(--font-display), serif", fontStyle: "italic", fontWeight: 300, fontSize: "2.25rem", lineHeight: 1, letterSpacing: "-0.02em", fontVariationSettings: '"SOFT" 100, "WONK" 1', color: "#EDE8DE" }}>
                Millys
              </h1>
            </div>

            {/* Nav */}
            <nav style={{ flex: 1, paddingLeft: 12 }}>
              {navItems.map(({ label, href, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <div key={href}>
                    {href === "/dashboard/settings" && (
                      <div style={{ height: 1, background: "rgba(255,255,255,0.1)", margin: "8px 20px 8px 0" }} />
                    )}
                    <div style={{ position: "relative", zIndex: active ? 1 : 0 }}>
                      {active && <div className="millys-bridge" />}
                      {active && <div className="millys-corner-top" />}
                      {active && <div className="millys-corner-bottom" />}
                      <Link
                        href={href}
                        style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 0 11px 20px", borderRadius: active ? "12px 0 0 12px" : 0, background: active ? CARD : "transparent", color: active ? CHARCOAL : NAV_OFF, fontSize: 13, fontWeight: active ? 600 : 400, textDecoration: "none", transition: "color 0.15s ease" }}
                        onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.color = "#D4E8D6"; }}
                        onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.color = NAV_OFF; }}
                      >
                        <Icon size={14} strokeWidth={active ? 2.2 : 1.6} />
                        {label}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </nav>

            {/* Logout */}
            <div style={{ padding: "0 20px" }}>
              <div style={{ height: 1, background: "rgba(255,255,255,0.1)", marginBottom: 14 }} />
              <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 0", background: "transparent", color: "#7A9A7C", fontSize: 12, cursor: "pointer", border: "none", outline: "none", transition: "color 0.15s ease" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#EDE8DE")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#7A9A7C")}
              >
                <LogOut size={13} strokeWidth={1.6} />
                Salir
              </button>
            </div>
          </aside>

          {/* Content area */}
          <div style={{ flex: 1, minWidth: 0, position: "relative", zIndex: 1 }}>
            <div style={{ position: "absolute", top: 16, left: 20, right: 12, bottom: 12, background: CARD, borderRadius: 20, boxShadow: "0 8px 40px rgba(42,39,32,0.12), 0 2px 8px rgba(42,39,32,0.05)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              {/* Top-right controls — no label, no border. The active page is already
                  shown by the sidebar tab, so repeating its name here was redundant.
                  The left side is a portal slot: pages with their own top-of-page
                  controls (e.g. Gastos' month strip) render into it instead of
                  stacking a second header row below — same space, reused. Fixed
                  height (not min-height) so the row is identical on every page —
                  a height that only grew for Gastos made the button/avatar jump
                  up and down when switching pages. */}
              <header style={{ display: "flex", alignItems: "center", padding: "0 24px", height: 84, flexShrink: 0, position: "relative" }}>
                {/* Slot spans the full header width and centers its content against the
                    header's true center — matching the centered hero/chart content below —
                    instead of centering within the leftover space next to the cluster, which
                    skewed it left. pointerEvents:none lets clicks fall through to the cluster;
                    portaled content (YearStrip, MonthStrip) re-enables it on its own root. */}
                <div ref={setTopBarSlot} style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginLeft: "auto", position: "relative" }}>
                  <AddExpenseButton />
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#EDE8DF", border: "1px solid #DDD7CC", display: "flex", alignItems: "center", justifyContent: "center", color: STONE, fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                    {username ? username[0].toUpperCase() : "·"}
                  </div>
                  {username && <span style={{ fontSize: 12, color: MUTED, fontWeight: 500 }}>{username}</span>}
                </div>
              </header>

              {/* Page content */}
              <TopBarSlotContext.Provider value={topBarSlot}>
                <main style={{ flex: 1, overflow: "auto" }}>{children}</main>
              </TopBarSlotContext.Provider>
            </div>
          </div>
        </div>
      </div>
  );
}
// ── Exported layout — provides language context ───────────────────────────
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <LangProvider>
      <CategoriesProvider>
        <ExpensesProvider>
          <IncomeProvider>
            <SavingsProvider>
              <InstallmentsProvider>
                <DashboardContent>{children}</DashboardContent>
              </InstallmentsProvider>
            </SavingsProvider>
          </IncomeProvider>
        </ExpensesProvider>
      </CategoriesProvider>
    </LangProvider>
  );
}
