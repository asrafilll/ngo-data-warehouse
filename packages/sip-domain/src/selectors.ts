import { aidCases } from "./aid-cases";
import { sipUsers } from "./users";
import { workflowSteps } from "./workflow";
import type { AidCase, Applicant, WorkflowStatus } from "./types";

export function getMonthlyIncome(applicant: Applicant) {
  if (applicant.incomePeriod === "per hari") {
    return applicant.incomeAmount * 26;
  }

  if (applicant.incomePeriod === "per pekan") {
    return applicant.incomeAmount * 4;
  }

  return applicant.incomeAmount;
}

export function getStatusProgress(status: WorkflowStatus) {
  const index = workflowSteps.findIndex((step) => step.status === status);

  if (status === "completed") {
    return 100;
  }

  if (status === "rejected") {
    return 20;
  }

  if (status === "needs_revision") {
    return 15;
  }

  return Math.max(8, Math.round(((index + 1) / workflowSteps.length) * 100));
}

export function getAssignedVerifier(caseItem: AidCase) {
  return sipUsers.find((user) => user.id === caseItem.assignedVerifierId);
}

export function getCasesByStatus(status: WorkflowStatus) {
  return aidCases.filter((item) => item.status === status);
}

export function getCaseById(id: string) {
  return aidCases.find((item) => item.id === id) ?? aidCases[0];
}
