# AGENTS.md

Guide for AI agents and developers working in this repo. Read this before touching code.
Task-by-task playbooks (add a module, run a migration, etc.) live in **SKILLS.md**.

## What this app is

**SIP Manajemen** — internal ops console for Solidaritas Insan Peduli (zakat/social-aid NGO).
Manages aid requests (pengajuan), field verification, decisions, disbursement, monthly
rosters (bantuan rutin), mustahik (beneficiary) master data, donors, and reports.
Status: validation prototype. **All UI copy is Bahasa Indonesia.**

## Stack

| Layer | Tech |
|---|---|
| Monorepo | pnpm workspaces (`apps/*`, `packages/*`), Biome (lint + format), TypeScript strict |
| API | Hono + `@hono/zod-validator`, Prisma + PostgreSQL (`pg` adapter), better-auth |
| Admin SPA | React 19, Vite, TanStack Router (file-based) + React Query, Tailwind v4 |
| Shared UI | `@repo/ui` — shadcn on radix/base-ui primitives, tokens in `src/styles.css` |
| Type-safe client | `@repo/api-client` — Hono `hc<AppType>` RPC client, types inferred from API |
| Domain | `@repo/sip-domain` — workflow states, labels, Had Kifayah logic, formatters. Zero deps. |
| Worker | `@repo/worker` — BullMQ (Redis) |
| Storage | `@repo/storage` — S3/MinIO presigned uploads |
| Infra | Docker Compose (Postgres, Redis, MinIO), Caddy, OpenTelemetry + pino |

## Repo map

```
apps/api/            Hono API. src/modules/<name>/router.ts per domain; app.ts mounts all.
apps/api/prisma/     schema.prisma (17 models), migrations, seed.ts
apps/admin/          SPA. src/routes/ = TanStack file routes; src/modules/<name>/ = feature code
packages/sip-domain/ Pure domain logic — workflow statuses, Had Kifayah, formatters, types
packages/api-client/ hc client factory; import type { AppType } from @repo/api
packages/ui/         Shared components (@repo/ui/components/*), cn util, theme tokens
packages/config/     Zod-validated env config (apiConfig, etc.)
packages/{logger,telemetry,storage,i18n,worker}
scripts/createsuperuser.ts
docs/untracked/      PRD drafts (not committed context)
```

## Core patterns — follow these exactly

### API module (`apps/api/src/modules/<name>/`)
- One `router.ts` exporting `new Hono<{ Variables: AuthVariables }>()` with **chained**
  routes (chaining is required — `AppType` inference breaks otherwise).
- Zod schemas at top of file, applied via `zValidator("json" | "query" | "param", schema)`.
- Auth: `requireUser` / `requireRole(...)` middleware from `../auth/middleware`.
- DB via `prisma` from `../../utils/prisma`.
- Mount the router in `src/app.ts` — this is what propagates types to the client.

### Admin feature module (`apps/admin/src/modules/<name>/`)
- `services.ts` — typed API calls. Types come from `InferRequestType` / `InferResponseType`
  on the `api` client (`../../lib/api`), never hand-written DTOs. Wrap calls in `unwrap`.
- `hooks.ts` — React Query. `queryOptions()` factories, `["<name>"]` key prefix,
  mutations invalidate the prefix on success, `toast.error(error.message)` on error.
- `*.tsx` — render-only components. Aggregation/derivation goes in `data.ts`.
- Route files in `src/routes/` stay thin: load `queryOptions` + render the module component.
- **No `useEffect` for data fetching. Ever.** React Query only.

### Domain logic
Workflow statuses, labels, tones, step order live in `@repo/sip-domain` (`workflow.ts`,
`types.ts`). Case workflow: `submitted → approved_for_verification → assigned → surveyed →
approved|rejected → disbursement_pending → completed` (+ `needs_revision`). Never inline
status strings/labels in UI — import from sip-domain. Same for `formatCurrency` /
`formatDate` (id-ID locale).

### File uploads
Client compresses to WebP (`lib/webp.ts`) → `POST /uploads/presign` → PUT to MinIO/S3 →
store returned `key` in payload. Never send file bytes through the API.

## Commands

```sh
pnpm install && cp .env.example .env
docker compose -f docker-compose.dev.yaml up -d   # Postgres, Redis, MinIO
pnpm db:generate && pnpm db:migrate
pnpm --filter @repo/api dev      # :8000
pnpm --filter @repo/admin dev    # :4000
pnpm createsuperuser

pnpm check:fix    # Biome lint+format (run before committing)
pnpm typecheck    # all packages
pnpm test         # vitest, per-package
pnpm db:studio
```

