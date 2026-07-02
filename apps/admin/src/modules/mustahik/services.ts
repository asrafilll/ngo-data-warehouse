import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import type { InferResponseType } from "@repo/api-client";
import { api, unwrap } from "../../lib/api";

const mustahikIndex = api.mustahik.$get;
export type MustahikResponse = InferResponseType<typeof mustahikIndex, 200>;
export type MustahikRow = MustahikResponse["rows"][number];

export const mustahikKey = ["mustahik"] as const;

export function mustahikQueryOptions(query: { q?: string; isRutin?: string; page?: number }) {
  return queryOptions({
    queryKey: [...mustahikKey, query],
    queryFn: async () =>
      unwrap<MustahikResponse>(
        await api.mustahik.$get({
          query: {
            q: query.q || undefined,
            isRutin:
              query.isRutin === "true" || query.isRutin === "false" ? query.isRutin : undefined,
            page: query.page ? String(query.page) : undefined,
          },
        }),
      ),
    placeholderData: keepPreviousData,
  });
}
