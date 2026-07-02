import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import type { InferResponseType } from "@repo/api-client";
import { api, unwrap } from "../../lib/api";

const donorsIndex = api.donors.$get;
export type DonorsResponse = InferResponseType<typeof donorsIndex, 200>;
export type Donor = DonorsResponse["donors"][number];

export const donorsKey = ["donors"] as const;

export function donorsQueryOptions(query: {
  q?: string;
  status?: string;
  type?: string;
  page?: number;
}) {
  return queryOptions({
    queryKey: [...donorsKey, query],
    queryFn: async () =>
      unwrap<DonorsResponse>(
        await api.donors.$get({
          query: {
            q: query.q || undefined,
            status: query.status || undefined,
            type: query.type || undefined,
            page: query.page ? String(query.page) : undefined,
          },
        }),
      ),
    placeholderData: keepPreviousData,
  });
}
