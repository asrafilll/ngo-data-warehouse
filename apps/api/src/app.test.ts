import { describe, expect, it } from "vitest";
import { app } from "./app";

describe("api app", () => {
  it("returns health status", async () => {
    const response = await app.request("/health");

    await expect(response.json()).resolves.toEqual({
      ok: true,
      service: "api",
    });
    expect(response.status).toBe(200);
  });

  it("protects manual approval SIP user sync", async () => {
    const response = await app.request("/users/sync");

    await expect(response.json()).resolves.toEqual({ error: "forbidden" });
    expect(response.status).toBe(403);
  });
});
