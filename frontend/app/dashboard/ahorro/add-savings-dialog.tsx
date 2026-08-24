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
import { useLang, getDestinationLabel } from "../lib/i18n";
import { apiFetch, getCurrentUsername } from "../lib/api";
import { todayDate, toDateKey } from "../lib/stats";
import { useSavings, SAVINGS_DESTINATIONS, type SavingsEntry } from "../lib/savings";
import { DatePicker } from "../date-picker";

// ── Design tokens — same as add-expense-dialog.tsx ─────────────────────────
const CHARCOAL = "#2A2720";
const MUTED    = "#A09890";
const BORDER   = "#DDD7CC";
const CARD     = "#FAF9F7";
const SAGE     = "#5E7C64";

function DestDot({ color }: { color: string }) {
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

// ── Savings form ──────────────────────────────────────────────────────────
type SavingsData = Omit<SavingsEntry, "id">;

function SavingsForm({
  onClose,
  initialValues,
  onSubmit,
}: {
  onClose: () => void;
  initialValues?: Pick<SavingsEntry, "destinationCode" | "description" | "date" | "amount" | "userName">;
  onSubmit: (data: SavingsData) => void;
}) {
  const { t }                             = useLang();
  const currentUser                       = getCurrentUsername();
  const isTest                            = currentUser.toLowerCase() === "test";
  const [amount, setAmount]               = useState(initialValues?.amount?.toString() ?? "");
  const validAmount                       = parseFloat(amount) > 0;
  const [destinationCode, setDestination] = useState(initialValues?.destinationCode ?? "");
  const [description, setDescription]     = useState(initialValues?.description ?? "");
  const [date, setDate]                   = useState(initialValues?.date ?? toDateKey(todayDate()));
  const [userName, setUserName]           = useState(initialValues?.userName ?? currentUser);
  const [users, setUsers]                 = useState<string[]>([]);

  // Fetch real user list for non-Test sessions
  useEffect(() => {
    if (isTest) return;
    apiFetch("/api/users")
      .then(r => r.json())
      .then((data: string[]) => setUsers(data.filter(u => u.toLowerCase() !== "test")))
      .catch(() => {});
  }, [isTest]);

  const isEdit         = !!initialValues;
  const selectedDest   = SAVINGS_DESTINATIONS.find(d => d.code === destinationCode);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ destinationCode, description, date, amount: parseFloat(amount), userName });
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
        {isEdit ? t.savings.editTitle : t.savings.title}
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
            min="0.01"
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

      {/* Destination */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <Label className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: MUTED }}>
          {t.savings.destination}
        </Label>
        <Select value={destinationCode} onValueChange={(v) => setDestination(v ?? "")}>
          <SelectTrigger
            className="w-full rounded-none border-x-0 border-t-0 border-b bg-transparent px-0 pb-2 focus-visible:ring-0 millys-input"
            style={{ color: CHARCOAL }}
          >
            {selectedDest ? (
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <DestDot color={selectedDest.color} />
                {getDestinationLabel(selectedDest, t)}
              </span>
            ) : (
              <span style={{ color: MUTED }}>{t.savings.destinationPlaceholder}</span>
            )}
          </SelectTrigger>
          <SelectContent>
            {SAVINGS_DESTINATIONS.map((d) => (
              <SelectItem key={d.code} value={d.code}>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <DestDot color={d.color} />
                  {getDestinationLabel(d, t)}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Description — optional note */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <Label className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: MUTED }}>
          {t.savings.description}
        </Label>
        <Input
          placeholder={t.savings.descriptionPlaceholder}
          maxLength={200}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="h-auto rounded-none border-x-0 border-t-0 border-b bg-transparent px-0 pb-2 focus-visible:ring-0 millys-input"
          style={{ color: CHARCOAL }}
        />
      </div>

      {/* Date */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <Label className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: MUTED }}>
          {t.savings.date}
        </Label>
        <DatePicker
          value={date}
          onChange={setDate}
          months={t.calendar.months}
          days={t.calendar.days}
          placeholder={t.savings.datePlaceholder}
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
          {t.savings.cancel}
        </button>
        <button
          type="submit"
          disabled={!validAmount || !destinationCode}
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
            opacity: !validAmount || !destinationCode ? 0.4 : 1,
          }}
        >
          {isEdit ? t.savings.save : t.savings.add}
        </button>
      </div>
    </form>
  );
}

// ── Reusable dialog shell — also used to edit a movement from the list ─────
export function SavingsDialog({
  open,
  onOpenChange,
  initialValues,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialValues?: Pick<SavingsEntry, "destinationCode" | "description" | "date" | "amount" | "userName">;
  onSubmit: (data: SavingsData) => void;
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
        <SavingsForm onClose={() => onOpenChange(false)} initialValues={initialValues} onSubmit={onSubmit} />
      </DialogContent>
    </Dialog>
  );
}

// ── Trigger button — page-scoped, not global like AddExpenseButton ────────
export function AddSavingsButton() {
  const [open, setOpen]   = useState(false);
  const { addSaving }     = useSavings();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Añadir movimiento"
        style={{
          width: 30, height: 30,
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
        <Plus size={14} color={CARD} strokeWidth={2.5} />
      </button>

      <SavingsDialog open={open} onOpenChange={setOpen} onSubmit={addSaving} />
    </>
  );
}