Env is loaded from root `.env` via `dotenv -e` (`with-env` scripts) — don't add per-package
`.env` files. Validate new env vars in `@repo/config` with Zod.

---

# UI / styling conventions

## Aesthetic direction

**Minimalist ops console** (Linear / Vercel restraint). Calm, dense-but-breathable,
content-first. No decorative gradients, no hero art, no motion for its own sake. The UI
is a working tool for a superadmin, not a marketing page.

- Restrained hierarchy: one accent, lots of neutral, small type for metadata.
- Numbers are the point — make them legible and aligned (`tabular-nums`).
- Whitespace is structural, not filler. Balance column heights; don't leave dead space.

## Design tokens — the hard rule

**Never hardcode hex colors in components.** All color comes from the theme tokens in
`packages/ui/src/styles.css` (oklch, light + `.dark`). This is what makes the app
themeable and dark-mode ready — bypassing it breaks both.

Use the Tailwind token utilities:

- Surfaces: `bg-background`, `bg-card`, `bg-muted`, `bg-sidebar`, `bg-sidebar-accent`
- Text: `text-foreground`, `text-muted-foreground`, `text-primary`, `text-sidebar-foreground`
- Accent: `bg-primary` / `text-primary-foreground` (the zakat-green brand accent)
- Lines: `border` (uses `--border`), `bg-border` for hairline dividers
- Data viz: `var(--color-chart-1..5)` via inline `style` when a raw color value is required
  (SVG stroke/fill, chart segments)

The theme is **zakat-green**: `--primary` is a deep green, the sidebar is a dark green,
neutrals carry a faint green tint. To reskin, edit `styles.css` only — never touch
component colors.

Allowed raw values: `var(--color-*)` references passed to `style` for charts. That's it.

## Layout patterns

- **Hairline container.** Group a dashboard's sections in one bordered card and separate
  them with 1px lines using the gap-border trick:
  `className="grid gap-px rounded-xl border bg-border [&>*]:bg-background"`.
  Each child paints its own `bg-background`; the `gap-px` reveals the `bg-border` beneath
  as hairlines. Inner section separators use `border-t pt-6`.
- **Column grids pack to the top.** Multi-section columns use `grid content-start gap-6`
  so rows don't stretch and leave gaps between blocks. Keep left/right column block
  counts and heights **balanced** — don't stack everything in one column.
- **Wide vs narrow.** Horizontal bar charts and multi-column distributions go in the
  wider column; lists, feeds, and queues go in the narrower rail.
- Max content width ~`max-w-[1440px]`, centered.

## Charts / data viz

- **No chart library.** No recharts, no chart.js. Use the dependency-free SVG primitives
  in `apps/admin/src/modules/dashboard/charts.tsx` (`Sparkline`, `Donut`, `BarList`) or
  add new ones there in the same style. Keeps the bundle small and fully token-themed.
- Charts take colors as `var(--color-*)` props, never literals.

## Component + code conventions

- **shadcn / base-ui primitives** live in `@repo/ui` (`@repo/ui/components/*`). Reuse them;
  don't re-implement buttons, inputs, badges, etc.
- Merge classes with `cn` from `@repo/ui/lib/utils`.
- **Icons:** `lucide-react`, sized with `size-*`, `strokeWidth={1.8}` in chrome/shell.
- **Separate data from layout.** Aggregation/derivation logic lives in a `data.ts`
  (e.g. `modules/dashboard/data.ts`); components only render. Mark any synthetic/placeholder
  data explicitly in comments.
- **UI copy is Indonesian.** Labels, section titles, helper text — all Bahasa Indonesia.
  Format currency/dates with the `formatCurrency` / `formatDate` helpers from
  `@repo/sip-domain` (`id-ID` locale).
- Typography scale leans small: section titles `text-sm font-medium`, metadata
  `text-xs text-muted-foreground`, headline numbers `text-2xl font-semibold tabular-nums`.

## Chrome (shell) specifics

- The app shell (`apps/admin/src/routes/__root.tsx`) is fully tokenized: dark green
  `bg-sidebar`, token-based header. Keep it that way.
- Header holds the page title + primary action only — **no global search input, no login
  button** in the top bar.

## Dark mode

Tokens for `.dark` already exist and are green-themed. There's no toggle wired yet, but
because everything is token-driven, adding `class="dark"` on the root will Just Work —
so keep using tokens and don't introduce anything that assumes light mode.
