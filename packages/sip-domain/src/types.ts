export type SipRole = "super_admin" | "admin" | "pengurus" | "verifikator";

export type AidType = "insidental" | "rutin_bulanan";

export type ProgramCategory =
  | "Kesehatan"
  | "Pendidikan"
  | "Kebutuhan Pokok"
  | "Anak Yatim"
  | "Anak Asuh"
  | "Tahfidz"
  | "Darurat Hunian";

export type WorkflowStatus =
  | "submitted"
  | "approved_for_verification"
  | "assigned"
  | "surveyed"
  | "approved"
  | "rejected"
  | "disbursement_pending"
  | "completed"
  | "needs_revision";

export type Eligibility = "Sangat Layak" | "Layak" | "Perlu Review" | "Tidak Layak";

export type VerificationPriority = "urgent" | "normal" | "monitor";

export type SipUser = {
  id: string;
  name: string;
  role: SipRole;
  phone: string;
  region: string;
  status: "Aktif" | "Nonaktif";
};

export type Applicant = {
  name: string;
  nik: string;
  birthPlace: string;
  birthDate: string;
  age: number;
  gender: "Laki-laki" | "Perempuan";
  maritalStatus: "Menikah" | "Duda" | "Janda" | "Janda Mati" | "Belum Menikah";
  address: string;
  housingStatus: "Milik Sendiri" | "Sewa/Kontrak" | "Menumpang" | "Tidak Memiliki";
  rentCost?: number;
  job: string;
  incomeAmount: number;
  incomePeriod: "per hari" | "per pekan" | "per bulan";
  dependents: number;
  phone: string;
  prayerStatus: "Ya" | "Jarang" | "Tidak";
  smokingStatus: "Ya" | "Jarang" | "Tidak";
  priorHelp: string;
  publishConsent: boolean;
  sktmStatus: "Belum ada" | "Bersedia mengurus" | "Sudah ada";
  infoSource: string;
};

export type Reporter = {
  name: string;
  relation: string;
  institution: string;
  address: string;
  phone: string;
};

export type HadKifayahSummary = {
  region: string;
  province: string;
  familyMonthlyNeed: number;
  perCapitaNeed: number;
  actualMonthlyIncome: number;
  financialGap: number;
  recommendedAid: number;
  eligibility: Eligibility;
  components: Array<{
    label: string;
    amount: number;
  }>;
};

export type VerificationSummary = {
  verifierName: string;
  coverage: string;
  verifiedAt: string;
  background: string;
  currentCondition: string;
  requestedNeed: string;
  effortsTaken: string;
  housingObservation: string;
  socialRecord: string;
  recommendation: string;
  neighborContact: string;
  notes: string;
  photos: Array<{
    label: string;
    kind: "Hunian" | "Penyaluran" | "Dokumen";
    status: "Tersimpan" | "Wajib diunggah" | "Opsional";
  }>;
};

export type AidCase = {
  id: string;
  caseNumber: string;
  aidType: AidType;
  program: ProgramCategory;
  status: WorkflowStatus;
  priority: VerificationPriority;
  applicant: Applicant;
  reporter: Reporter;
  problem: string;
  submittedBy: string;
  submittedAt: string;
  assignedVerifierId?: string;
  nextAction: string;
  decisionNominal?: number;
  disbursedAt?: string;
  hadKifayah: HadKifayahSummary;
  verification?: VerificationSummary;
  timeline: Array<{
    label: string;
    actor: string;
    at: string;
    note: string;
  }>;
};

export type RegionalIndex = {
  id: string;
  province: string;
  city: string;
  familyMonthlyNeed: number;
  perCapitaNeed: number;
  foodIndex: number;
  updatedAt: string;
};

export type Donor = {
  id: string;
  name: string;
  type: "Individu" | "Komunitas" | "Perusahaan";
  channel: "Transfer Bank" | "QRIS" | "Tunai" | "Payroll";
  lastDonationAt: string;
  totalDonation: number;
  recurring: boolean;
  programPreference: ProgramCategory | "Umum";
  status: "Aktif" | "Perlu follow-up" | "Dormant";
};

export type ModuleSummary = {
  key: string;
  label: string;
  description: string;
  total: number;
  active: number;
  owner: string;
};
