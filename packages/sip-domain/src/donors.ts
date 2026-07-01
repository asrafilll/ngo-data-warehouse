import type { Donor } from "./types";

// Mock donor records for dashboard composition until the donor module is backed by API data.
export const donors: Donor[] = [
  {
    id: "don-001",
    name: "Keluarga H. Farid",
    type: "Individu",
    channel: "Transfer Bank",
    lastDonationAt: "2026-06-30",
    totalDonation: 24_500_000,
    recurring: true,
    programPreference: "Kesehatan",
    status: "Aktif",
  },
  {
    id: "don-002",
    name: "Komunitas Sahabat Subuh",
    type: "Komunitas",
    channel: "QRIS",
    lastDonationAt: "2026-06-28",
    totalDonation: 11_850_000,
    recurring: false,
    programPreference: "Kebutuhan Pokok",
    status: "Aktif",
  },
  {
    id: "don-003",
    name: "PT Sinar Pangan Mandiri",
    type: "Perusahaan",
    channel: "Transfer Bank",
    lastDonationAt: "2026-05-18",
    totalDonation: 38_000_000,
    recurring: false,
    programPreference: "Anak Asuh",
    status: "Perlu follow-up",
  },
  {
    id: "don-004",
    name: "Kajian Muslimah Bekasi",
    type: "Komunitas",
    channel: "Tunai",
    lastDonationAt: "2026-04-12",
    totalDonation: 8_350_000,
    recurring: false,
    programPreference: "Umum",
    status: "Dormant",
  },
];
