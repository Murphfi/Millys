"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";

// Placeholder del espacio reservado para la mascota de Millys (aun sin diseñar).
function MascotPlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-2xl bg-linear-to-br from-indigo-300 via-violet-300 to-amber-200",
        className
      )}
    >
      <span className="text-sm font-medium text-white/80">Millys (próximamente)</span>
    </div>
  );
}

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
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`)
      .then((res) => res.json())
      .then((data: string[]) => setUsers(data))
      .catch(() => setUsers([]));
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        const { token } = await res.json();
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem("token", token);
        router.push("/");
      } else {
        setError("Usuario o contraseña incorrectos");
      }
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-neutral-200 p-4 dark:bg-black sm:p-6">
      <div className="grid w-full max-w-4xl grid-cols-1 overflow-hidden rounded-3xl bg-white shadow-sm dark:bg-zinc-900 md:grid-cols-2">
        <MascotPlaceholder className="m-4 h-40 md:hidden" />
        <MascotPlaceholder className="hidden md:m-4 md:flex" />

        <div className="flex flex-col gap-6 px-6 py-8 sm:px-10 sm:py-10">
          <div className="flex items-center justify-center gap-2 text-lg font-semibold">
            <Sparkles className="size-5" />
            Millys
          </div>

          <form onSubmit={handleSubmit} className="flex flex-1 flex-col justify-center gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="username">Usuario</Label>
              <Select value={username || null} onValueChange={(value) => setUsername(value ?? "")}>
                <SelectTrigger
                  id="username"
                  className="w-full justify-between rounded-none border-x-0 border-t-0 border-b border-input bg-transparent px-0 pb-2 focus-visible:ring-0 data-[state=open]:border-b-foreground"
                >
                  <SelectValue placeholder="Selecciona usuario" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user} value={user}>
                      {user}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative flex items-center">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-auto rounded-none border-x-0 border-t-0 border-b border-input bg-transparent px-0 pb-2 pr-7 focus-visible:ring-0 focus-visible:border-b-foreground"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-0 text-muted-foreground"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-muted-foreground">
                <Checkbox
                  id="remember-me"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                />
                Recuérdame
              </label>
              <span className="text-muted-foreground">¿Olvidaste tu contraseña?</span>
            </div>

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <Button
              type="submit"
              disabled={loading}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                e.currentTarget.style.setProperty(
                  "--x",
                  `${((e.clientX - rect.left) / rect.width) * 100}%`
                );
                e.currentTarget.style.setProperty(
                  "--y",
                  `${((e.clientY - rect.top) / rect.height) * 100}%`
                );
              }}
              className="glass-button h-11 w-full rounded-full border-white/60 bg-white/25 bg-[radial-gradient(circle_at_center,rgba(167,139,250,0.55),rgba(252,211,77,0.3)_65%,transparent_85%)] bg-blend-overlay text-base text-zinc-900 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),inset_0_-8px_14px_-8px_rgba(129,140,248,0.35),0_10px_25px_-10px_rgba(99,102,241,0.45)] backdrop-blur-md transition-transform duration-300 ease-in-out hover:scale-[1.04] hover:bg-white/25 active:scale-95 dark:text-white"
            >
              <span className="relative z-10">{loading ? "Entrando..." : "Entrar"}</span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
