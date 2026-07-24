import { describe, expect, it } from "vitest";
import { connection, processApprovalSipUserSyncJob, processExampleJob } from "./index";

describe("worker", () => {
  it("uses configured redis connection", () => {
    expect(connection).toEqual(expect.objectContaining({ maxRetriesPerRequest: null }));
  });

  it("processes example jobs", async () => {
    const result = await processExampleJob({
      data: { message: "hello" },
      id: "job-1",
    });

    expect(Date.parse(result.processedAt)).not.toBeNaN();
  });

  it("runs approval SIP user sync through the protected GET API", async () => {
    let requestedUrl = "";
    let requestedKey = "";
    const result = await processApprovalSipUserSyncJob(
      {
        data: { trigger: "scheduled" },
        id: "sync-job-1",
      },
      {
        apiKey: "test-sync-key",
        internalApiUrl: "http://api.test:8000",
        fetchImpl: async (input, init) => {
          requestedUrl = input.toString();
          requestedKey = new Headers(init?.headers).get("x-user-sync-key") ?? "";
          return new Response(
            JSON.stringify({
              success: true,
              source: "approval-sip",
              fetched: 8,
              created: 2,
              updated: 5,
              deactivated: 1,
              syncedAt: "2026-07-23T02:00:00.000Z",
            }),
            { headers: { "content-type": "application/json" }, status: 200 },
          );
        },
      },
    );

    expect(requestedUrl).toBe("http://api.test:8000/users/sync");
    expect(requestedKey).toBe("test-sync-key");
    expect(result).toEqual(
      expect.objectContaining({
        fetched: 8,
        created: 2,
        updated: 5,
        deactivated: 1,
      }),
    );
  });
});
