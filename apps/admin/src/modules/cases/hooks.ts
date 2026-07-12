import { toast } from "@repo/ui/components/sonner";
import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { meQueryOptions } from "../auth/hooks/use-auth";
import { approvalsQueryOptions, type WorkflowStage } from "../pengaturan/services";
import {
  assignVerifier,
  decideCase,
  disburseCase,
  getCase,
  intakeCase,
  listCases,
  reopenCase,
  submitVerification,
  triageCase,
  updateCase,
  type CaseIntakeInput,
  type CaseListQuery,
  type CaseUpdateInput,
  type VerificationInput,
} from "./services";

// Mirrors the API guards: super_admin passes everything, otherwise the stage's
// configured roles (Pengaturan → Approval) decide. Used to hide actions the API would
// reject with 403 anyway.
export function useStagePermissions() {
  const { data: me } = useQuery(meQueryOptions);
  const { data: approvals } = useQuery(approvalsQueryOptions);
  const roles = (me?.role ?? "").split(",").filter(Boolean);
  const isSuperAdmin = roles.includes("super_admin");
  const isElevated = isSuperAdmin || roles.includes("admin") || roles.includes("pengurus");

  const can = (stage: WorkflowStage) => {
    if (isSuperAdmin) return true;
    if (!approvals) return false;
    return (approvals[stage] ?? []).some((role) => roles.includes(role));
  };

  return { can, roles, isElevated, meId: me?.id };
}

export const casesKey = ["cases"] as const;

export function casesQueryOptions(query: CaseListQuery) {
  return queryOptions({
    queryKey: [...casesKey, "list", query],
    queryFn: () => listCases(query),
    placeholderData: keepPreviousData,
  });
}

export function caseQueryOptions(id: string) {
  return queryOptions({
    queryKey: [...casesKey, "detail", id],
    queryFn: () => getCase(id),
  });
}

function useCaseInvalidation() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: casesKey });
}

export function useIntakeMutation() {
  const invalidate = useCaseInvalidation();
  return useMutation({
    mutationFn: (input: CaseIntakeInput) => intakeCase(input),
    onSuccess: invalidate,
    onError: (error) => toast.error(error.message),
  });
}

export function useCaseUpdateMutation(caseId: string) {
  const invalidate = useCaseInvalidation();
  return useMutation({
    mutationFn: (input: CaseUpdateInput) => updateCase(caseId, input),
    onSuccess: invalidate,
    onError: (error) => toast.error(error.message),
  });
}

export function useReopenMutation(caseId: string) {
  const invalidate = useCaseInvalidation();
  return useMutation({
    mutationFn: () => reopenCase(caseId),
    onSuccess: invalidate,
    onError: (error) => toast.error(error.message),
  });
}

export function useTriageMutation(caseId: string) {
  const invalidate = useCaseInvalidation();
  return useMutation({
    mutationFn: (input: { decision: "approve" | "needs_revision" | "reject"; note?: string }) =>
      triageCase(caseId, input.decision, input.note),
    onSuccess: invalidate,
    onError: (error) => toast.error(error.message),
  });
}

export function useAssignMutation(caseId: string) {
  const invalidate = useCaseInvalidation();
  return useMutation({
    mutationFn: (verifierId: string) => assignVerifier(caseId, verifierId),
    onSuccess: invalidate,
    onError: (error) => toast.error(error.message),
  });
}

export function useVerificationMutation(caseId: string) {
  const invalidate = useCaseInvalidation();
  return useMutation({
    mutationFn: (input: VerificationInput) => submitVerification(caseId, input),
    onSuccess: invalidate,
    onError: (error) => toast.error(error.message),
  });
}

export function useDecisionMutation(caseId: string) {
  const invalidate = useCaseInvalidation();
  return useMutation({
    mutationFn: (input: { decision: "approve" | "reject"; nominal?: number; note?: string }) =>
      decideCase(caseId, input),
    onSuccess: invalidate,
    onError: (error) => toast.error(error.message),
  });
}

export function useDisburseMutation(caseId: string) {
  const invalidate = useCaseInvalidation();
  return useMutation({
    mutationFn: (input: { buktiKey: string }) => disburseCase(caseId, input),
    onSuccess: invalidate,
    onError: (error) => toast.error(error.message),
  });
}
