import { queryOptions } from "@tanstack/react-query";
import type { InferResponseType } from "@repo/api-client";
import { api, unwrap } from "../../lib/api";

const factsIndex = api.reports["case-facts"].$get;
export type CaseFactsResponse = InferResponseType<typeof factsIndex, 200>;
export type CaseFact = CaseFactsResponse["facts"][number];

export const caseFactsQueryOptions = queryOptions({
  queryKey: ["reports", "case-facts"],
  queryFn: async () => {
    const data = await unwrap<CaseFactsResponse>(await api.reports["case-facts"].$get());
    return data.facts;
  },
});
