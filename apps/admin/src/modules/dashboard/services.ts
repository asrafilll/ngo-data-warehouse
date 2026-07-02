import type { InferResponseType } from "@repo/api-client";
import { queryOptions } from "@tanstack/react-query";
import { api, unwrap } from "../../lib/api";

const dashboardIndex = api.reports.dashboard.$get;
export type DashboardResponse = InferResponseType<typeof dashboardIndex, 200>;
export type DashboardData = DashboardResponse["dashboard"];

export const dashboardQueryOptions = queryOptions({
  queryKey: ["reports", "dashboard"],
  queryFn: async () => {
    const data = await unwrap<DashboardResponse>(await api.reports.dashboard.$get());
    return data.dashboard;
  },
});
