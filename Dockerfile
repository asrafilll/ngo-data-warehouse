FROM node:22-alpine

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN apk add --no-cache openssl \
  && corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/admin/package.json apps/admin/package.json
COPY packages/api-client/package.json packages/api-client/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/i18n/package.json packages/i18n/package.json
COPY packages/logger/package.json packages/logger/package.json
COPY packages/sip-domain/package.json packages/sip-domain/package.json
COPY packages/storage/package.json packages/storage/package.json
COPY packages/telemetry/package.json packages/telemetry/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/worker/package.json packages/worker/package.json

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter @repo/api exec prisma generate

CMD ["pnpm", "dev"]
