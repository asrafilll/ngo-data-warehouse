# AGENTS.md

Conventions for working in this repo. This file documents the **styling preferences**
established for the SIP admin UI. Follow them for any new screen or component.

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
