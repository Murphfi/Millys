"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2, Plus, Check, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { useCategories, COLOR_PALETTE, type Category } from "../lib/categories";
import { useInstallments, type InstallmentPlan } from "../lib/installments";
import { useLang, getCategoryLabel, type Lang } from "../lib/i18n";
import { getUserColor, todayDate, toDateKey } from "../lib/stats";
import { apiFetch, getCurrentUsername } from "../lib/api";
import { DatePicker } from "../date-picker";
import { SyncErrorBanner } from "../sync-error-banner";

const STONE    = "#78726A";
const MUTED    = "#A09890";
const CHARCOAL = "#2A2720";
const BORDER   = "#EDE8DF";
const CARD     = "#FAF9F7";
const SAGE     = "#5E7C64";

function fmtCurrency(n: number): string {
  return n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

function Fraunces({ children, size = "1.05rem" }: { children: React.ReactNode; size?: string }) {
  return (
    <span style={{ fontFamily: "var(--font-display), serif", fontStyle: "italic", fontWeight: 300, fontSize: size, letterSpacing: "-0.02em", fontVariationSettings: '"SOFT" 100, "WONK" 1', color: CHARCOAL, lineHeight: 1 }}>
      {children}
    </span>
  );
}

type SettingsT = {
  categoryNamePlaceholder: string;
  color: string;
  save: string;
  cancel: string;
  noDescription: string;
  financingCategory: string;
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
  onSave: (label: string, color: string, noDescription: boolean, financingCategory: boolean) => void;
  onCancel: () => void;
  ts: SettingsT;
}) {
  const [label, setLabel] = useState(cat.label ?? "");
  const [color, setColor] = useState(cat.color ?? COLOR_PALETTE[0]);
  const [noDescription, setNoDescription] = useState(cat.noDescription ?? false);
  const [financingCategory, setFinancingCategory] = useState(cat.financingCategory ?? false);

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
          if (e.key === "Enter" && label.trim()) onSave(label.trim(), color, noDescription, financingCategory);
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

      {/* No description needed */}
      <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: "0.8rem", color: CHARCOAL }}>
        <Checkbox checked={noDescription} onCheckedChange={(c) => setNoDescription(c === true)} />
        {ts.noDescription}
      </label>

      {/* Financing category — the expense dialog only offers "Financiación" when this category is picked */}
      <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: "0.8rem", color: CHARCOAL }}>
        <Checkbox checked={financingCategory} onCheckedChange={(c) => setFinancingCategory(c === true)} />
        {ts.financingCategory}
      </label>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" onClick={() => { if (label.trim()) onSave(label.trim(), color, noDescription, financingCategory); }} disabled={!label.trim()}
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

