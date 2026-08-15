"use client";

import { useState, useEffect } from "react";
import { Plus, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { useCategories } from "./lib/categories";
import { useLang, getCategoryLabel } from "./lib/i18n";
import { useExpenses, getCurrentUsername, type Expense } from "./lib/expenses";

// ── Design tokens ─────────────────────────────────────────────────────────
const CHARCOAL = "#2A2720";
const MUTED    = "#A09890";
const BORDER   = "#DDD7CC";
const CARD     = "#FAF9F7";
const SAGE     = "#5E7C64";

// ── Helpers ───────────────────────────────────────────────────────────────
const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DAYS_ES   = ["Lu","Ma","Mi","Ju","Vi","Sa","Do"];

function CategoryDot({ color }: { color: string }) {
  return (
    <span style={{
      display: "inline-block",
      width: 7, height: 7,
      borderRadius: "50%",
      background: color,
      flexShrink: 0,
    }} />
  );
}

// ── Custom date picker ────────────────────────────────────────────────────
function DatePicker({
  value, onChange,
  months, days, placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  months: readonly string[];
  days: readonly string[];
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);

  const selectedDate = value ? new Date(value + "T12:00:00") : null;
  const [viewYear,  setViewYear]  = useState(() => selectedDate?.getFullYear()  ?? new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => selectedDate?.getMonth()     ?? new Date().getMonth());

  const displayValue = selectedDate
    ? `${String(selectedDate.getDate()).padStart(2,"0")}/${String(selectedDate.getMonth()+1).padStart(2,"0")}/${selectedDate.getFullYear()}`
    : "";

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }
  function selectDay(day: number) {
    const d  = new Date(viewYear, viewMonth, day);
    const yy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    onChange(`${yy}-${mm}-${dd}`);
    setOpen(false);
  }

  // Monday-first grid
  const startOffset = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const today = new Date();

  return (
    <div style={{ position: "relative" }}>
      {/* Trigger — same underline style as other fields */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="millys-input"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          border: "none",
          borderBottom: `1px solid ${BORDER}`,
          background: "transparent",
          padding: "0 0 8px",
          color: displayValue ? CHARCOAL : MUTED,
          fontSize: "0.875rem",
          cursor: "pointer",
          outline: "none",
          fontFamily: "var(--font-sans)",
        }}
      >
        <span>{displayValue || placeholder}</span>
        <Calendar size={14} color={MUTED} />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div style={{ position: "fixed", inset: 0, zIndex: 49 }} onClick={() => setOpen(false)} />

          {/* Calendar card */}
          <div style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            zIndex: 50,
            background: CARD,
            border: "1px solid #EDE8DF",
            borderRadius: 16,
            padding: "16px 14px 14px",
            boxShadow: "0 16px 48px rgba(42,39,32,0.16), 0 4px 16px rgba(42,39,32,0.06)",
            minWidth: 252,
          }}>
            {/* Month / year navigation */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <button type="button" onClick={prevMonth} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px 6px", borderRadius: 8, color: MUTED, display: "flex" }}>
                <ChevronLeft size={16} />
              </button>
              <span style={{
                fontFamily: "var(--font-display), serif",
                fontStyle: "italic",
                fontWeight: 300,
                fontSize: "1rem",
                letterSpacing: "-0.01em",
                fontVariationSettings: '"SOFT" 100, "WONK" 1',
                color: CHARCOAL,
              }}>
                {months[viewMonth]} {viewYear}
              </span>
              <button type="button" onClick={nextMonth} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px 6px", borderRadius: 8, color: MUTED, display: "flex" }}>
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Week day headers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 }}>
              {days.map(d => (
                <span key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", color: MUTED, paddingBottom: 4 }}>
                  {d}
                </span>
              ))}
            </div>

            {/* Day cells */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
              {cells.map((day, i) => {
                if (!day) return <span key={i} />;
                const isSelected = !!(selectedDate &&
                  day === selectedDate.getDate() &&
                  viewMonth === selectedDate.getMonth() &&
                  viewYear === selectedDate.getFullYear());
                const isToday = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => selectDay(day)}
                    style={{
                      width: "100%",
                      aspectRatio: "1",
                      borderRadius: "50%",
                      border: isToday && !isSelected ? `1px solid ${SAGE}` : "none",
                      background: isSelected ? SAGE : "transparent",
                      color: isSelected ? CARD : CHARCOAL,
                      fontSize: 12,
                      fontWeight: isSelected ? 600 : 400,
                      cursor: "pointer",
                      transition: "background 0.1s ease",
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "#EDE8DF"; }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Expense form ──────────────────────────────────────────────────────────
type ExpenseData = Omit<Expense, "id">;

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

function ExpenseForm({
  onClose,
  initialValues,
  onSubmit,
}: {
  onClose: () => void;
  initialValues?: Pick<Expense, "categoryId" | "description" | "date" | "amount" | "userName">;
  onSubmit: (data: ExpenseData) => void;
}) {
  const [categories]                  = useCategories();
  const { t }                         = useLang();
  const currentUser                   = getCurrentUsername();
  const isTest                        = currentUser.toLowerCase() === "test";
  const [amount, setAmount]           = useState(initialValues?.amount?.toString() ?? "");
  const [categoryId, setCategoryId]   = useState(initialValues?.categoryId ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [date, setDate]               = useState(initialValues?.date ?? new Date().toISOString().slice(0, 10));
  const [userName, setUserName]       = useState(initialValues?.userName ?? currentUser);
  const [users, setUsers]             = useState<string[]>([]);

  // Fetch real user list for non-Test sessions
  useEffect(() => {
    if (isTest) return;
    const token = localStorage.getItem("token") ?? sessionStorage.getItem("token") ?? "";
    fetch(`${API_URL}/api/users`, { headers: { "Authorization": `Bearer ${token}` } })
      .then(r => r.json())
      .then((data: string[]) => setUsers(data.filter(u => u.toLowerCase() !== "test")))
      .catch(() => {});
  }, [isTest]);

  const isEdit      = !!initialValues;
  const selectedCat = categories.find(c => c.id === categoryId);
  const isChofa     = categoryId === "chofa";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ categoryId, description: isChofa ? "" : description, date, amount: parseFloat(amount), userName });
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {/* Header */}
      <h2 style={{
        fontFamily: "var(--font-display), serif",
        fontStyle: "italic",
        fontWeight: 300,
        fontSize: "1.75rem",
        lineHeight: 1,
        letterSpacing: "-0.02em",
        fontVariationSettings: '"SOFT" 100, "WONK" 1',
        color: CHARCOAL,
        margin: 0,
      }}>
        {isEdit ? "Editar gasto" : t.expense.title}
      </h2>

      {/* Amount */}
      <div style={{ textAlign: "center", padding: "10px 0 4px" }}>
        <div style={{ display: "inline-flex", alignItems: "baseline", gap: 6 }}>
          <span style={{
            fontFamily: "var(--font-display), serif",
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: "2rem",
            color: MUTED,
          }}>€</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            style={{
              fontFamily: "var(--font-display), serif",
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: "3.25rem",
              lineHeight: 1,
              letterSpacing: "-0.03em",
              color: CHARCOAL,
              border: "none",
              borderBottom: `2px solid ${BORDER}`,
              background: "transparent",
              outline: "none",
              width: "6ch",
              textAlign: "center",
              padding: "0 0 6px",
            }}
          />
        </div>
      </div>

      {/* Category */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <Label className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: MUTED }}>
          {t.expense.category}
        </Label>
        <Select value={categoryId} onValueChange={(v) => { setCategoryId(v ?? ""); if (v === "chofa") setDescription(""); }}>
          <SelectTrigger
            className="w-full rounded-none border-x-0 border-t-0 border-b bg-transparent px-0 pb-2 focus-visible:ring-0 millys-input"
            style={{ color: CHARCOAL }}
          >
            {selectedCat ? (
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CategoryDot color={selectedCat.color} />
                {getCategoryLabel(selectedCat, t)}
              </span>
            ) : (
              <span style={{ color: MUTED }}>{t.expense.categoryPlaceholder}</span>
            )}
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <CategoryDot color={c.color} />
                  {getCategoryLabel(c, t)}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Description — hidden for Chofa (no description needed) */}
      {!isChofa && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Label className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: MUTED }}>
            {t.expense.description}
          </Label>
          <Input
            placeholder={t.expense.descriptionPlaceholder}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="h-auto rounded-none border-x-0 border-t-0 border-b bg-transparent px-0 pb-2 focus-visible:ring-0 millys-input"
            style={{ color: CHARCOAL }}
          />
        </div>
      )}

      {/* Date */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <Label className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: MUTED }}>
          {t.expense.date}
        </Label>
        <DatePicker
          value={date}
          onChange={setDate}
          months={t.calendar.months}
          days={t.calendar.days}
          placeholder={t.expense.datePlaceholder}
        />
      </div>

      {/* User selector — non-Test users only */}
      {!isTest && users.length > 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
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
              {users.map(u => (
                <SelectItem key={u} value={u}>{u}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            flex: 1, height: 44,
            borderRadius: 999,
            border: `1px solid ${BORDER}`,
            background: "transparent",
            color: "#78726A",
            fontSize: "0.875rem",
            fontWeight: 500,
            cursor: "pointer",
            transition: "border-color 0.15s ease",
          }}
        >
          {t.expense.cancel}
        </button>
        <button
          type="submit"
          disabled={!amount || !categoryId}
          className="millys-btn"
          style={{
            flex: 2, height: 44,
            borderRadius: 999,
            border: "none",
            background: CHARCOAL,
            color: CARD,
            fontSize: "0.875rem",
            fontWeight: 600,
            cursor: "pointer",
            letterSpacing: "0.02em",
            opacity: !amount || !categoryId ? 0.4 : 1,
          }}
        >
          {isEdit ? "Guardar" : t.expense.add}
        </button>
      </div>
    </form>
  );
}

