# SKILLS.md

Step-by-step playbooks for common dev tasks in this repo. Conventions and rationale live
in **AGENTS.md** — read that first. Each skill lists the exact files to touch, in order.

---

## Skill: Add an API endpoint to an existing module

Files: `apps/api/src/modules/<name>/router.ts`

1. Define a Zod schema at the top of the file (follow existing naming: `<entity><Action>Schema`).
2. Add the route **chained** onto the existing `new Hono()...` expression — do not split
   the chain into statements or `AppType` inference (and the typed client) breaks.
3. Guard with `requireUser` or `requireRole(...)` from `../auth/middleware`.
4. Validate with `zValidator("json" | "query" | "param", schema)`; read via `c.req.valid(...)`.
5. Query through `prisma` from `../../utils/prisma`.
6. Consume it in the admin: types appear automatically on the `api` client — no codegen step.

Verify: `pnpm --filter @repo/api typecheck && pnpm --filter @repo/admin typecheck`
(admin typecheck catches response-shape breaks).

## Skill: Add a new API module

Files: `apps/api/src/modules/<name>/router.ts`, `apps/api/src/app.ts`

1. Create `src/modules/<name>/router.ts`, copying the shape of a small module
   (`donors/router.ts` is the cleanest reference): schemas → `export const <name>Router = new Hono<{ Variables: AuthVariables }>()` chain.
2. Split business logic into `services.ts` in the same folder if the router gets long
   (see `cases/` for the pattern: `router.ts` + `services.ts` + `schema.ts`).
3. Mount in `src/app.ts`: import + `.route("/<name>", <name>Router)` — keep it inside the
   chained expression.
4. Add tests next to the module (vitest; see `app.test.ts`).

## Skill: Add an admin feature module + page

Files: `apps/admin/src/modules/<name>/`, `apps/admin/src/routes/`

1. `modules/<name>/services.ts` — typed calls:
   ```ts
   import type { InferRequestType, InferResponseType } from "@repo/api-client";
   import { api, unwrap } from "../../lib/api";
   export type XListResponse = InferResponseType<typeof api.x.$get, 200>;
   export async function listX(query: XQuery) {
     return unwrap<XListResponse>(await api.x.$get({ query }));
   }
   ```
   Never hand-write DTO types.
2. `modules/<name>/hooks.ts` — React Query:
   - `export const <name>Key = ["<name>"] as const;`
   - `queryOptions()` factories for reads (`placeholderData: keepPreviousData` for lists).
   - Mutations: invalidate the key prefix `onSuccess`, `toast.error(error.message)` `onError`.
3. `modules/<name>/<name>-list.tsx` etc. — render-only components; derivation in `data.ts`.
4. Route file in `src/routes/` (TanStack file-based routing under the `_app` layout).
   Keep it thin: `useSuspenseQuery(<name>QueryOptions(...))` + render module component.
   `routeTree.gen.ts` regenerates via the Vite plugin on dev — never edit it by hand.
5. Add nav entry in the shell if needed (`routes/_app.tsx`).
6. UI copy in Bahasa Indonesia; tokens only (see AGENTS.md styling rules);
   `formatCurrency`/`formatDate` from `@repo/sip-domain`.

## Skill: Change the database schema

Files: `apps/api/prisma/schema.prisma`

1. Edit `schema.prisma`.
2. `pnpm db:migrate` — prompts for a migration name; creates + applies it (dev DB from
   `docker-compose.dev.yaml` must be up). Never use `db:push` for changes you intend to keep.
3. `pnpm db:generate` runs automatically on migrate; run manually if the client looks stale.
4. Update `apps/api/prisma/seed.ts` if the model is seeded.
5. Fix ripples: API routers → admin services (typecheck both, errors show the trail).

## Skill: Add or change a case workflow status

Files: `packages/sip-domain/src/types.ts`, `workflow.ts`; `apps/api/src/modules/cases/`

1. Add the status to `WorkflowStatus` in `sip-domain/src/types.ts`.
2. Add entries in `workflow.ts`: `statusLabels` (Indonesian), `statusTone`, and
   `workflowSteps` if it's on the main pipeline.
3. Update transition logic in `apps/api/src/modules/cases/services.ts` and the relevant
   router action; append a `CaseEvent` on transition (existing actions show the pattern).
4. UI picks labels/tones from sip-domain automatically — never inline status strings.
5. `pnpm typecheck` — the `Record<WorkflowStatus, ...>` types force completion of every map.

## Skill: File upload flow (photos, proof docs)

Never send file bytes through the API. Pattern (see `cases/services.ts` → `uploadCasePhoto`):

1. Client: compress with `toWebp` from `lib/webp.ts`.
2. `POST /uploads/presign` with `{ caseId, kind, fileName }` → `{ key, url, contentType }`.
3. `fetch(url, { method: "PUT", body: blob, headers: { "Content-Type": contentType } })`.
4. Store the returned `key` in the domain payload (verification / disbursement).
5. New upload kinds: extend the presign schema in `apps/api/src/modules/uploads/router.ts`.

## Skill: Add an env/config variable

Files: `.env.example`, `.env`, `packages/config/src/`

1. Add to `.env.example` (documented) and your local `.env`.
2. Add to the Zod schema in `@repo/config` — apps read config objects (`apiConfig` etc.),
   never `process.env` directly.
3. Production: also add to `.env.production` / compose files as appropriate.

## Skill: Add a background job

Files: `packages/worker/src/`

1. Define the queue/job with BullMQ in the worker (`packages/worker/src/main.ts` area).
2. Enqueue from the API using the same queue name; Redis connection comes from `@repo/config`.
3. Run locally: `pnpm --filter @repo/worker dev` (Redis via `docker-compose.dev.yaml`).

## Skill: Add a shared UI component

Files: `packages/ui/src/components/`

1. Check `@repo/ui/components/*` first — most shadcn primitives already exist.
2. New primitives go in `packages/ui`; feature-specific composites stay in the app's module.
3. Style with tokens only; merge classes with `cn` from `@repo/ui/lib/utils`.
4. Charts: extend `apps/admin/src/modules/dashboard/charts.tsx` SVG primitives — no chart libs.

## Skill: Pre-commit checklist

```sh
pnpm check:fix     # Biome — lint + format, auto-fix
pnpm typecheck     # all workspaces
pnpm test          # vitest where present
```

All three must pass. Biome config is `biome.json` at root; don't add ESLint/Prettier.

## Skill: Run the full stack locally

```sh
docker compose -f docker-compose.dev.yaml up -d   # Postgres :5432, Redis, MinIO :9000/:9001
pnpm db:generate && pnpm db:migrate
pnpm --filter @repo/api dev      # http://localhost:8000
pnpm --filter @repo/admin dev    # http://localhost:4000
pnpm --filter @repo/worker dev   # only if testing jobs
pnpm createsuperuser             # first login account
```

Reset DB: `docker compose -f docker-compose.dev.yaml down -v` then migrate + `pnpm --filter @repo/api db:seed`.

## Skill: Debug a broken typed API client

Symptom: `api.<x>` missing routes or typed `unknown` in the admin.

1. Check `apps/api/src/app.ts` — the router must be mounted inside the single chained expression.
2. Check the module router — routes must be chained on one `new Hono()` expression;
   a route added as a separate statement is invisible to `AppType`.
3. `pnpm --filter @repo/api typecheck` — an API type error collapses `AppType` and the whole
   client degrades at once.
4. Restart the admin dev TS server; `@repo/api-client` only re-exports `hc<AppType>`.
