import { toast } from "@repo/ui/components/sonner";
import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import type { InferResponseType } from "@repo/api-client";
import { api, unwrap } from "../../lib/api";

const programsIndex = api.programs.$get;
export type ProgramsResponse = InferResponseType<typeof programsIndex, 200>;
export type Program = ProgramsResponse["programs"][number];
export type ProgramType = Program["type"];

export const programTypeLabels: Record<ProgramType, string> = {
  insidental: "Insidental",
  rutin: "Rutin bulanan",
};

export const programsKey = ["programs"] as const;

export function programsQueryOptions(filter?: { type?: ProgramType; active?: boolean }) {
  return queryOptions({
    queryKey: [...programsKey, filter ?? {}],
    queryFn: async () => {
      const data = await unwrap<ProgramsResponse>(
        await api.programs.$get({
          query: {
            type: filter?.type,
            active: filter?.active === undefined ? undefined : filter.active ? "true" : "false",
          },
        }),
      );
      return data.programs;
    },
  });
}

export type ProgramInput = {
  name: string;
  type: ProgramType;
  description: string;
  active: boolean;
  defaultNominal?: number | null;
};

export function useProgramMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: programsKey });

  const create = useMutation({
    mutationFn: async (input: ProgramInput) =>
      unwrap<{ program: Program }>(await api.programs.$post({ json: input })),
    onSuccess: invalidate,
    onError: (error) => toast.error(error.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...input }: Partial<ProgramInput> & { id: string }) =>
      unwrap<{ program: Program }>(
        await api.programs[":id"].$patch({ param: { id }, json: input }),
      ),
    onSuccess: invalidate,
    onError: (error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) =>
      unwrap<{ deleted: boolean; deactivated: boolean }>(
        await api.programs[":id"].$delete({ param: { id } }),
      ),
    onSuccess: invalidate,
    onError: (error) => toast.error(error.message),
  });

  return { create, update, remove };
}
