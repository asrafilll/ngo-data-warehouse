import { loggerConfig, redisConfig, userSyncConfig } from "@repo/config";
import { createLogger } from "@repo/logger";
import { Queue, QueueEvents, Worker, type ConnectionOptions, type Job } from "bullmq";

export const logger = createLogger({
  ...loggerConfig,
  service: "worker",
});

export const connection: ConnectionOptions = {
  url: redisConfig.url,
  maxRetriesPerRequest: null,
};

export type ExampleJob = {
  message: string;
};

export type ApprovalSipUserSyncJob = {
  trigger: "scheduled";
};

export type ApprovalSipUserSyncResult = {
  success: true;
  source: "approval-sip";
  fetched: number;
  created: number;
  updated: number;
  deactivated: number;
  syncedAt: string;
};

let exampleQueue: Queue<ExampleJob> | null = null;
let exampleQueueEvents: QueueEvents | null = null;
let userSyncQueue: Queue<ApprovalSipUserSyncJob, ApprovalSipUserSyncResult> | null = null;

const userSyncQueueName = "approval-sip-user-sync";
const userSyncSchedulerId = "daily-approval-sip-user-sync";

export function getExampleQueue() {
  exampleQueue ??= new Queue<ExampleJob>("example", {
    connection,
  });

  return exampleQueue;
}

export function getExampleQueueEvents() {
  exampleQueueEvents ??= new QueueEvents("example", {
    connection,
  });

  return exampleQueueEvents;
}

export async function processExampleJob(job: Pick<Job<ExampleJob>, "data" | "id">) {
  logger.info({ jobId: job.id, message: job.data.message }, "Processing job");

  return { processedAt: new Date().toISOString() };
}

export function startExampleWorker() {
  return new Worker<ExampleJob>("example", processExampleJob, { connection });
}

export function getUserSyncQueue() {
  userSyncQueue ??= new Queue<ApprovalSipUserSyncJob, ApprovalSipUserSyncResult>(
    userSyncQueueName,
    { connection },
  );
  return userSyncQueue;
}

export async function scheduleApprovalSipUserSync() {
  if (!userSyncConfig.enabled) return null;

  return getUserSyncQueue().upsertJobScheduler(
    userSyncSchedulerId,
    {
      pattern: userSyncConfig.cron,
      tz: userSyncConfig.timezone,
    },
    {
      name: "sync-users",
      data: { trigger: "scheduled" },
      opts: {
        attempts: 3,
        backoff: { type: "exponential", delay: 60_000 },
        removeOnComplete: 30,
        removeOnFail: 90,
      },
    },
  );
}

export async function processApprovalSipUserSyncJob(
  job: Pick<Job<ApprovalSipUserSyncJob>, "data" | "id">,
  options: {
    apiKey?: string;
    fetchImpl?: typeof fetch;
    internalApiUrl?: string;
  } = {},
) {
  const apiKey = options.apiKey ?? userSyncConfig.apiKey;
  const internalApiUrl = options.internalApiUrl ?? userSyncConfig.internalApiUrl;
  const fetchImpl = options.fetchImpl ?? fetch;

  if (!apiKey) {
    throw new Error("USER_SYNC_API_KEY belum dikonfigurasi.");
  }

  const response = await fetchImpl(new URL("/users/sync", internalApiUrl), {
    headers: { "x-user-sync-key": apiKey },
    redirect: "error",
    signal: AbortSignal.timeout(5 * 60_000),
  });
  if (!response.ok) {
    throw new Error(`Sinkronisasi pengguna gagal dengan status ${response.status}.`);
  }

  const result = parseUserSyncResult(await response.json());
  logger.info(
    {
      created: result.created,
      deactivated: result.deactivated,
      fetched: result.fetched,
      jobId: job.id,
      updated: result.updated,
    },
    "Approval SIP user sync completed",
  );
  return result;
}

export function startApprovalSipUserSyncWorker() {
  return new Worker<ApprovalSipUserSyncJob, ApprovalSipUserSyncResult>(
    userSyncQueueName,
    (job) => processApprovalSipUserSyncJob(job),
    { connection },
  );
}

export async function runWorker() {
  const exampleWorker = startExampleWorker();
  const userSyncWorker = startApprovalSipUserSyncWorker();

  exampleWorker.on("completed", (job) => {
    logger.info({ jobId: job.id }, "Job completed");
  });

  exampleWorker.on("failed", (job, error) => {
    logger.error({ error, jobId: job?.id }, "Job failed");
  });

  userSyncWorker.on("failed", (job, error) => {
    logger.error({ error, jobId: job?.id }, "Approval SIP user sync failed");
  });

  const scheduledJob = await scheduleApprovalSipUserSync();
  if (scheduledJob) {
    logger.info(
      {
        cron: userSyncConfig.cron,
        nextRunAt: new Date(scheduledJob.timestamp + (scheduledJob.delay ?? 0)).toISOString(),
        timezone: userSyncConfig.timezone,
      },
      "Approval SIP user sync scheduled",
    );
  } else {
    logger.warn("Approval SIP user sync is disabled because USER_SYNC_API_KEY is not configured");
  }

  return { exampleWorker, userSyncWorker };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await runWorker();
}

function parseUserSyncResult(payload: unknown): ApprovalSipUserSyncResult {
  if (!payload || typeof payload !== "object") {
    throw new Error("Respons sinkronisasi pengguna tidak valid.");
  }

  const result = payload as Partial<ApprovalSipUserSyncResult>;
  const counts = [result.fetched, result.created, result.updated, result.deactivated];
  if (
    result.success !== true ||
    result.source !== "approval-sip" ||
    !result.syncedAt ||
    Number.isNaN(Date.parse(result.syncedAt)) ||
    counts.some((count) => typeof count !== "number" || !Number.isInteger(count) || count < 0)
  ) {
    throw new Error("Respons sinkronisasi pengguna tidak valid.");
  }

  return result as ApprovalSipUserSyncResult;
}
