// Shared typed API client (hono hc against @repo/api AppType). All module services go
// through this instance so cookies/session behave consistently.
import { createApiClient } from "@repo/api-client";

export const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export const api = createApiClient(apiBaseUrl);

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Unwraps a hono client response; surfaces the API's Indonesian `message` when present.
export async function unwrap<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Permintaan gagal (${response.status}).`;
    try {
      const body = (await response.json()) as { message?: string; error?: string };
      message = body.message ?? body.error ?? message;
    } catch {
      // non-JSON error body — keep default message
    }
    throw new ApiError(response.status, message);
  }
  return (await response.json()) as T;
}
