"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoginTransitionOverlay, type RevealOrigin } from "./transition-overlay";

// The overlay is a deliberate few-second beat bridging login → dashboard, not
// a flash — this is how long it plays even when the backend answers instantly.
// A cold Render instance just extends past it (the message below swaps right
// as this would otherwise end, so the two never fight over the same moment).
const OVERLAY_MIN_SHOW_MS = 2200;
// Kept clearly past OVERLAY_MIN_SHOW_MS (not equal to it) so a response
// landing near the min-show mark can't flip to "cold start" and then
// immediately flip again to "done" within the same frame.
const COLD_START_THRESHOLD_MS = OVERLAY_MIN_SHOW_MS + 400;
// Brief "done" beat (checkmark replaces the dots) before the actual navigation.
const OVERLAY_DONE_BEAT_MS = 380;

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

// Fixed 3-user roster (Murphfi, Lilly, Test) — hardcoded on purpose, not fetched
// pre-auth from the backend (that endpoint used to be public just for this dropdown,
// which made username enumeration trivial for anyone). No user creation flow exists,
// so this only needs updating if a 4th account is ever added by hand.
const KNOWN_USERS = ["Murphfi", "Lilly", "Test"] as const;

export default function LoginPage() {
  const router = useRouter();
  const submitBtnRef = useRef<HTMLButtonElement>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [overlayPhase, setOverlayPhase] = useState<"hidden" | "in" | "out">("hidden");
  const [coldStart, setColdStart] = useState(false);
  const [overlayDone, setOverlayDone] = useState(false);
  const [revealOrigin, setRevealOrigin] = useState<RevealOrigin | null>(null);

  function dismissOverlay() {
    setOverlayPhase("out");
    setTimeout(() => setOverlayPhase("hidden"), 280);
  }

  // Same deliberate few-second beat as the success path — without this, a
  // fast 401/network error dismisses the overlay almost instantly, which
  // reads as a jarring flash next to the success path's much longer show time.
  async function waitForMinShow(start: number) {
    const remaining = OVERLAY_MIN_SHOW_MS - (Date.now() - start);
    if (remaining > 0) await new Promise((r) => setTimeout(r, remaining));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    setColdStart(false);
    setOverlayDone(false);

    const rect = submitBtnRef.current?.getBoundingClientRect();
    if (rect) {
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      // Distance to the farthest viewport corner — the radius needed for the
      // circle to fully cover the screen once it finishes expanding. +15%
      // headroom because the viewport can grow mid-animation (e.g. the
      // mobile keyboard dismissing on submit), and fill-mode locks in
      // whatever radius we compute here for the whole 0.55s reveal.
      const radius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      ) * 1.15;
      setRevealOrigin({ x, y, radius });
    } else {
      setRevealOrigin(null);
    }

    setOverlayPhase("in");
    const start = Date.now();
    const coldTimer = setTimeout(() => setColdStart(true), COLD_START_THRESHOLD_MS);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      clearTimeout(coldTimer);
      if (res.ok) {
        const data = await res.json();
        const token: string | undefined = data?.token;
        if (!token) { setError("Error inesperado del servidor"); await waitForMinShow(start); dismissOverlay(); return; }
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem("token", token);
        await waitForMinShow(start);
        setOverlayDone(true);
        await new Promise((r) => setTimeout(r, OVERLAY_DONE_BEAT_MS));
        router.push("/dashboard");
        return; // keep the overlay mounted through the navigation instead of dismissing it
      } else {
        setError("Usuario o contraseña incorrectos");
        await waitForMinShow(start);
        dismissOverlay();
      }
    } catch {
      clearTimeout(coldTimer);
      setError("No se pudo conectar con el servidor");
      await waitForMinShow(start);
      dismissOverlay();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex flex-1 min-h-screen items-center justify-center p-4 sm:p-6"
      style={{ background: "#F2EBE1" }}
    >
      <div
        aria-hidden
        className="millys-ledger-lines"
        style={{ position: "fixed", inset: 0, pointerEvents: "none", ["--ledger-color" as string]: "rgba(42,39,32,0.035)" }}
      />
      {/* Desktop-only ambient backdrop — mobile stays flat and fast, desktop
          gets a bit more atmosphere since there's room for it (same idea as
          the sidebar/floating-nav split between breakpoints elsewhere). */}
      <div
        aria-hidden
        className="hidden md:block"
        style={{
          position: "fixed", top: "-12%", left: "-8%", width: 420, height: 420,
          borderRadius: "50%", background: "#5E7C64", opacity: 0.14,
          filter: "blur(90px)", pointerEvents: "none", willChange: "transform",
        }}
      />
      <div
        aria-hidden
        className="hidden md:block"
        style={{
          position: "fixed", bottom: "-16%", right: "-10%", width: 480, height: 480,
          borderRadius: "50%", background: "#A09890", opacity: 0.12,
          filter: "blur(100px)", pointerEvents: "none", willChange: "transform",
        }}
      />

      <div className="relative w-full" style={{ maxWidth: 400 }}>
        {/* Sage tab peeking from behind the card — a quiet nod to the
            dashboard's connected-tab nav, so the brand shows up before
            you're even logged in. */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: -18,
            left: "50%",
            transform: "translateX(-50%)",
            width: 56,
            height: 40,
            borderRadius: 16,
            background: "#5E7C64",
            animation: "millys-month-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
          }}
        />

        <div
          className="millys-login-panel relative"
          style={{
            borderRadius: 28,
            background: "#FAF9F7",
            border: "1px solid rgba(0,0,0,0.05)",
            boxShadow: "0 20px 60px rgba(42,39,32,0.10), 0 4px 14px rgba(42,39,32,0.05)",
            animation: "millys-mark-in 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.1s both",
          }}
        >
          {/* Brand */}
          <div style={{ marginBottom: 32, textAlign: "center" }}>
            <h1
              style={{
                fontFamily: "var(--font-display), serif",
                fontStyle: "italic",
                fontWeight: 300,
                fontSize: "3rem",
                lineHeight: 1,
                letterSpacing: "-0.02em",
                fontVariationSettings: '"SOFT" 100, "WONK" 1',
                color: "#1C1B29",
              }}
            >
              Millys<span style={{ color: "#5E7C64" }}>.</span>
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div
              className="flex flex-col gap-1.5"
              style={{ animation: "millys-stagger-in 0.3s cubic-bezier(0.23,1,0.32,1) 0.25s both" }}
            >
              <Label
                htmlFor="username"
                className="text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: "#9CA3AF" }}
              >
                Usuario
              </Label>
              <Select value={username} onValueChange={(v) => setUsername(v ?? "")}>
                <SelectTrigger
                  id="username"
                  className="w-full justify-between rounded-none border-x-0 border-t-0 border-b bg-transparent px-0 pb-2 focus-visible:ring-0 millys-input"
                  style={{ color: "#1C1B29" }}
                >
                  <SelectValue placeholder="Selecciona usuario" />
                </SelectTrigger>
                <SelectContent>
                  {KNOWN_USERS.map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div
              className="flex flex-col gap-1.5"
              style={{ animation: "millys-stagger-in 0.3s cubic-bezier(0.23,1,0.32,1) 0.3s both" }}
            >
              <Label
                htmlFor="password"
                className="text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: "#9CA3AF" }}
              >
                Contraseña
              </Label>
              <div className="relative flex items-center">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-auto rounded-none border-x-0 border-t-0 border-b bg-transparent px-0 pb-2 pr-7 focus-visible:ring-0 millys-input"
                  style={{ color: "#1C1B29" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-0 transition-opacity hover:opacity-60 cursor-pointer"
                  style={{ color: "#D1D5DB" }}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div
              className="flex items-center"
              style={{ animation: "millys-stagger-in 0.3s cubic-bezier(0.23,1,0.32,1) 0.35s both" }}
            >
              <label
                className="flex cursor-pointer items-center gap-2 text-sm"
                style={{ color: "#6B7280" }}
              >
                <Checkbox
                  id="remember-me"
                  checked={rememberMe}
                  onCheckedChange={(c) => setRememberMe(c === true)}
                />
                Recuérdame
              </label>
            </div>

            {error && (
              <p className="text-sm" style={{ color: "#EF4444" }}>{error}</p>
            )}

            {/* Animate the wrapper, not the button itself — the entrance
                keyframe's opacity:1 end-state would otherwise sit on top of
                (and permanently defeat) the button's own disabled:opacity-40. */}
            <div style={{ animation: "millys-stagger-in 0.3s cubic-bezier(0.23,1,0.32,1) 0.4s both" }}>
              <button
                ref={submitBtnRef}
                type="submit"
                disabled={loading || !username || !password}
                className="millys-btn mt-1 h-11 w-full rounded-full text-sm font-semibold tracking-wide text-white active:scale-[0.98] disabled:opacity-40 cursor-pointer"
                style={{
                  background: "#5E7C64",
                  boxShadow: "0 4px 14px rgba(42,39,32,0.14)",
                }}
              >
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {overlayPhase !== "hidden" && (
        <LoginTransitionOverlay
          phase={overlayPhase}
          coldStart={coldStart}
          done={overlayDone}
          origin={overlayPhase === "in" ? revealOrigin : null}
        />
      )}
    </div>
  );
}
