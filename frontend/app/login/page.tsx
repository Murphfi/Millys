"use client";

import { useState, useEffect } from "react";
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

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

// ─── Cat room illustration ─────────────────────────────────────────────────
function RoomBackground() {
  return (
    <svg
      viewBox="0 0 370 500"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      aria-hidden
    >
      <defs>
        {/* Clip ramp texture lines to the triangle shape */}
        <clipPath id="rampClip">
          <polygon points="22,370 22,462 192,462" />
        </clipPath>
      </defs>

      {/* Wall */}
      <rect width="370" height="500" fill="#FAF7EF" />
      {/* Left wall corner strip */}
      <rect x="0" y="0" width="22" height="300" fill="#F0EBE0" />
      <line x1="22" y1="0" x2="22" y2="300" stroke="#DDD0B8" strokeWidth="1.5" />

      {/* Floor */}
      <rect y="300" width="370" height="200" fill="#EEDCBE" />
      {/* Baseboard */}
      <rect y="294" width="370" height="10" fill="#CFA870" />

      {/* ── FRAME 1 — Mona-Cat (top-left) ── */}
      <g transform="translate(22,28) rotate(-3.5,60,55)">
        <rect width="120" height="110" rx="3" fill="#C4904A" />
        <rect x="6" y="6" width="108" height="98" rx="2" fill="#B07A32" />
        <rect x="11" y="11" width="98" height="88" rx="1" fill="#D0C898" />
        {/* Landscape background */}
        <rect x="11" y="11" width="98" height="42" rx="1" fill="#B8B880" />
        {/* Cat body */}
        <ellipse cx="60" cy="92" rx="24" ry="14" fill="#8A7048" />
        {/* Head */}
        <ellipse cx="60" cy="75" rx="17" ry="17" fill="#8A7048" />
        {/* Ears */}
        <polygon points="47,65 43,52 54,63" fill="#8A7048" />
        <polygon points="73,65 77,52 66,63" fill="#8A7048" />
        <polygon points="49,64 45,54 53,62" fill="#C87878" opacity="0.5" />
        <polygon points="71,64 75,54 67,62" fill="#C87878" opacity="0.5" />
        {/* Eyes */}
        <circle cx="53" cy="74" r="2.8" fill="#1A1010" />
        <circle cx="67" cy="74" r="2.8" fill="#1A1010" />
        <circle cx="52" cy="73" r="1.1" fill="rgba(255,255,255,0.85)" />
        <circle cx="66" cy="73" r="1.1" fill="rgba(255,255,255,0.85)" />
        {/* Hands resting */}
        <ellipse cx="60" cy="97" rx="16" ry="9" fill="#7A6038" opacity="0.5" />
      </g>

      {/* ── FRAME 2 — Scream-Cat (center, lower) ── */}
      <g transform="translate(120,152) rotate(2.5,53,48)">
        <rect width="106" height="96" rx="3" fill="#C4904A" />
        <rect x="6" y="6" width="94" height="84" rx="2" fill="#B07A32" />
        {/* Sky layers */}
        <rect x="11" y="11" width="84" height="74" rx="1" fill="#E8B060" />
        <rect x="11" y="11" width="84" height="20" rx="1" fill="#E05830" />
        <rect x="11" y="31" width="84" height="14" fill="#D07030" />
        <rect x="11" y="45" width="84" height="13" fill="#5888A0" />
        <rect x="11" y="58" width="84" height="27" fill="#3A6888" />
        {/* Bridge */}
        <rect x="28" y="62" width="48" height="23" fill="#283060" rx="1" opacity="0.85" />
        {/* Cat (screaming) */}
        <ellipse cx="53" cy="73" rx="14" ry="19" fill="#283858" />
        <ellipse cx="53" cy="50" rx="13" ry="13" fill="#283858" />
        <polygon points="44,42 40,30 51,41" fill="#283858" />
        <polygon points="62,42 66,30 55,41" fill="#283858" />
        {/* Open mouth */}
        <ellipse cx="53" cy="63" rx="5.5" ry="7" fill="#0A1828" />
        {/* Hands on cheeks */}
        <ellipse cx="37" cy="53" rx="7" ry="4.5" fill="#283858" transform="rotate(-20,37,53)" />
        <ellipse cx="69" cy="53" rx="7" ry="4.5" fill="#283858" transform="rotate(20,69,53)" />
        {/* Wide eyes */}
        <ellipse cx="47" cy="48" rx="3.5" ry="4.5" fill="#F0F0E0" />
        <ellipse cx="59" cy="48" rx="3.5" ry="4.5" fill="#F0F0E0" />
        <circle cx="47" cy="49" r="2.2" fill="#0A1828" />
        <circle cx="59" cy="49" r="2.2" fill="#0A1828" />
      </g>

      {/* ── FRAME 3 — Pearl Earring Cat (top-right) ── */}
      <g transform="translate(234,24) rotate(-2,57,53)">
        <rect width="114" height="106" rx="3" fill="#C4904A" />
        <rect x="6" y="6" width="102" height="94" rx="2" fill="#B07A32" />
        {/* Dark background */}
        <rect x="11" y="11" width="92" height="84" rx="1" fill="#2A1E08" />
        <rect x="11" y="11" width="92" height="50" rx="1" fill="#1A1208" />
        {/* Cat body (orange tabby) */}
        <ellipse cx="57" cy="90" rx="26" ry="15" fill="#C07840" />
        {/* Head */}
        <ellipse cx="57" cy="72" rx="19" ry="19" fill="#C07840" />
        {/* Blue headscarf */}
        <path d="M 39,63 Q 57,50 75,63 Q 75,54 57,48 Q 39,54 39,63 Z" fill="#4878B8" />
        <path d="M 74,63 Q 86,71 84,88 Q 72,80 74,63 Z" fill="#3868A8" />
        {/* Ear peeking */}
        <polygon points="42,65 38,53 50,63" fill="#C07840" />
        {/* Pearl earring */}
        <circle cx="43" cy="88" r="5" fill="#F0ECC8" />
        <circle cx="43" cy="88" r="3.2" fill="#E8D888" />
        {/* Eye (3/4 profile) */}
        <circle cx="66" cy="73" r="4" fill="#1A1010" />
        <circle cx="65" cy="72" r="1.5" fill="rgba(255,255,255,0.85)" />
        {/* Tabby stripes */}
        <line x1="50" y1="77" x2="56" y2="86" stroke="#9A5820" strokeWidth="1.5" opacity="0.5" />
        <line x1="56" y1="75" x2="62" y2="84" stroke="#9A5820" strokeWidth="1.5" opacity="0.5" />
      </g>

      {/* ── RAMP — high end at left wall, slope down to right ── */}
      <g clipPath="url(#rampClip)">
        <polygon points="22,370 22,462 192,462" fill="#C49050" />
        {/* Vertical wood-plank texture lines, clipped to triangle */}
        {[48, 76, 104, 132, 160].map((x, i) => (
          <line key={i} x1={x} y1={358} x2={x} y2={462}
            stroke="#9A6828" strokeWidth="1.8" opacity="0.45" />
        ))}
      </g>
      {/* Slope edge */}
      <line x1="22" y1="370" x2="192" y2="462" stroke="#A07030" strokeWidth="2.5" />
      {/* Left vertical edge */}
      <line x1="22" y1="370" x2="22" y2="462" stroke="#905820" strokeWidth="2" />
      {/* Green base */}
      <rect x="22" y="458" width="172" height="14" rx="4" fill="#78AA50" />

      {/* ── SPEED LINES ── */}
      <line x1="208" y1="382" x2="234" y2="392"
        stroke="#C8A050" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
      <line x1="205" y1="398" x2="233" y2="407"
        stroke="#C8A050" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
      <line x1="202" y1="414" x2="228" y2="422"
        stroke="#C8A050" strokeWidth="2" strokeLinecap="round" opacity="0.4" />

      {/* ── FOOD BOWL (center floor) ── */}
      <ellipse cx="222" cy="462" rx="42" ry="14" fill="#D4BC50" />
      <ellipse cx="222" cy="459" rx="38" ry="12" fill="#DEC860" />
      <ellipse cx="222" cy="456" rx="30" ry="9" fill="#8A9898" />
      <ellipse cx="214" cy="454" rx="12" ry="4" fill="rgba(255,255,255,0.2)" />

      {/* ── CAT TREE (right) — base at bottom, post up, platform on top ── */}
      {/* Base platform */}
      <rect x="262" y="456" width="88" height="12" rx="5" fill="#78AA50" />
      {/* Post */}
      <rect x="293" y="360" width="22" height="100" rx="5" fill="#C49050" />
      {/* Wood rings on post */}
      {[376, 392, 408, 424, 440].map((y, i) => (
        <line key={i} x1="293" y1={y} x2="315" y2={y}
          stroke="#9A6828" strokeWidth="1.5" opacity="0.55" />
      ))}
      {/* Top platform */}
      <rect x="265" y="348" width="80" height="14" rx="5" fill="#78AA50" />
      {/* Hanging toy — string from left edge of top platform */}
      <line x1="272" y1="362" x2="272" y2="390" stroke="#9A6828" strokeWidth="2" />
      <circle cx="272" cy="400" r="10" fill="#D4A840" />
      <circle cx="272" cy="400" r="7.5" fill="#E0B850" />
      <circle cx="269" cy="397" r="3" fill="rgba(255,255,255,0.22)" />
    </svg>
  );
}

