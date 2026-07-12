// Pengaturan data layer: org settings, amil users, and the Had Kifayah regional index
// master. Grouped here because they all live on the Pengaturan page.
import { toast } from "@repo/ui/components/sonner";
import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import type { InferRequestType, InferResponseType } from "@repo/api-client";
import { api, unwrap } from "../../lib/api";

// ── Org settings ─────────────────────────────────────────────────────────────

const settingsIndex = api.settings.$get;
export type SettingsResponse = InferResponseType<typeof settingsIndex, 200>;
export type OrgSettings = SettingsResponse["settings"];
export type SettingsInput = InferRequestType<typeof api.settings.$patch>["json"];

export const settingsKey = ["settings"] as const;

export const settingsQueryOptions = queryOptions({
  queryKey: settingsKey,
  queryFn: async () => {
    const data = await unwrap<SettingsResponse>(await api.settings.$get());
    return data.settings;
  },
});

export function useSettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SettingsInput) =>
      unwrap<SettingsResponse>(await api.settings.$patch({ json: input })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKey }),
    onError: (error) => toast.error(error.message),
  });
}

// ── Approval per tahap (super_admin only) ────────────────────────────────────

const approvalsIndex = api.settings.approvals.$get;
export type ApprovalsResponse = InferResponseType<typeof approvalsIndex, 200>;
// Request shape is the canonical one (role-literal arrays) so the same type feeds the
// editor draft and the PUT payload.
export type StageApprovals = InferRequestType<typeof api.settings.approvals.$put>["json"];
export type WorkflowStage = keyof StageApprovals;

export const approvalsKey = ["settings", "approvals"] as const;

export const approvalsQueryOptions = queryOptions({
  queryKey: approvalsKey,
  queryFn: async () => {
    const data = await unwrap<ApprovalsResponse>(await api.settings.approvals.$get());
    return data.approvals as StageApprovals;
  },
});

export function useApprovalsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: StageApprovals) =>
      unwrap<ApprovalsResponse>(await api.settings.approvals.$put({ json: input })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: approvalsKey }),
    onError: (error) => toast.error(error.message),
  });
}

// ── Amil users ───────────────────────────────────────────────────────────────

const usersIndex = api.users.$get;
export type UsersResponse = InferResponseType<typeof usersIndex, 200>;
export type AmilUser = UsersResponse["users"][number];
export type AmilCreateInput = InferRequestType<typeof api.users.$post>["json"];
export type SipRole = "super_admin" | "admin" | "pengurus" | "verifikator";

export const roleLabels: Record<SipRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  pengurus: "Pengurus",
  verifikator: "Verifikator",
};

export const usersKey = ["amil-users"] as const;

export function usersQueryOptions(filter?: { role?: SipRole; active?: boolean }) {
  return queryOptions({
    queryKey: [...usersKey, filter ?? {}],
    queryFn: async () => {
      const data = await unwrap<UsersResponse>(
        await api.users.$get({
          query: {
            role: filter?.role,
            active: filter?.active === undefined ? undefined : filter.active ? "true" : "false",
          },
        }),
      );
      return data.users;
    },
  });
}

export function useAmilMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: usersKey });

  const create = useMutation({
    mutationFn: async (input: AmilCreateInput) =>
      unwrap<{ user: AmilUser }>(await api.users.$post({ json: input })),
    onSuccess: invalidate,
    onError: (error) => toast.error(error.message),
  });

  const update = useMutation({
    mutationFn: async ({
      id,
      ...input
    }: {
      id: string;
      name?: string;
      role?: SipRole;
      phone?: string;
      region?: string;
      active?: boolean;
    }) => unwrap<{ user: AmilUser }>(await api.users[":id"].$patch({ param: { id }, json: input })),
    onSuccess: invalidate,
    onError: (error) => toast.error(error.message),
  });

  return { create, update };
}

// ── Regional index ───────────────────────────────────────────────────────────

const regionsIndex = api.regions.$get;
export type RegionsResponse = InferResponseType<typeof regionsIndex, 200>;
export type Region = RegionsResponse["regions"][number];
export type RegionInput = InferRequestType<typeof api.regions.$post>["json"];

export const regionsKey = ["regions"] as const;

export const regionsQueryOptions = queryOptions({
  queryKey: regionsKey,
  queryFn: async () => {
    const data = await unwrap<RegionsResponse>(await api.regions.$get());
    return data.regions;
  },
});

export function useRegionMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: regionsKey });

  const create = useMutation({
    mutationFn: async (input: RegionInput) =>
      unwrap<{ region: Region }>(await api.regions.$post({ json: input })),
    onSuccess: invalidate,
    onError: (error) => toast.error(error.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...input }: Partial<RegionInput> & { id: string }) =>
      unwrap<{ region: Region }>(await api.regions[":id"].$patch({ param: { id }, json: input })),
    onSuccess: invalidate,
    onError: (error) => toast.error(error.message),
  });

  return { create, update };
}
