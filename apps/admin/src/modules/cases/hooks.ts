import { toast } from "@repo/ui/components/sonner";
import { keepPreviousData, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  assignVerifier,
  decideCase,
  disburseCase,
  getCase,
  intakeCase,
  listCases,
  submitVerification,
  triageCase,
  type CaseIntakeInput,
  type CaseListQuery,
  type VerificationInput,
} from "./services";

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
    mutationFn: (input: { nominal: number; buktiKey: string }) => disburseCase(caseId, input),
    onSuccess: invalidate,
    onError: (error) => toast.error(error.message),
  });
}
