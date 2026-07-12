import type { VerificationPriority, WorkflowStatus } from "./types";

export const statusLabels: Record<WorkflowStatus, string> = {
  submitted: "Pengajuan Baru",
  approved_for_verification: "Siap Disurvei",
  assigned: "Ditugaskan",
  surveyed: "Sudah Verifikasi",
  approved: "Disetujui",
  rejected: "Ditolak",
  disbursement_pending: "Menunggu Salur",
  completed: "Selesai",
  needs_revision: "Perlu Revisi",
};

export const statusTone: Record<WorkflowStatus, string> = {
  submitted: "border-sky-200 bg-sky-50 text-sky-800",
  approved_for_verification: "border-indigo-200 bg-indigo-50 text-indigo-800",
  assigned: "border-violet-200 bg-violet-50 text-violet-800",
  surveyed: "border-amber-200 bg-amber-50 text-amber-800",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-800",
  rejected: "border-rose-200 bg-rose-50 text-rose-800",
  disbursement_pending: "border-orange-200 bg-orange-50 text-orange-800",
  completed: "border-zinc-200 bg-zinc-100 text-zinc-800",
  needs_revision: "border-yellow-200 bg-yellow-50 text-yellow-800",
};

export const priorityLabels: Record<VerificationPriority, string> = {
  urgent: "Prioritas",
  normal: "Normal",
  monitor: "Pantau",
};

// `approved` is intentionally absent: decision moves surveyed → disbursement_pending
// directly, so the enum value only survives for legacy rows.
export const workflowSteps: Array<{ status: WorkflowStatus; label: string }> = [
  { status: "submitted", label: "Pengajuan" },
  { status: "approved_for_verification", label: "Triase" },
  { status: "assigned", label: "Penugasan" },
  { status: "surveyed", label: "Verifikasi" },
  { status: "disbursement_pending", label: "Penyaluran" },
  { status: "completed", label: "Selesai" },
];
