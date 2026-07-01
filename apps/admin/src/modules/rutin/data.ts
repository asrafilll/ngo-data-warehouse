// Bantuan Rutin — standing beneficiary rosters per rutin program. Not re-submitted each
// month; the roster carries over and only a few rows change per period. Mock data for the
// demo (no backend). Disbursement status per period is seeded in the component.
import { seedPrograms } from "../programs/data";

export const rutinPrograms = seedPrograms.filter((p) => p.type === "rutin");

export type RutinBeneficiary = {
  id: string;
  programId: string;
  name: string;
  region: string;
  nik: string;
  nominal: number;
  since: string; // ISO month the beneficiary joined the roster
};

export const rutinBeneficiaries: RutinBeneficiary[] = [
  // Anak Asuh
  {
    id: "rb-001",
    programId: "prg-anak-asuh",
    name: "Nabila Putri",
    region: "Bogor",
    nik: "3271056009100002",
    nominal: 750_000,
    since: "2025-09",
  },
  {
    id: "rb-002",
    programId: "prg-anak-asuh",
    name: "Rizky Aditya",
    region: "Bekasi",
    nik: "3275041203110004",
    nominal: 1_000_000,
    since: "2026-01",
  },
  {
    id: "rb-003",
    programId: "prg-anak-asuh",
    name: "Salsa Nur Aini",
    region: "Jakarta Timur",
    nik: "3172054507120006",
    nominal: 750_000,
    since: "2026-03",
  },
  // Anak Yatim
  {
    id: "rb-004",
    programId: "prg-anak-yatim",
    name: "Fatimah Zahra",
    region: "Bogor",
    nik: "3271052208130001",
    nominal: 500_000,
    since: "2025-06",
  },
  {
    id: "rb-005",
    programId: "prg-anak-yatim",
    name: "Yusuf Abdullah",
    region: "Bekasi",
    nik: "3275040110120003",
    nominal: 500_000,
    since: "2025-11",
  },
  {
    id: "rb-006",
    programId: "prg-anak-yatim",
    name: "Aisyah Rahma",
    region: "Tangerang Selatan",
    nik: "3674051503140005",
    nominal: 600_000,
    since: "2026-02",
  },
  {
    id: "rb-007",
    programId: "prg-anak-yatim",
    name: "Zaid Malik",
    region: "Bogor",
    nik: "3271050907130007",
    nominal: 500_000,
    since: "2026-04",
  },
  // Tahfidz
  {
    id: "rb-008",
    programId: "prg-tahfidz",
    name: "Hafiz Ananda",
    region: "Bekasi",
    nik: "3275042605100008",
    nominal: 400_000,
    since: "2025-08",
  },
  {
    id: "rb-009",
    programId: "prg-tahfidz",
    name: "Ummu Kultsum",
    region: "Bogor",
    nik: "3271056812110009",
    nominal: 450_000,
    since: "2026-05",
  },
];

export type Period = { key: string; label: string };

export const periods: Period[] = [
  { key: "2026-07", label: "Juli 2026" },
  { key: "2026-06", label: "Juni 2026" },
  { key: "2026-05", label: "Mei 2026" },
];

// Seed disbursement per period: the current period (latest) is partially disbursed,
// earlier periods are fully settled. Beneficiaries who joined after a period are excluded.
export function seedDisbursed(periodKey: string, roster: RutinBeneficiary[]): Set<string> {
  const eligible = roster.filter((b) => b.since <= periodKey);
  if (periodKey === periods[0].key) {
    // current month — first half already disbursed
    return new Set(eligible.slice(0, Math.ceil(eligible.length / 2)).map((b) => b.id));
  }
  return new Set(eligible.map((b) => b.id));
}