// ── Financiaciones ──────────────────────────────────────────────────────
// Deliberately NOT styled like the category chips above — a financing plan
// isn't a color-coded tag, it's a money record with an owner. Same ledger
// treatment as a movement row (left accent bar by owner + Fraunces amount)
// instead of the color-picker editor used for categories.
function InstallmentEditRow({
  plan, onSave, onCancel,
}: {
  plan: Partial<InstallmentPlan>;
  onSave: (data: Omit<InstallmentPlan, "id" | "paidAmount" | "paidCount">) => void;
  onCancel: () => void;
}) {
  const { t }                             = useLang();
  const currentUser                       = getCurrentUsername();
  const isTest                            = currentUser.toLowerCase() === "test";
  const [description, setDescription]     = useState(plan.description ?? "");
  const [totalAmount, setTotalAmount]     = useState(plan.totalAmount?.toString() ?? "");
  const [monthlyAmount, setMonthlyAmount] = useState(plan.monthlyAmount?.toString() ?? "");
  const [startDate, setStartDate]         = useState(plan.startDate ?? toDateKey(todayDate()));
  const [userName, setUserName]           = useState(plan.userName ?? currentUser);
  const [users, setUsers]                 = useState<string[]>([]);
  const [initialPaidAmount, setInitialPaidAmount] = useState(plan.initialPaidAmount?.toString() ?? "0");
  const [initialPaidTouched, setInitialPaidTouched] = useState(false);

  useEffect(() => {
    if (isTest) return;
    apiFetch("/api/users")
      .then(r => r.json())
      .then((data: string[]) => setUsers(data.filter(u => u.toLowerCase() !== "test")))
      .catch(() => {});
  }, [isTest]);

  // For a NEW plan (not editing), suggest how much is already paid by counting
  // full months between the start date and today, minus the current month —
  // that one gets its own real linked expense instead. Only a starting point:
  // the user can still type over it (e.g. if the real figure is different).
  useEffect(() => {
    if (plan.id || initialPaidTouched) return;
    const monthly = parseFloat(monthlyAmount);
    if (!startDate || !(monthly > 0)) return;
    const start = new Date(startDate + "T12:00:00");
    const today = todayDate();
    const monthsBefore = Math.max(0, (today.getFullYear() - start.getFullYear()) * 12 + (today.getMonth() - start.getMonth()));
    setInitialPaidAmount((monthsBefore * monthly).toFixed(2));
  }, [startDate, monthlyAmount, plan.id, initialPaidTouched]);

  const validTotal   = parseFloat(totalAmount) > 0;
  const validMonthly = parseFloat(monthlyAmount) > 0;
  const canSave       = !!description.trim() && validTotal && validMonthly && !!startDate;

  function handleSave() {
    if (!canSave) return;
    onSave({
      description: description.trim(), totalAmount: parseFloat(totalAmount), monthlyAmount: parseFloat(monthlyAmount),
      startDate, userName, initialPaidAmount: Math.max(0, parseFloat(initialPaidAmount) || 0),
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "16px 20px", background: "#F7F5F2", border: `1px solid ${BORDER}`, borderRadius: 12 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <Label className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: MUTED }}>
          {t.installments.description}
        </Label>
        <Input
          autoFocus
          placeholder={t.installments.descriptionPlaceholder}
          maxLength={200}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="h-auto rounded-none border-x-0 border-t-0 border-b bg-transparent px-0 pb-2 focus-visible:ring-0 millys-input"
          style={{ color: CHARCOAL }}
        />
      </div>

      <div style={{ display: "flex", gap: 16 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <Label className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: MUTED }}>
            {t.installments.totalAmount}
          </Label>
          <Input
            type="number" inputMode="decimal" step="0.01" min="0.01" placeholder="0,00"
            value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)}
            className="h-auto rounded-none border-x-0 border-t-0 border-b bg-transparent px-0 pb-2 focus-visible:ring-0 millys-input"
            style={{ color: CHARCOAL }}
          />
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <Label className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: MUTED }}>
            {t.installments.monthlyAmount}
          </Label>
          <Input
            type="number" inputMode="decimal" step="0.01" min="0.01" placeholder="0,00"
            value={monthlyAmount} onChange={(e) => setMonthlyAmount(e.target.value)}
            className="h-auto rounded-none border-x-0 border-t-0 border-b bg-transparent px-0 pb-2 focus-visible:ring-0 millys-input"
            style={{ color: CHARCOAL }}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 16 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <Label className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: MUTED }}>
            {t.installments.startDate}
          </Label>
          <DatePicker value={startDate} onChange={setStartDate} months={t.calendar.months} days={t.calendar.days} placeholder={t.installments.datePlaceholder} />
        </div>
        {!isTest && users.length > 1 && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <Label className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: MUTED }}>
              Usuario
            </Label>
            <Select value={userName} onValueChange={(v) => setUserName(v ?? userName)}>
              <SelectTrigger
                className="w-full rounded-none border-x-0 border-t-0 border-b bg-transparent px-0 pb-2 focus-visible:ring-0 millys-input"
                style={{ color: CHARCOAL }}
              >
                {userName}
              </SelectTrigger>
              <SelectContent>
                {users.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Auto-suggested from start date + cuota (see effect above), so a plan
          that already had payments before Millys existed doesn't start the
          progress bar at 0 — still a plain editable field, not locked to the estimate. */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <Label className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: MUTED }}>
          {t.installments.initialPaidAmount}
        </Label>
        <Input
          type="number" inputMode="decimal" step="0.01" min="0" placeholder="0,00"
          value={initialPaidAmount}
          onChange={(e) => { setInitialPaidAmount(e.target.value); setInitialPaidTouched(true); }}
          className="h-auto rounded-none border-x-0 border-t-0 border-b bg-transparent px-0 pb-2 focus-visible:ring-0 millys-input"
          style={{ color: CHARCOAL }}
        />
        <span style={{ fontSize: "0.68rem", color: MUTED }}>{t.installments.initialPaidAmountHint}</span>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" onClick={handleSave} disabled={!canSave}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 16px", borderRadius: 999, border: "none", background: CHARCOAL, color: "#FAF9F7", fontSize: "0.8rem", fontWeight: 600, cursor: canSave ? "pointer" : "not-allowed", opacity: canSave ? 1 : 0.4 }}
        >
          <Check size={12} strokeWidth={2.5} />
          {t.installments.save}
        </button>
        <button type="button" onClick={onCancel}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 16px", borderRadius: 999, border: "1px solid #DDD7CC", background: "transparent", color: STONE, fontSize: "0.8rem", fontWeight: 500, cursor: "pointer" }}
        >
          <X size={12} strokeWidth={2} />
          {t.installments.cancel}
        </button>
      </div>
    </div>
  );
}

