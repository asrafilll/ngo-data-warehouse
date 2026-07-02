import { toast } from "@repo/ui/components/sonner";
import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import type { InferResponseType } from "@repo/api-client";
import { api, unwrap } from "../../lib/api";

const rosterIndex = api.rutin.roster.$get;
export type RosterResponse = InferResponseType<typeof rosterIndex, 200>;
export type RosterRow = RosterResponse["roster"][number];

export const rutinKey = ["rutin"] as const;

// Periode berjalan + 2 bulan ke belakang — roster carries over month to month.
export function buildPeriods(count = 3) {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(d);
    return { key, label };
  });
}

export function rosterQueryOptions(programId: string, period: string) {
  return queryOptions({
    queryKey: [...rutinKey, "roster", programId, period],
    queryFn: async () => {
      const data = await unwrap<RosterResponse>(
        await api.rutin.roster.$get({ query: { programId, period } }),
      );
      return data.roster;
    },
    enabled: programId !== "",
  });
}

export function useRutinMutations(programId: string, period: string) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: rutinKey });

  const add = useMutation({
    mutationFn: async (input: { name: string; region: string; nik: string; nominal: number }) =>
      unwrap<{ beneficiary: unknown }>(
        await api.rutin.roster.$post({ json: { ...input, programId, since: period } }),
      ),
    onSuccess: invalidate,
    onError: (error) => toast.error(error.message),
  });

  const toggle = useMutation({
    mutationFn: async (input: { beneficiaryId: string; disbursed: boolean }) =>
      unwrap<{ ok: boolean }>(await api.rutin.disburse.$post({ json: { ...input, period } })),
    onSuccess: invalidate,
    onError: (error) => toast.error(error.message),
  });

  const disburseAll = useMutation({
    mutationFn: async () =>
      unwrap<{ ok: boolean; count: number }>(
        await api.rutin["disburse-all"].$post({ json: { programId, period } }),
      ),
    onSuccess: invalidate,
    onError: (error) => toast.error(error.message),
  });

  return { add, toggle, disburseAll };
}
