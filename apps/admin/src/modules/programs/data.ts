// Program master — the entity that drives both aid tracks. Each program is typed
// insidental (one-off, full workflow) or rutin (standing monthly roster). Mock seed for
// the demo; CRUD runs in-memory (no backend).
export type ProgramType = "insidental" | "rutin";

export type Program = {
  id: string;
  name: string;
  type: ProgramType;
  description: string;
  active: boolean;
  // Default monthly nominal per beneficiary — only meaningful for rutin programs.
  defaultNominal?: number;
};

export const programTypeLabels: Record<ProgramType, string> = {
  insidental: "Insidental",
  rutin: "Rutin bulanan",
};

export const seedPrograms: Program[] = [
  {
    id: "prg-kesehatan",
    name: "Kesehatan",
    type: "insidental",
    description: "Bantuan biaya berobat, obat rutin, dan tindakan medis darurat.",
    active: true,
  },
  {
    id: "prg-pendidikan",
    name: "Pendidikan",
    type: "insidental",
    description: "Bantuan biaya sekolah, seragam, dan perlengkapan belajar.",
    active: true,
  },
  {
    id: "prg-kebutuhan-pokok",
    name: "Kebutuhan Pokok",
    type: "insidental",
    description: "Bantuan sembako dan kebutuhan pangan mendesak.",
    active: true,
  },
  {
    id: "prg-darurat-hunian",
    name: "Darurat Hunian",
    type: "insidental",
    description: "Bantuan perbaikan rumah tidak layak huni dan darurat tempat tinggal.",
    active: true,
  },
  {
    id: "prg-anak-yatim",
    name: "Anak Yatim",
    type: "rutin",
    description: "Santunan bulanan untuk anak yatim binaan.",
    active: true,
    defaultNominal: 500_000,
  },
  {
    id: "prg-anak-asuh",
    name: "Anak Asuh",
    type: "rutin",
    description: "Beasiswa dan santunan bulanan anak asuh.",
    active: true,
    defaultNominal: 750_000,
  },
  {
    id: "prg-tahfidz",
    name: "Tahfidz",
    type: "rutin",
    description: "Dukungan bulanan santri program tahfidz.",
    active: true,
    defaultNominal: 400_000,
  },
];
