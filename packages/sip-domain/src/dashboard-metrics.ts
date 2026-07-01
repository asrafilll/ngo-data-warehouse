import { aidCases } from "./aid-cases";
import { donors } from "./donors";
import type { ModuleSummary } from "./types";

export const moduleSummaries: ModuleSummary[] = [
  {
    key: "bantuan",
    label: "Data Bantuan",
    description: "Pengajuan, verifikasi, approval, dan penyaluran.",
    total: aidCases.length,
    active: aidCases.filter((item) => item.status !== "completed" && item.status !== "rejected")
      .length,
    owner: "Operasional",
  },
  {
    key: "mustahik",
    label: "Data Mustahik",
    description: "Profil penerima manfaat, keluarga, wilayah, dan histori bantuan.",
    total: aidCases.length,
    active: aidCases.filter((item) => item.aidType === "rutin_bulanan").length,
    owner: "Admin data",
  },
  {
    key: "donatur",
    label: "Data Donatur",
    description: "Kontak donatur, histori donasi, komitmen rutin, dan preferensi program.",
    total: donors.length,
    active: donors.filter((item) => item.status === "Aktif").length,
    owner: "Fundraising",
  },
  {
    key: "program",
    label: "Program SIP",
    description: "Kesehatan, pendidikan, kebutuhan pokok, anak asuh, dan program lain.",
    total: 7,
    active: 6,
    owner: "Pengurus",
  },
];

export const verifierDrafts = [
  {
    id: "draft-001",
    title: "Verifikasi Siti Aminah",
    updatedAt: "Disimpan lokal 18 menit lalu",
    completion: 82,
    missing: "Bukti foto serah terima",
  },
  {
    id: "draft-002",
    title: "Pengajuan calon mustahik Cibinong",
    updatedAt: "Disimpan lokal kemarin",
    completion: 46,
    missing: "Data pelapor dan SKTM",
  },
];

export const dashboardMetrics = [
  {
    label: "Pengajuan aktif",
    value: aidCases.filter((item) => item.status !== "completed" && item.status !== "rejected")
      .length,
    helper: "Kasus berjalan",
  },
  {
    label: "Menunggu keputusan",
    value: aidCases.filter((item) => item.status === "surveyed").length,
    helper: "Sudah diverifikasi",
  },
  {
    label: "Siap disalurkan",
    value: aidCases.filter((item) => item.status === "disbursement_pending").length,
    helper: "Butuh bukti penyaluran",
  },
  {
    label: "Rekomendasi bulan ini",
    value: aidCases.reduce((total, item) => total + item.hadKifayah.recommendedAid, 0),
    helper: "Total estimasi",
    currency: true,
  },
];
