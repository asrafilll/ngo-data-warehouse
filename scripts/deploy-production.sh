#!/usr/bin/env bash

set -Eeuo pipefail

readonly app_dir="${SIP_DEPLOY_DIR:-/home/kiddie/apps/sip-manajemen}"
readonly lock_file="${TMPDIR:-/tmp}/sip-manajemen-production-deploy.lock"

cd "$app_dir"

if [[ ! -f .env.production ]]; then
  echo "Missing $app_dir/.env.production" >&2
  exit 1
fi

env_mode="$(stat -c '%a' .env.production)"
if [[ "$env_mode" != "600" ]]; then
  echo ".env.production must have mode 600; found $env_mode" >&2
  exit 1
fi

exec 9>"$lock_file"
if ! flock -n 9; then
  echo "Another SIP production deployment is already running." >&2
  exit 1
fi

compose=(docker compose --env-file .env.production -f docker-compose.yaml)

show_failure_context() {
  local exit_code=$?
  echo "Deployment failed with exit code $exit_code." >&2
  "${compose[@]}" ps >&2 || true
  "${compose[@]}" logs --tail 120 api admin worker >&2 || true
  exit "$exit_code"
}
trap show_failure_context ERR

wait_for_url() {
  local name="$1"
  local url="$2"

  for _ in $(seq 1 30); do
    if curl --fail --silent --show-error --max-time 5 "$url" >/dev/null 2>&1; then
      echo "$name is ready."
      return 0
    fi
    sleep 2
  done

  echo "$name did not become ready: $url" >&2
  return 1
}

echo "Validating production configuration."
"${compose[@]}" config --quiet

echo "Building application image."
"${compose[@]}" build api

echo "Ensuring stateful services are healthy."
"${compose[@]}" up -d --wait --wait-timeout 120 postgres redis minio

echo "Applying pending Prisma migrations."
"${compose[@]}" run --rm --no-deps api \
  pnpm --filter @repo/api exec prisma migrate deploy

echo "Recreating application services."
"${compose[@]}" up -d --force-recreate --remove-orphans api admin worker

api_address="$("${compose[@]}" port api 8000)"
admin_address="$("${compose[@]}" port admin 4000)"
minio_address="$("${compose[@]}" port minio 9000)"

wait_for_url "API" "http://${api_address}/health"
wait_for_url "Admin" "http://${admin_address}/"
wait_for_url "MinIO" "http://${minio_address}/minio/health/live"

for service in api admin worker postgres redis minio; do
  container_id="$("${compose[@]}" ps -q "$service")"
  if [[ -z "$container_id" ]] || [[ "$(docker inspect -f '{{.State.Running}}' "$container_id")" != "true" ]]; then
    echo "Service $service is not running." >&2
    exit 1
  fi
done

trap - ERR
"${compose[@]}" ps
echo "Deployment ${DEPLOY_SHA:-unknown} completed successfully."
