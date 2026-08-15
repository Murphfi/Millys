"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEFAULT_CATEGORIES } from "../lib/categories";

// TODO: replace with useFetch("/api/categories")
const CATEGORIES = DEFAULT_CATEGORIES;

export default function AddExpensePage() {
  const router = useRouter();
  const [amount, setAmount]           = useState("");
  const [category, setCategory]       = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate]               = useState(new Date().toISOString().slice(0, 10));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: POST /api/expenses
    router.push("/dashboard/home");
  }

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        padding: "32px 28px",
        maxWidth: 480,
      }}
    >
      {/* Amount — big and central */}
      <div style={{ textAlign: "center", padding: "16px 0 32px" }}>
        <div style={{ display: "inline-flex", alignItems: "baseline", gap: 6 }}>
          <span
            style={{
              fontFamily: "var(--font-display), serif",
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: "2rem",
              color: "#A09890",
            }}
          >
            €
          </span>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            autoFocus
            style={{
              fontFamily: "var(--font-display), serif",
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: "4rem",
              lineHeight: 1,
              letterSpacing: "-0.03em",
              color: "#2A2720",
              border: "none",
              borderBottom: "2px solid #DDD7CC",
              background: "transparent",
              outline: "none",
              width: "6ch",
              textAlign: "center",
              padding: "0 0 8px",
            }}
          />
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 24, flex: 1 }}
      >
        {/* Category */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Label
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: "#9CA3AF" }}
          >
            Categoría
          </Label>
          <Select value={category} onValueChange={(v) => setCategory(v ?? "")} required>
            <SelectTrigger
              className="w-full justify-between rounded-none border-x-0 border-t-0 border-b bg-transparent px-0 pb-2 focus-visible:ring-0 millys-input"
              style={{ color: "#1C1B29" }}
            >
              <SelectValue placeholder="Selecciona categoría" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
                    {c.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Label
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: "#9CA3AF" }}
          >
            Descripción
          </Label>
          <Input
            placeholder="Ej. Mercadona, gasolina..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="h-auto rounded-none border-x-0 border-t-0 border-b bg-transparent px-0 pb-2 focus-visible:ring-0 millys-input"
            style={{ color: "#1C1B29" }}
          />
        </div>

        {/* Date */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Label
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: "#9CA3AF" }}
          >
            Fecha
          </Label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="millys-input"
            style={{
              border: "none",
              borderBottom: "1px solid #DDD7CC",
              background: "transparent",
              padding: "0 0 8px",
              color: "#1C1B29",
              fontSize: "0.875rem",
              outline: "none",
              width: "100%",
            }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, marginTop: "auto", paddingTop: 16 }}>
          <button
            type="button"
            onClick={() => router.back()}
            style={{
              flex: 1,
              height: 44,
              borderRadius: 999,
              border: "1px solid #DDD7CC",
              background: "transparent",
              color: "#78726A",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!amount || !category}
            className="millys-btn"
            style={{
              flex: 2,
              height: 44,
              borderRadius: 999,
              border: "none",
              background: "#2A2720",
              color: "#FAF9F7",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
              letterSpacing: "0.02em",
              opacity: !amount || !category ? 0.4 : 1,
            }}
          >
            Añadir gasto
          </button>
        </div>
      </form>
    </div>
  );
}
