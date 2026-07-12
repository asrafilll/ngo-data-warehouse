import type { InferRequestType, InferResponseType } from "@repo/api-client";
import { api, unwrap } from "../../lib/api";
import { toWebp } from "../../lib/webp";

const casesIndex = api.cases.$get;
const caseDetail = api.cases[":id"].$get;

export type CaseListResponse = InferResponseType<typeof casesIndex, 200>;
export type CaseListRow = CaseListResponse["rows"][number];
export type CaseListQuery = InferRequestType<typeof casesIndex>["query"];
export type CaseDetailResponse = InferResponseType<typeof caseDetail, 200>;
export type CaseDetail = CaseDetailResponse["case"];
export type CaseIntakeInput = InferRequestType<typeof api.cases.$post>["json"];
export type CaseUpdateInput = InferRequestType<(typeof api.cases)[":id"]["$patch"]>["json"];
export type VerificationInput = InferRequestType<
  (typeof api.cases)[":id"]["verification"]["$post"]
>["json"];

export async function listCases(query: CaseListQuery) {
  return unwrap<CaseListResponse>(await api.cases.$get({ query }));
}

export async function getCase(id: string) {
  const data = await unwrap<CaseDetailResponse>(await api.cases[":id"].$get({ param: { id } }));
  return data.case;
}

export async function intakeCase(input: CaseIntakeInput) {
  const data = await unwrap<CaseDetailResponse>(await api.cases.$post({ json: input }));
  return data.case;
}

// Perbaikan data pengajuan (needs_revision → submitted).
export async function updateCase(id: string, input: CaseUpdateInput) {
  const data = await unwrap<CaseDetailResponse>(
    await api.cases[":id"].$patch({ param: { id }, json: input }),
  );
  return data.case;
}

// Buka kembali kasus yang ditolak.
export async function reopenCase(id: string) {
  const data = await unwrap<CaseDetailResponse>(
    await api.cases[":id"].reopen.$post({ param: { id } }),
  );
  return data.case;
}

export async function triageCase(
  id: string,
  decision: "approve" | "needs_revision" | "reject",
  note = "",
) {
  const data = await unwrap<CaseDetailResponse>(
    await api.cases[":id"].triage.$post({ param: { id }, json: { decision, note } }),
  );
  return data.case;
}

export async function assignVerifier(id: string, verifierId: string) {
  const data = await unwrap<CaseDetailResponse>(
    await api.cases[":id"].assign.$post({ param: { id }, json: { verifierId, note: "" } }),
  );
  return data.case;
}

export async function submitVerification(id: string, input: VerificationInput) {
  const data = await unwrap<CaseDetailResponse>(
    await api.cases[":id"].verification.$post({ param: { id }, json: input }),
  );
  return data.case;
}

export async function decideCase(
  id: string,
  input: { decision: "approve" | "reject"; nominal?: number; note?: string },
) {
  const data = await unwrap<CaseDetailResponse>(
    await api.cases[":id"].decision.$post({
      param: { id },
      json: { note: "", ...input },
    }),
  );
  return data.case;
}

// nominal omitted on purpose: the API disburses the approved decisionNominal.
export async function disburseCase(id: string, input: { buktiKey: string }) {
  const data = await unwrap<CaseDetailResponse>(
    await api.cases[":id"].disburse.$post({ param: { id }, json: { note: "", ...input } }),
  );
  return data.case;
}

// Compress → convert to WebP → presign → PUT. Returns the storage key to attach to the
// verification / disbursement payload.
export async function uploadCasePhoto(
  caseId: string,
  kind: "hunian" | "penyaluran" | "dokumen",
  file: File,
) {
  const blob = await toWebp(file);
  const presign = await unwrap<{ key: string; url: string; contentType: string }>(
    await api.uploads.presign.$post({ json: { caseId, kind, fileName: file.name } }),
  );

  const put = await fetch(presign.url, {
    method: "PUT",
    body: blob,
    headers: { "Content-Type": presign.contentType },
  });
  if (!put.ok) throw new Error("Unggah foto gagal.");

  return presign.key;
}