// ── Reusable dialog shell ─────────────────────────────────────────────────
export function ExpenseDialog({
  open,
  onOpenChange,
  initialValues,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialValues?: Pick<Expense, "categoryId" | "description" | "date" | "amount" | "userName">;
  onSubmit: (data: ExpenseData) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={{
        maxWidth: 420,
        width: "calc(100vw - 32px)",
        borderRadius: 20,
        padding: "32px 28px 28px",
        background: CARD,
        border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 24px 64px rgba(42,39,32,0.14), 0 4px 16px rgba(42,39,32,0.06)",
      }}>
        <ExpenseForm onClose={() => onOpenChange(false)} initialValues={initialValues} onSubmit={onSubmit} />
      </DialogContent>
    </Dialog>
  );
}

// ── Trigger button ────────────────────────────────────────────────────────
export function AddExpenseButton() {
  const [open, setOpen]   = useState(false);
  const { addExpense }    = useExpenses();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Añadir gasto"
        style={{
          width: 36, height: 36,
          borderRadius: "50%",
          background: SAGE,
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          boxShadow: "0 2px 8px rgba(94,124,100,0.35)",
          transition: "transform 0.15s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.15s ease",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.1)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(94,124,100,0.45)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)";   e.currentTarget.style.boxShadow = "0 2px 8px rgba(94,124,100,0.35)"; }}
      >
        <Plus size={16} color={CARD} strokeWidth={2.5} />
      </button>

      <ExpenseDialog open={open} onOpenChange={setOpen} onSubmit={addExpense} />
    </>
  );
}