function InstallmentDisplayRow({ plan, colorIndex, onEdit, onDelete }: {
  plan: InstallmentPlan; colorIndex: number; onEdit: () => void; onDelete: () => void;
}) {
  const { t } = useLang();
  const color = getUserColor(plan.userName, colorIndex);
  return (
    <div style={{ display: "flex", alignItems: "stretch", borderRadius: 12, border: `1px solid ${BORDER}`, background: CARD, overflow: "hidden" }}>
      <div style={{ width: 4, flexShrink: 0, background: color }} />
      <div style={{ flex: 1, padding: "13px 12px 13px 14px", display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "0.875rem", color: CHARCOAL, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {plan.description}
          </div>
          <div style={{ fontSize: "0.7rem", color: MUTED, marginTop: 3 }}>
            {plan.userName} · {fmtCurrency(plan.monthlyAmount)}/mes
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <Fraunces>{fmtCurrency(plan.paidAmount)}</Fraunces>
          <div style={{ fontSize: "0.635rem", color: MUTED }}>{t.global.installmentsOf} {fmtCurrency(plan.totalAmount)}</div>
        </div>
        <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
          <button onClick={onEdit}
            style={{ background: "transparent", border: "none", cursor: "pointer", padding: 6, borderRadius: 8, color: MUTED, display: "flex", alignItems: "center", transition: "color 0.15s ease, background 0.15s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = CHARCOAL; e.currentTarget.style.background = "#EDE8DF"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = MUTED;    e.currentTarget.style.background = "transparent"; }}
            aria-label={`Edit ${plan.description}`}
          >
            <Pencil size={13} strokeWidth={1.8} />
          </button>
          <button onClick={onDelete}
            style={{ background: "transparent", border: "none", cursor: "pointer", padding: 6, borderRadius: 8, color: MUTED, display: "flex", alignItems: "center", transition: "color 0.15s ease, background 0.15s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#EF4444"; e.currentTarget.style.background = "#FEF2F2"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = MUTED;     e.currentTarget.style.background = "transparent"; }}
            aria-label={`Delete ${plan.description}`}
          >
            <Trash2 size={13} strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main settings page ────────────────────────────────────────────────────
const LANG_OPTIONS: { code: Lang; label: string }[] = [
  { code: "es", label: "Español" },
  { code: "en", label: "English" },
  { code: "ca", label: "Català"  },
];

export default function SettingsPage() {
  const {
    categories, syncError, dismissSyncError,
    addCategory, updateCategory, deleteCategory,
  }                                  = useCategories();
  const {
    installments, syncError: installmentSyncError, dismissSyncError: dismissInstallmentSyncError,
    addInstallment, updateInstallment, deleteInstallment,
  }                                  = useInstallments();
  const { lang, setLang, t }        = useLang();
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [adding, setAdding]         = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [addingPlan, setAddingPlan]       = useState(false);

  const categoryErrorMessage   = syncError           ? t.errors[`${syncError}Category` as keyof typeof t.errors]             : null;
  const installmentErrorMessage = installmentSyncError ? t.errors[`${installmentSyncError}Installment` as keyof typeof t.errors] : null;

  function handleSaveEdit(id: string, label: string, color: string, noDescription: boolean, financingCategory: boolean) {
    updateCategory(id, { label, color, noDescription, financingCategory });
    setEditingId(null);
  }

  function handleAdd(label: string, color: string, noDescription: boolean, financingCategory: boolean) {
    addCategory({ label, color, noDescription, financingCategory });
    setAdding(false);
  }

  function handleDelete(id: string) {
    deleteCategory(id);
  }

  const categoryCount = `${categories.length} ${categories.length === 1 ? t.settings.categoryLabel : t.settings.categoryLabelPlural}`;

  // Stable owner color, same convention as Global/Home ("Reparto por persona").
  const ownerNames = Array.from(new Set(installments.map(p => p.userName)));
  const installmentCount = `${installments.length} ${installments.length === 1 ? t.settings.financingLabel : t.settings.financingLabelPlural}`;

  function handleSavePlan(data: Omit<InstallmentPlan, "id" | "paidAmount" | "paidCount">) {
    updateInstallment(editingPlanId!, data);
    setEditingPlanId(null);
  }

  function handleAddPlan(data: Omit<InstallmentPlan, "id" | "paidAmount" | "paidCount">) {
    addInstallment(data);
    setAddingPlan(false);
  }

  return (
    <div className="px-4 py-6 md:px-7 md:py-7">
      {categoryErrorMessage && (
        <div className="mb-4">
          <SyncErrorBanner message={categoryErrorMessage} onDismiss={dismissSyncError} />
        </div>
      )}
      {installmentErrorMessage && (
        <div className="mb-4">
          <SyncErrorBanner message={installmentErrorMessage} onDismiss={dismissInstallmentSyncError} />
        </div>
      )}

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
                  onSave={(label, color, noDescription, financingCategory) => handleSaveEdit(cat.id, label, color, noDescription, financingCategory)}
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

      {/* ── Financiaciones ── */}
      <section style={{ marginBottom: 36 }}>
        <div style={{ height: 1, background: BORDER, marginBottom: 24 }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: MUTED }}>
              {t.settings.financingTitle}
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: MUTED }}>{installmentCount}</p>
          </div>
          {!addingPlan && (
            <button
              onClick={() => { setAddingPlan(true); setEditingPlanId(null); }}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 999, border: "1px solid #DDD7CC", background: "transparent", color: CHARCOAL, fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", transition: "background 0.15s ease" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#F0EDE8")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <Plus size={13} strokeWidth={2.5} />
              {t.settings.newFinancing}
            </button>
          )}
        </div>

        {installments.length === 0 && !addingPlan ? (
          <p style={{ margin: 0, fontSize: "0.8rem", color: MUTED }}>{t.settings.financingEmpty}</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {installments.map((plan) => (
              editingPlanId === plan.id ? (
                <InstallmentEditRow
                  key={plan.id}
                  plan={plan}
                  onSave={handleSavePlan}
                  onCancel={() => setEditingPlanId(null)}
                />
              ) : (
                <InstallmentDisplayRow
                  key={plan.id}
                  plan={plan}
                  colorIndex={ownerNames.indexOf(plan.userName)}
                  onEdit={() => { setEditingPlanId(plan.id); setAddingPlan(false); }}
                  onDelete={() => deleteInstallment(plan.id)}
                />
              )
            ))}
            {addingPlan && (
              <InstallmentEditRow plan={{}} onSave={handleAddPlan} onCancel={() => setAddingPlan(false)} />
            )}
          </div>
        )}
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
                  background: active ? SAGE : "transparent",
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
