import { redisConfig } from "@repo/config";
import { Queue, QueueEvents, Worker, type ConnectionOptions } from "bullmq";

export const connection: ConnectionOptions = {
  url: redisConfig.url,
  maxRetriesPerRequest: null,
};

export type ExampleJob = {
  message: string;
};

export const exampleQueue = new Queue<ExampleJob>("example", {
  connection,
});

export const exampleQueueEvents = new QueueEvents("example", {
  connection,
});

export function startExampleWorker() {
  return new Worker<ExampleJob>(
    "example",
    async (job) => {
      console.log(`Processing job ${job.id}: ${job.data.message}`);
      return { processedAt: new Date().toISOString() };
    },
    { connection },
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const worker = startExampleWorker();

  worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed`);
  });

  worker.on("failed", (job, error) => {
    console.error(`Job ${job?.id} failed`, error);
  });
}
