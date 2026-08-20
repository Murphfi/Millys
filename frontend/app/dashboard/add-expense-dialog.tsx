"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
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
import { useIncome, type Income } from "./lib/income";
import { DatePicker } from "./date-picker";

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
  const isChofa     = selectedCat?.noDescription ?? false;

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
        <Select value={categoryId} onValueChange={(v) => {
          setCategoryId(v ?? "");
          if (categories.find(c => c.id === v)?.noDescription) setDescription("");
        }}>
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

      {/* Description — hidden for categories marked noDescription (e.g. Chofa) */}
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

// ── Income form ───────────────────────────────────────────────────────────
type IncomeData = Omit<Income, "id">;

function IncomeForm({
  onClose,
  initialValues,
  onSubmit,
}: {
  onClose: () => void;
  initialValues?: Pick<Income, "description" | "date" | "amount" | "userName">;
  onSubmit: (data: IncomeData) => void;
}) {
  const { t }                         = useLang();
  const currentUser                   = getCurrentUsername();
  const isTest                        = currentUser.toLowerCase() === "test";
  const [amount, setAmount]           = useState(initialValues?.amount?.toString() ?? "");
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

  const isEdit = !!initialValues;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ description, date, amount: parseFloat(amount), userName });
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
        {isEdit ? "Editar ingreso" : t.income.title}
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

      {/* Description — optional for income, unlike expense */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <Label className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: MUTED }}>
          {t.income.description}
        </Label>
        <Input
          placeholder={t.income.descriptionPlaceholder}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="h-auto rounded-none border-x-0 border-t-0 border-b bg-transparent px-0 pb-2 focus-visible:ring-0 millys-input"
          style={{ color: CHARCOAL }}
        />
      </div>

      {/* Date */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <Label className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: MUTED }}>
          {t.income.date}
        </Label>
        <DatePicker
          value={date}
          onChange={setDate}
          months={t.calendar.months}
          days={t.calendar.days}
          placeholder={t.income.datePlaceholder}
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
          {t.income.cancel}
        </button>
        <button
          type="submit"
          disabled={!amount}
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
            opacity: !amount ? 0.4 : 1,
          }}
        >
          {isEdit ? "Guardar" : t.income.add}
        </button>
      </div>
    </form>
  );
}

// ── Gasto / Ingreso toggle — single connected pill, states are exclusive ──
function KindToggle({ kind, onChange }: { kind: "expense" | "income"; onChange: (k: "expense" | "income") => void }) {
  const { t } = useLang();
  return (
    <div style={{ display: "flex", gap: 6, padding: 4, background: "#F2EBE1", borderRadius: 999, marginBottom: 4 }}>
      {(["expense", "income"] as const).map(k => {
        const active = kind === k;
        return (
          <button
            key={k}
            type="button"
            onClick={() => onChange(k)}
            style={{
              flex: 1,
              padding: "8px 0",
              borderRadius: 999,
              border: "none",
              background: active ? CHARCOAL : "transparent",
              color: active ? CARD : "#78726A",
              fontSize: "0.8rem",
              fontWeight: active ? 600 : 500,
              cursor: "pointer",
              transition: "background 0.15s ease, color 0.15s ease",
            }}
          >
            {k === "expense" ? t.expense.kindExpense : t.expense.kindIncome}
          </button>
        );
      })}
    </div>
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

// ── Income-only dialog shell — used to edit an existing income entry from the
// Ingresos list on the Ahorro page. Adding a new one goes through AddEntryDialog's
// toggle instead. ─────────────────────────────────────────────────────────
export function IncomeDialog({
  open,
  onOpenChange,
  initialValues,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialValues?: Pick<Income, "description" | "date" | "amount" | "userName">;
  onSubmit: (data: IncomeData) => void;
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
        <IncomeForm onClose={() => onOpenChange(false)} initialValues={initialValues} onSubmit={onSubmit} />
      </DialogContent>
    </Dialog>
  );
}

// ── Combined add dialog — Gasto/Ingreso toggle, "add" only (never edit) ────
export function AddEntryDialog({
  open,
  onOpenChange,
  onSubmitExpense,
  onSubmitIncome,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmitExpense: (data: ExpenseData) => void;
  onSubmitIncome: (data: IncomeData) => void;
}) {
  const [kind, setKind] = useState<"expense" | "income">("expense");

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
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <KindToggle kind={kind} onChange={setKind} />
          {kind === "expense"
            ? <ExpenseForm onClose={() => onOpenChange(false)} onSubmit={onSubmitExpense} />
            : <IncomeForm onClose={() => onOpenChange(false)} onSubmit={onSubmitIncome} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Trigger button ────────────────────────────────────────────────────────
export function AddExpenseButton() {
  const [open, setOpen]   = useState(false);
  const { addExpense }    = useExpenses();
  const { addIncome }     = useIncome();

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

      <AddEntryDialog open={open} onOpenChange={setOpen} onSubmitExpense={addExpense} onSubmitIncome={addIncome} />
    </>
  );
}
