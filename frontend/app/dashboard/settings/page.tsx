"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2, Plus, Check, X } from "lucide-react";
import { useCategories, COLOR_PALETTE, type Category } from "../lib/categories";
import { useLang, getCategoryLabel, type Lang } from "../lib/i18n";

const STONE    = "#78726A";
const MUTED    = "#A09890";
const CHARCOAL = "#2A2720";
const BORDER   = "#EDE8DF";
const BACKEND  = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

type SettingsT = {
  categoryNamePlaceholder: string;
  color: string;
  save: string;
  cancel: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "").padEnd(6, "0");
  return [
    parseInt(clean.slice(0, 2), 16) || 0,
    parseInt(clean.slice(2, 4), 16) || 0,
    parseInt(clean.slice(4, 6), 16) || 0,
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b]
    .map(v => Math.min(255, Math.max(0, v)).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

// ── Inline color controls (no popup) ─────────────────────────────────────
function ColorControls({ value, onChange }: {
  value: string;
  onChange: (color: string) => void;
}) {
  const [hexInput, setHexInput] = useState(value.replace("#", "").toUpperCase());

  const [r, g, b] = hexToRgb(value);

  function setRgb(channel: 0 | 1 | 2, val: number) {
    const rgb: [number, number, number] = hexToRgb(value);
    rgb[channel] = val;
    const newHex = rgbToHex(...rgb);
    onChange(newHex);
    setHexInput(newHex.replace("#", ""));
  }

  function handleHexInput(raw: string) {
    const clean = raw.replace(/[^0-9A-Fa-f]/g, "").slice(0, 6);
    setHexInput(clean.toUpperCase());
    if (clean.length === 6) onChange("#" + clean.toUpperCase());
  }

  function applyPreset(c: string) {
    onChange(c);
    setHexInput(c.replace("#", "").toUpperCase());
  }

  const channels: Array<{ ch: 0 | 1 | 2; label: string; val: number; track: string }> = [
    { ch: 0, label: "R", val: r, track: `linear-gradient(to right, rgb(0,${g},${b}), rgb(255,${g},${b}))` },
    { ch: 1, label: "G", val: g, track: `linear-gradient(to right, rgb(${r},0,${b}), rgb(${r},255,${b}))` },
    { ch: 2, label: "B", val: b, track: `linear-gradient(to right, rgb(${r},${g},0), rgb(${r},${g},255))` },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Color preview */}
      <div style={{
        height: 44, borderRadius: 10, background: value,
        border: "1px solid rgba(0,0,0,0.06)", transition: "background 0.1s ease",
      }} />

      {/* RGB sliders */}
      {channels.map(({ ch, label, val, track }) => (
        <div key={ch} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 10, fontSize: "0.7rem", fontWeight: 700, color: MUTED, flexShrink: 0 }}>
            {label}
          </span>
          <input
            type="range" min={0} max={255} value={val}
            onChange={(e) => setRgb(ch, Number(e.target.value))}
            className="millys-rgb-slider"
            style={{ background: track }}
          />
          <input
            type="number" min={0} max={255} value={val}
            onChange={(e) => setRgb(ch, Math.min(255, Math.max(0, Number(e.target.value))))}
            style={{
              width: 38, border: "none", borderBottom: "1px solid #DDD7CC",
              background: "transparent", color: CHARCOAL, fontSize: "0.75rem",
              fontFamily: "monospace", outline: "none", textAlign: "center", padding: "0 0 2px",
            }}
          />
        </div>
      ))}

      {/* Hex input */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, borderBottom: "1px solid #DDD7CC", paddingBottom: 6 }}>
        <span style={{ color: MUTED, fontSize: "0.875rem", fontFamily: "monospace" }}>#</span>
        <input
          value={hexInput}
          onChange={(e) => handleHexInput(e.target.value)}
          maxLength={6}
          placeholder="5E7C64"
          style={{
            border: "none", background: "transparent", color: CHARCOAL,
            fontSize: "0.875rem", fontFamily: "monospace", letterSpacing: "0.05em",
            outline: "none", flex: 1,
          }}
        />
      </div>

      {/* Preset swatches */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {COLOR_PALETTE.map((c) => (
          <button key={c} type="button"
            onClick={() => applyPreset(c)}
            style={{
              width: 22, height: 22, borderRadius: "50%", background: c, padding: 0,
              border: value.toUpperCase() === c.toUpperCase() ? `2px solid ${CHARCOAL}` : "2px solid transparent",
              cursor: "pointer",
              boxShadow: value.toUpperCase() === c.toUpperCase() ? "0 0 0 1.5px white inset" : "none",
              transition: "transform 0.1s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.2)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          />
        ))}
      </div>
    </div>
  );
}

// ── Inline editor ─────────────────────────────────────────────────────────
function EditRow({
  cat, onSave, onCancel, ts,
}: {
  cat: Partial<Category>;
  onSave: (label: string, color: string) => void;
  onCancel: () => void;
  ts: SettingsT;
}) {
  const [label, setLabel] = useState(cat.label ?? "");
  const [color, setColor] = useState(cat.color ?? COLOR_PALETTE[0]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "16px 20px", background: "#F7F5F2", border: `1px solid ${BORDER}`, borderRadius: 12 }}>
      {/* Name input */}
      <input
        autoFocus
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder={ts.categoryNamePlaceholder}
        style={{ border: "none", borderBottom: "1.5px solid #A78BFA", background: "transparent", color: CHARCOAL, fontSize: "0.875rem", outline: "none", padding: "0 0 6px", width: "100%" }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && label.trim()) onSave(label.trim(), color);
          if (e.key === "Escape") onCancel();
        }}
      />

      {/* Color controls */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: MUTED, textTransform: "uppercase" }}>
          {ts.color}
        </span>
        <ColorControls value={color} onChange={setColor} />
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" onClick={() => { if (label.trim()) onSave(label.trim(), color); }} disabled={!label.trim()}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 16px", borderRadius: 999, border: "none", background: CHARCOAL, color: "#FAF9F7", fontSize: "0.8rem", fontWeight: 600, cursor: label.trim() ? "pointer" : "not-allowed", opacity: label.trim() ? 1 : 0.4 }}
        >
          <Check size={12} strokeWidth={2.5} />
          {ts.save}
        </button>
        <button type="button" onClick={onCancel}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 16px", borderRadius: 999, border: "1px solid #DDD7CC", background: "transparent", color: STONE, fontSize: "0.8rem", fontWeight: 500, cursor: "pointer" }}
        >
          <X size={12} strokeWidth={2} />
          {ts.cancel}
        </button>
      </div>
    </div>
  );
}

