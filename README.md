# Monorepo Template

pnpm workspace with:

- `apps/api`: Hono API on Node.js.
- `apps/platform`: React + Vite + TanStack Router file routes + TanStack Query.
- `apps/admin`: React + Vite + TanStack Router file routes + TanStack Query.
- `packages/config`: typed server-side environment config.
- `packages/i18n`: i18next setup shared by the frontend apps.
- `packages/storage`: S3-compatible object storage primitives.
- `packages/ui`: shadcn UI components shared by the apps.
- `packages/worker`: Redis + BullMQ worker primitives.

Packages are source-only: they export their `.ts`/`.tsx` files directly and do not have a build step.

## Setup

```sh
pnpm install
cp .env.example .env
docker compose -f docker-compose.dev.yaml up -d
pnpm db:generate
pnpm db:migrate
```

## Development

```sh
pnpm --filter @repo/api dev
pnpm --filter @repo/platform dev
pnpm --filter @repo/admin dev
pnpm --filter @repo/worker dev
```

## Storage

`packages/storage` exports S3-compatible helpers for AWS S3, MinIO, Cloudflare R2, DigitalOcean Spaces, and similar providers.

```ts
import { getStorageConfig } from "@repo/config";
import { createStorage } from "@repo/storage";

const storage = createStorage(getStorageConfig());

await storage.putObject({
  key: "uploads/example.txt",
  body: "hello",
  contentType: "text/plain",
});
```

Configure it with `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, and optional endpoint/path-style/public URL variables in `.env`.

## Docker

```sh
cp .env.example .env
docker compose up --build
```

This starts Postgres, Redis, API, Platform, Admin, and Worker. The Docker services still use the single root `.env`; `DOCKER_DATABASE_URL` and `DOCKER_REDIS_URL` point containers at the Compose service names. Postgres and Redis are internal-only in `docker-compose.yaml`; use `docker-compose.dev.yaml` when you want host access to those ports for local tooling.

The default local ports are:

- API: `http://localhost:8000`
- Platform: `http://localhost:3000`
- Admin: `http://localhost:4000`
- Postgres with `docker-compose.dev.yaml`: `localhost:15432`
- Redis with `docker-compose.dev.yaml`: `localhost:16379`