// ──────────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const [users, setUsers] = useState<string[]>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_URL}/api/users`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data: string[]) => setUsers(data))
      .catch((err) => { if (err.name !== "AbortError") setUsers([]); });
    return () => controller.abort();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        const data = await res.json();
        const token: string | undefined = data?.token;
        if (!token) { setError("Error inesperado del servidor"); return; }
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem("token", token);
        router.push("/dashboard");
      } else {
        setError("Usuario o contraseña incorrectos");
      }
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }

  // ── Shared form content (used in both mobile and desktop) ─────────────
  const formContent = (
    <>
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
          Millys<span style={{ color: "#A78BFA" }}>.</span>
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
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
              {users.map((u) => (
                <SelectItem key={u} value={u}>{u}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
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

        <div className="flex items-center">
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

        <button
          type="submit"
          disabled={loading || !username || !password}
          className="millys-btn mt-1 h-11 w-full rounded-full text-sm font-semibold tracking-wide text-white active:scale-[0.98] disabled:opacity-40 cursor-pointer"
          style={{
            background: "#2A2720",
            boxShadow: "0 4px 14px rgba(42,39,32,0.14)",
          }}
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </>
  );

  return (
    <div
      className="flex flex-1 min-h-screen items-center justify-center p-4 sm:p-6"
      style={{ background: "#F2EBE1" }}
    >
      {/* ── Mobile card — illustration as full background ── */}
      <div
        className="md:hidden relative w-full overflow-hidden"
        style={{
          borderRadius: 28,
          minHeight: 520,
          border: "1px solid rgba(0,0,0,0.05)",
          boxShadow: "0 20px 60px rgba(42,39,32,0.10), 0 4px 14px rgba(42,39,32,0.05)",
        }}
      >
        {/* Background illustration — swap <RoomBackground /> for <img> when the real artwork arrives */}
        <div className="absolute inset-0">
          <RoomBackground />
        </div>

        {/* Frosted glass form panel */}
        <div className="relative flex items-center justify-center px-3 py-8" style={{ minHeight: 520 }}>
          <div
            style={{
              width: "100%",
              background: "rgba(250,249,247,0.68)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              borderRadius: 20,
              padding: "36px 24px",
              boxShadow: "0 4px 24px rgba(42,39,32,0.08), 0 1px 4px rgba(42,39,32,0.04)",
            }}
          >
            {formContent}
          </div>
        </div>
      </div>

      {/* ── Desktop card — two-panel ── */}
      <div
        className="hidden md:flex w-full overflow-hidden"
        style={{
          maxWidth: 860,
          minHeight: 420,
          borderRadius: 28,
          border: "1px solid rgba(0,0,0,0.05)",
          boxShadow: "0 20px 60px rgba(42,39,32,0.10), 0 4px 14px rgba(42,39,32,0.05)",
        }}
      >
        {/* Left panel — illustration */}
        <div className="relative overflow-hidden" style={{ width: "42%", flexShrink: 0 }}>
          <RoomBackground />
        </div>

        {/* Right panel — form */}
        <div
          className="flex flex-col justify-center flex-1 min-w-0 millys-login-panel"
          style={{ background: "#FAF9F7" }}
        >
          {formContent}
        </div>
      </div>
    </div>
  );
}