// ── API response shape ────────────────────────────────────────────────────
type ApiCategory = {
  id: number;
  code: string;
  label: string;
  color: string;
  default: boolean;
};

function apiToCategory(c: ApiCategory): Category {
  return { id: c.code, label: c.label, color: c.color, dbId: c.id };
}

// ── Main settings page ────────────────────────────────────────────────────
const LANG_OPTIONS: { code: Lang; label: string }[] = [
  { code: "es", label: "Español" },
  { code: "en", label: "English" },
  { code: "ca", label: "Català"  },
];

export default function SettingsPage() {
  const [categories, setCategories] = useCategories();
  const { lang, setLang, t }        = useLang();
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [adding, setAdding]         = useState(false);

  useEffect(() => {
    fetch(`${BACKEND}/api/categories`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: ApiCategory[]) => setCategories(data.map(apiToCategory)))
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSaveEdit(id: string, label: string, color: string) {
    const cat = categories.find(c => c.id === id);
    if (cat?.dbId) {
      await fetch(`${BACKEND}/api/categories/${cat.dbId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: id, label, color }),
      }).catch(() => {});
    }
    setCategories(prev => prev.map(c => c.id === id ? { ...c, label, color } : c));
    setEditingId(null);
  }

  async function handleAdd(label: string, color: string) {
    const code = label.toLowerCase().replace(/\s+/g, "_") + "_" + Date.now();
    let dbId: number | undefined;
    try {
      const res = await fetch(`${BACKEND}/api/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, label, color }),
      });
      if (res.ok) {
        const created: ApiCategory = await res.json();
        dbId = created.id;
      }
    } catch {}
    setCategories(prev => [...prev, { id: code, label, color, dbId }]);
    setAdding(false);
  }

  async function handleDelete(id: string) {
    const cat = categories.find(c => c.id === id);
    if (cat?.dbId) {
      await fetch(`${BACKEND}/api/categories/${cat.dbId}`, {
        method: "DELETE",
      }).catch(() => {});
    }
    setCategories(prev => prev.filter(c => c.id !== id));
  }

  const categoryCount = `${categories.length} ${categories.length === 1 ? t.settings.categoryLabel : t.settings.categoryLabelPlural}`;

  return (
    <div className="px-4 py-6 md:px-7 md:py-7">

      {/* ── Categorías ── */}
      <section style={{ marginBottom: 36 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: MUTED }}>
              {t.settings.categoriesTitle}
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: MUTED }}>{categoryCount}</p>
          </div>
          {!adding && (
            <button
              onClick={() => { setAdding(true); setEditingId(null); }}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 999, border: "1px solid #DDD7CC", background: "transparent", color: CHARCOAL, fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", transition: "background 0.15s ease" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#F0EDE8")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <Plus size={13} strokeWidth={2.5} />
              {t.settings.newCategory}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {categories.map((cat) => (
            <div key={cat.id} className={editingId === cat.id ? "md:col-span-3" : ""}>
              {editingId === cat.id ? (
                <EditRow
                  cat={cat}
                  onSave={(label, color) => handleSaveEdit(cat.id, label, color)}
                  onCancel={() => setEditingId(null)}
                  ts={t.settings}
                />
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 16px", border: `1px solid ${BORDER}`, borderRadius: 12, background: "#FAF9F7" }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: cat.color, flexShrink: 0, display: "inline-block" }} />
                  <span style={{ flex: 1, fontSize: "0.875rem", color: CHARCOAL, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {getCategoryLabel(cat, t)}
                  </span>
                  <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                    <button onClick={() => { setEditingId(cat.id); setAdding(false); }}
                      style={{ background: "transparent", border: "none", cursor: "pointer", padding: 6, borderRadius: 8, color: MUTED, display: "flex", alignItems: "center", transition: "color 0.15s ease, background 0.15s ease" }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = CHARCOAL; e.currentTarget.style.background = "#EDE8DF"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = MUTED;    e.currentTarget.style.background = "transparent"; }}
                      aria-label={`Edit ${cat.label}`}
                    >
                      <Pencil size={13} strokeWidth={1.8} />
                    </button>
                    <button onClick={() => handleDelete(cat.id)}
                      style={{ background: "transparent", border: "none", cursor: "pointer", padding: 6, borderRadius: 8, color: MUTED, display: "flex", alignItems: "center", transition: "color 0.15s ease, background 0.15s ease" }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#EF4444"; e.currentTarget.style.background = "#FEF2F2"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = MUTED;     e.currentTarget.style.background = "transparent"; }}
                      aria-label={`Delete ${cat.label}`}
                    >
                      <Trash2 size={13} strokeWidth={1.8} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {adding && (
            <div className="md:col-span-3">
              <EditRow cat={{}} onSave={handleAdd} onCancel={() => setAdding(false)} ts={t.settings} />
            </div>
          )}
        </div>
      </section>

      {/* ── Idioma / Language ── */}
      <section>
        <div style={{ height: 1, background: BORDER, marginBottom: 24 }} />
        <h2 style={{ margin: "0 0 14px", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: MUTED }}>
          {t.settings.languageTitle}
        </h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {LANG_OPTIONS.map(({ code, label }) => {
            const active = lang === code;
            return (
              <button
                key={code}
                onClick={() => setLang(code)}
                style={{
                  padding: "8px 20px",
                  borderRadius: 999,
                  border: active ? "none" : "1px solid #DDD7CC",
                  background: active ? CHARCOAL : "transparent",
                  color: active ? "#FAF9F7" : STONE,
                  fontSize: "0.875rem",
                  fontWeight: active ? 600 : 400,
                  cursor: "pointer",
                  transition: "background 0.15s ease, color 0.15s ease",
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "#F0EDE8"; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
