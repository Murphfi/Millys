# Millys

A monthly expense tracker for couples, replacing a shared Excel spreadsheet in Drive. Personal project to practice Spring Boot and modern technologies.

## Stack

- **Backend:** Java 21 + Spring Boot 3.x + Spring Security + JWT + Spring Data JPA
- **Frontend:** Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui + Recharts
- **Database:** Neon (PostgreSQL serverless)
- **Deploy frontend:** Vercel
- **Deploy backend:** Render free tier

## Project structure

```
Millys/
├── backend/                        ← Spring Boot
│   └── src/main/java/...
└── frontend/                       ← Next.js 15 (App Router)
    └── app/
        ├── layout.tsx              ← Root layout (fonts: Fraunces + Plus Jakarta Sans)
        ├── globals.css             ← Tailwind base + bocadillo CSS system
        ├── login/
        │   └── page.tsx            ← Two-panel login card + cat room illustration
        └── dashboard/
            ├── layout.tsx          ← Shell: sidebar + bocadillo nav + subpantalla
            ├── page.tsx            ← Redirects to /dashboard/home
            ├── home/
            │   └── page.tsx        ← Home (placeholder)
            ├── global/
            │   └── page.tsx        ← Global summary (placeholder)
            └── monthly/
                └── page.tsx        ← Monthly summary (placeholder)
```

## Commands

```bash
# Backend — load env vars first
cd backend && export $(grep -v '^#' .env | xargs) && ./mvnw spring-boot:run

# Frontend
cd frontend && npm run dev
```

## V1 Scope

1. Login for 3 users: Murphfas, Lilly, Test
2. Monthly expense management
3. Charts and visualisation

### Current state

- [x] JWT authentication (backend)
- [x] Login page — two-panel card, cat room SVG illustration, underline form, shadcn inputs
- [x] Dashboard shell — sidebar, bocadillo connected-tab nav, subpantalla, topbar
- [ ] Expense management (CRUD)
- [ ] Charts (Recharts)

## Memory System

El vault de memoria está en `~/Omurphy-brain/Projects/Millys/`.

- **`/wake`** — Al empezar a trabajar: lee `Progress.md` y `Decisions.md` y da un briefing del estado actual
- **`/wrap`** — Al terminar: actualiza `Progress.md` con lo hecho y escribe una entrada en `~/Omurphy-brain/Memory.md`

Las skills de diseño y UI están en `~/code/.claude/skills/` y disponibles globalmente.

## Rules

- No Docker locally
- This is a learning project: explain before implementing
- No features outside V1 scope
- Branch `develop` for daily work, `main` for releases
- Never commit without explicit user approval

## Design System

Approach every UI decision as a design lead at a small studio — make deliberate, opinionated choices specific to this product. Avoid templated defaults. Before building any new screen, brainstorm a short design plan (palette, type, layout, signature element) and review it against the brief before writing code.

### Visual identity

Millys is intimate, personal, and trusted — a couple's private space for shared finances. The aesthetic is "Japandi Night Ledger": warm, calm, and distinctive without being corporate.

**Palette**
| Token | Hex | Use |
|---|---|---|
| `--sage` | `#5E7C64` | Sidebar, outer frame, bocadillo corner fills |
| `--card` | `#FAF9F7` | All card surfaces (subpantalla, login right panel) |
| `--sand` | `#F2EBE1` | Page background |
| `--charcoal` | `#2A2720` | Primary text, active nav label, button fill |
| `--stone` | `#78726A` | Secondary text, topbar section label |
| `--muted` | `#A09890` | Label/caption text, username in topbar |
| `--nav-off` | `#9AB89D` | Inactive sidebar nav items |
| `--violet` | `#A78BFA` | Accent dot on "Millys." (login only) |
| `--error` | `#EF4444` | Error states |

Use `rgba(42,39,32,...)` (charcoal-based) for all shadows — never `rgba(0,0,0,...)`.

**Typography**
- Display: `Fraunces` (italic, weight 300) — loaded via `next/font/google` with `SOFT` and `WONK` axes. Used for the brand name "Millys" and topbar section label. CSS var: `var(--font-display)`.
- UI: `Plus Jakarta Sans` — all other text. CSS var: `var(--font-sans)`.

**Motion**
- Prefer `cubic-bezier(0.34, 1.56, 0.64, 1)` (spring overshoot) for playful/character elements
- Use `ease-in-out` for structural transitions (panels, cards)
- Respect `prefers-reduced-motion`

### Dashboard layout (`frontend/app/dashboard/layout.tsx`)

Outer card: sage `#5E7C64` frame, `borderRadius: 28`, `margin: 16px` (from `p-4` wrapper).

**Sidebar:** `width: 182px`, `padding: "32px 0 24px"`, sage background, `zIndex: 2`.
- Brand "Millys" centered, Fraunces italic 2.25rem, color `#EDE8DE`.
- Nav container: `paddingLeft: 12` — 12px breathing room from sidebar left edge.
- Nav links: `padding: "11px 0 11px 20px"`, font 13px. Routes: `/dashboard/home`, `/dashboard/global`, `/dashboard/monthly`.
- Active tab: `borderRadius: "12px 0 0 12px"`, `background: #FAF9F7`, charcoal text, weight 600.
- Inactive items: `color: #9AB89D`, hover → `#D4E8D6`.

**Subpantalla:** `position: absolute; top:16; left:20; right:12; bottom:12; borderRadius:20; background:#FAF9F7`.
`left:20` is intentional — it creates the 20px sage gap where the bocadillo curves live.

**Bocadillo (connected-tab) system** — CSS in `globals.css`:
- `.millys-bridge`: white element filling the 20px gap at the active tab's height, extending 20px above and below so the corners have white behind them.
- `.millys-corner-top` / `.millys-corner-bottom`: sage 20×20px squares, `z-index: 3`, with `border-radius` that reveals the white bridge beneath — creating concave curves.
- Curves live entirely in the sage gap, never inside the white card.

### Login page (`frontend/app/login/page.tsx`)

Two-panel card, `maxWidth: 860`, `borderRadius: 28`, page background `#F2EBE1`.
- **Left panel (42%):** `RoomBackground` — SVG cat room illustration (three art-parody paintings, ramp, food bowl, cat tree). Millys character slot is intentionally empty — final asset will be a static image or GIF.
- **Right panel (58%):** Form on `#FAF9F7`. Fraunces brand + violet dot accent, underline inputs (shadcn), pill submit button (charcoal fill).

### Millys character (mascot)

Not yet in the UI. Will be a static image or GIF placed inside the left panel of the login page (`frontend/app/login/page.tsx`). Drop it inside the left panel `<div>` when the asset is ready.

Animation keyframes are defined in `globals.css` for future use: `millys-x`, `millys-y`, `millys-morph`, `millys-glow`, `millys-squish`.
