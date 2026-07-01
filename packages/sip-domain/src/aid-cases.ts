import { formatDateTime } from "./formatters";
import { regionalIndexes } from "./regional-indexes";
import { sipUsers } from "./users";
import type {
  AidCase,
  Eligibility,
  ProgramCategory,
  VerificationPriority,
  VerificationSummary,
  WorkflowStatus,
} from "./types";

// Hand-authored cases with full narrative depth (power the case-detail demo).
const baseAidCases: AidCase[] = [
  {
    id: "case-001",
    caseNumber: "SIP-2026-071",
    aidType: "insidental",
    program: "Kesehatan",
    status: "surveyed",
    priority: "urgent",
    submittedBy: "Fikri Ramadhan",
    submittedAt: "2026-06-27T09:30:00+07:00",
    assignedVerifierId: "usr-003",
    nextAction: "Pengurus menentukan nominal bantuan dan alasan keputusan.",
    problem:
      "Biaya kontrol pasca operasi dan obat rutin belum tercukupi karena kepala keluarga tidak bekerja penuh.",
    applicant: {
      name: "Siti Aminah",
      nik: "3275014509820004",
      birthPlace: "Bekasi",
      birthDate: "1982-09-05",
      age: 43,
      gender: "Perempuan",
      maritalStatus: "Janda",
      address: "Kp. Rawa Bugel RT 04 RW 09, Bekasi Utara",
      housingStatus: "Sewa/Kontrak",
      rentCost: 850_000,
      job: "Jahit rumahan",
      incomeAmount: 2_150_000,
      incomePeriod: "per bulan",
      dependents: 3,
      phone: "0812-7730-4451",
      prayerStatus: "Ya",
      smokingStatus: "Tidak",
      priorHelp: "Pernah menerima sembako dari RT setempat pada Ramadan 2026.",
      publishConsent: true,
      sktmStatus: "Sudah ada",
      infoSource: "Tetangga dan relawan masjid",
    },
    reporter: {
      name: "Ust. Mahmud",
      relation: "Pengurus DKM",
      institution: "Masjid Al Ikhlas",
      address: "Bekasi Utara",
      phone: "0813-2291-7720",
    },
    hadKifayah: {
      region: "Bekasi",
      province: "Jawa Barat",
      familyMonthlyNeed: 4_820_000,
      perCapitaNeed: 1_205_000,
      actualMonthlyIncome: 2_150_000,
      financialGap: 2_670_000,
      recommendedAid: 2_500_000,
      eligibility: "Sangat Layak",
      components: [
        { label: "Makanan", amount: 1_870_000 },
        { label: "Tempat tinggal", amount: 850_000 },
        { label: "Pendidikan anak", amount: 900_000 },
        { label: "Kesehatan", amount: 760_000 },
        { label: "Transportasi & ibadah", amount: 440_000 },
      ],
    },
    verification: {
      verifierName: "Ahmad Ridwan",
      coverage: "Bekasi",
      verifiedAt: "2026-06-29T16:20:00+07:00",
      background:
        "Pemohon menjadi tulang punggung keluarga setelah suami wafat. Penghasilan jahit tidak stabil.",
      currentCondition:
        "Tinggal di kontrakan kecil, biaya obat rutin dan sekolah anak sering tertunda.",
      requestedNeed: "Bantuan biaya kesehatan, obat, dan kebutuhan pokok selama pemulihan.",
      effortsTaken:
        "Sudah mengurus SKTM dan meminta keringanan biaya kontrol ke fasilitas kesehatan.",
      housingObservation:
        "Hunian sederhana, ventilasi terbatas, perabot pokok tersedia namun minim.",
      socialRecord: "Dikenal aktif di lingkungan, tetangga menilai kondisi ekonomi memang menurun.",
      recommendation: "Direkomendasikan bantuan insidental dengan prioritas kesehatan dan sembako.",
      neighborContact: "Ibu Lilis, 0812-3331-9004",
      notes: "Perlu follow-up satu bulan setelah penyaluran.",
      photos: [
        { label: "Foto hunian depan", kind: "Hunian", status: "Tersimpan" },
        { label: "Foto ruang utama", kind: "Hunian", status: "Tersimpan" },
        { label: "Bukti penyaluran", kind: "Penyaluran", status: "Wajib diunggah" },
      ],
    },
    timeline: [
      {
        label: "Pengajuan dibuat",
        actor: "Fikri Ramadhan",
        at: "27 Jun 2026, 09:30",
        note: "Data awal dan pelapor dicatat dari SIP Center.",
      },
      {
        label: "Disetujui untuk verifikasi",
        actor: "Nur Azizah",
        at: "28 Jun 2026, 10:15",
        note: "Kasus kesehatan dinilai perlu survei lapangan.",
      },
      {
        label: "Verifikasi selesai",
        actor: "Ahmad Ridwan",
        at: "29 Jun 2026, 16:20",
        note: "Foto hunian dan hasil wawancara sudah masuk.",
      },
    ],
  },
  {
    id: "case-002",
    caseNumber: "SIP-2026-072",
    aidType: "insidental",
    program: "Kebutuhan Pokok",
    status: "submitted",
    priority: "normal",
    submittedBy: "Ahmad Ridwan",
    submittedAt: "2026-06-30T13:15:00+07:00",
    nextAction: "Pengurus melakukan triase: lanjut verifikasi, revisi, atau tolak.",
    problem:
      "Penghasilan harian menurun karena sakit punggung, kebutuhan pangan keluarga pekan ini belum terpenuhi.",
    applicant: {
      name: "Rahmat Hidayat",
      nik: "3271051201760008",
      birthPlace: "Bogor",
      birthDate: "1976-01-12",
      age: 50,
      gender: "Laki-laki",
      maritalStatus: "Menikah",
      address: "Jl. Cikaret Gg. H. Saman RT 02 RW 05, Bogor Selatan",
      housingStatus: "Menumpang",
      job: "Buruh angkut pasar",
      incomeAmount: 85_000,
      incomePeriod: "per hari",
      dependents: 4,
      phone: "0858-9901-2208",
      prayerStatus: "Jarang",
      smokingStatus: "Jarang",
      priorHelp: "Belum pernah dibantu SIP.",
      publishConsent: false,
      sktmStatus: "Bersedia mengurus",
      infoSource: "Relawan wilayah Bogor",
    },
    reporter: {
      name: "Dewi Lestari",
      relation: "Verifikator wilayah",
      institution: "SIP Bogor",
      address: "Bogor Selatan",
      phone: "0821-1902-5521",
    },
    hadKifayah: {
      region: "Bogor",
      province: "Jawa Barat",
      familyMonthlyNeed: 4_360_000,
      perCapitaNeed: 1_090_000,
      actualMonthlyIncome: 2_210_000,
      financialGap: 2_150_000,
      recommendedAid: 1_500_000,
      eligibility: "Layak",
      components: [
        { label: "Makanan", amount: 1_680_000 },
        { label: "Tempat tinggal", amount: 450_000 },
        { label: "Pendidikan anak", amount: 940_000 },
        { label: "Kesehatan", amount: 520_000 },
        { label: "Transportasi & ibadah", amount: 770_000 },
      ],
    },
    timeline: [
      {
        label: "Pengajuan dibuat",
        actor: "Ahmad Ridwan",
        at: "30 Jun 2026, 13:15",
        note: "Data awal masuk dari relawan wilayah.",
      },
    ],
  },
  {
    id: "case-003",
    caseNumber: "SIP-2026-073",
    aidType: "insidental",
    program: "Pendidikan",
    status: "assigned",
    priority: "normal",
    submittedBy: "Fikri Ramadhan",
    submittedAt: "2026-06-26T11:45:00+07:00",
    assignedVerifierId: "usr-004",
    nextAction: "Verifikator melengkapi Form Verifikasi Lapangan.",
    problem: "Tunggakan biaya sekolah anak kelas XI dan kebutuhan transportasi menuju sekolah.",
    applicant: {
      name: "Ibu Maryam",
      nik: "3271016403840012",
      birthPlace: "Bogor",
      birthDate: "1984-03-24",
      age: 42,
      gender: "Perempuan",
      maritalStatus: "Menikah",
      address: "Kp. Pabuaran RT 01 RW 03, Cibinong",
      housingStatus: "Milik Sendiri",
      job: "Pedagang gorengan",
      incomeAmount: 120_000,
      incomePeriod: "per hari",
      dependents: 2,
      phone: "0822-1180-5540",
      prayerStatus: "Ya",
      smokingStatus: "Tidak",
      priorHelp: "Pernah dibantu biaya seragam oleh lembaga lokal.",
      publishConsent: true,
      sktmStatus: "Belum ada",
      infoSource: "Guru sekolah",
    },
    reporter: {
      name: "Ibu Ratna",
      relation: "Guru wali kelas",
      institution: "SMK Nurul Iman",
      address: "Cibinong",
      phone: "0812-8890-7711",
    },
    hadKifayah: {
      region: "Bogor",
      province: "Jawa Barat",
      familyMonthlyNeed: 4_120_000,
      perCapitaNeed: 1_030_000,
      actualMonthlyIncome: 2_640_000,
      financialGap: 1_480_000,
      recommendedAid: 1_250_000,
      eligibility: "Layak",
      components: [
        { label: "Makanan", amount: 1_500_000 },
        { label: "Tempat tinggal", amount: 560_000 },
        { label: "Pendidikan anak", amount: 1_120_000 },
        { label: "Kesehatan", amount: 400_000 },
        { label: "Transportasi & ibadah", amount: 540_000 },
      ],
    },
    timeline: [
      {
        label: "Pengajuan dibuat",
        actor: "Fikri Ramadhan",
        at: "26 Jun 2026, 11:45",
        note: "Berkas awal dari sekolah diterima.",
      },
      {
        label: "Ditugaskan",
        actor: "Nur Azizah",
        at: "27 Jun 2026, 08:10",
        note: "Diteruskan ke verifikator Bogor.",
      },
    ],
  },
  {
    id: "case-004",
    caseNumber: "SIP-2026-069",
    aidType: "insidental",
    program: "Darurat Hunian",
    status: "disbursement_pending",
    priority: "urgent",
    submittedBy: "Fikri Ramadhan",
    submittedAt: "2026-06-21T08:40:00+07:00",
    assignedVerifierId: "usr-005",
    decisionNominal: 3_000_000,
    nextAction: "Verifikator menyalurkan bantuan dan mengunggah bukti foto.",
    problem:
      "Atap kontrakan rusak berat akibat hujan, keluarga membutuhkan biaya perbaikan darurat.",
    applicant: {
      name: "Bapak Saeful",
      nik: "3172091909780002",
      birthPlace: "Jakarta",
      birthDate: "1978-09-19",
      age: 47,
      gender: "Laki-laki",
      maritalStatus: "Menikah",
      address: "Cakung Barat RT 08 RW 02, Jakarta Timur",
      housingStatus: "Sewa/Kontrak",
      rentCost: 1_150_000,
      job: "Ojek pangkalan",
      incomeAmount: 3_000_000,
      incomePeriod: "per bulan",
      dependents: 5,
      phone: "0813-4044-9091",
      prayerStatus: "Ya",
      smokingStatus: "Tidak",
      priorHelp: "Belum pernah dibantu SIP.",
      publishConsent: true,
      sktmStatus: "Sudah ada",
      infoSource: "SIP Center",
    },
    reporter: {
      name: "Pak Adnan",
      relation: "Ketua RT",
      institution: "RT 08",
      address: "Cakung Barat",
      phone: "0812-2229-1000",
    },
    hadKifayah: {
      region: "Jakarta Timur",
      province: "DKI Jakarta",
      familyMonthlyNeed: 5_480_000,
      perCapitaNeed: 1_370_000,
      actualMonthlyIncome: 3_000_000,
      financialGap: 2_480_000,
      recommendedAid: 2_500_000,
      eligibility: "Sangat Layak",
      components: [
        { label: "Makanan", amount: 2_020_000 },
        { label: "Tempat tinggal", amount: 1_150_000 },
        { label: "Pendidikan anak", amount: 1_180_000 },
        { label: "Kesehatan", amount: 590_000 },
        { label: "Transportasi & ibadah", amount: 540_000 },
      ],
    },
    verification: {
      verifierName: "Haris Maulana",
      coverage: "Jakarta Timur",
      verifiedAt: "2026-06-23T14:05:00+07:00",
      background: "Keluarga kontrak dengan lima tanggungan, kerusakan atap mengganggu hunian.",
      currentCondition: "Atap bocor di ruang tidur dan dapur. Perbaikan sementara belum cukup.",
      requestedNeed: "Material atap dan biaya tukang untuk perbaikan darurat.",
      effortsTaken: "Sudah meminta bantuan pemilik kontrakan, namun hanya diberi keringanan sewa.",
      housingObservation: "Area dalam lembap dan beberapa barang dipindahkan ke rumah tetangga.",
      socialRecord: "Aktif ronda dan dinilai bertanggung jawab oleh RT.",
      recommendation: "Bantuan cepat disarankan karena menyangkut keselamatan tempat tinggal.",
      neighborContact: "Pak Wawan, 0813-1110-8989",
      notes: "Bukti belanja material perlu ikut diunggah setelah penyaluran.",
      photos: [
        { label: "Atap rusak", kind: "Hunian", status: "Tersimpan" },
        { label: "Kondisi dapur", kind: "Hunian", status: "Tersimpan" },
        { label: "Bukti serah terima", kind: "Penyaluran", status: "Wajib diunggah" },
      ],
    },
    timeline: [
      {
        label: "Pengajuan dibuat",
        actor: "Fikri Ramadhan",
        at: "21 Jun 2026, 08:40",
        note: "Laporan RT diterima oleh SIP Center.",
      },
      {
        label: "Verifikasi selesai",
        actor: "Haris Maulana",
        at: "23 Jun 2026, 14:05",
        note: "Kerusakan hunian terkonfirmasi.",
      },
      {
        label: "Nominal disetujui",
        actor: "Nur Azizah",
        at: "24 Jun 2026, 09:35",
        note: "Disetujui Rp3.000.000 untuk perbaikan darurat.",
      },
    ],
  },
  {
    id: "case-005",
    caseNumber: "SIP-2026-065",
    aidType: "rutin_bulanan",
    program: "Anak Asuh",
    status: "completed",
    priority: "monitor",
    submittedBy: "Fikri Ramadhan",
    submittedAt: "2026-06-12T10:10:00+07:00",
    assignedVerifierId: "usr-004",
    decisionNominal: 750_000,
    disbursedAt: "2026-06-25T15:20:00+07:00",
    nextAction: "Masuk daftar evaluasi bantuan rutin bulan berikutnya.",
    problem: "Dukungan biaya sekolah dan uang saku anak asuh.",
    applicant: {
      name: "Nabila Putri",
      nik: "3271035109100015",
      birthPlace: "Bogor",
      birthDate: "2010-09-11",
      age: 15,
      gender: "Perempuan",
      maritalStatus: "Belum Menikah",
      address: "Cileungsi, Bogor",
      housingStatus: "Menumpang",
      job: "Pelajar",
      incomeAmount: 0,
      incomePeriod: "per bulan",
      dependents: 0,
      phone: "0812-8844-1200",
      prayerStatus: "Ya",
      smokingStatus: "Tidak",
      priorHelp: "Masuk program anak asuh SIP sejak Juni 2026.",
      publishConsent: true,
      sktmStatus: "Sudah ada",
      infoSource: "Pengurus sekolah",
    },
    reporter: {
      name: "Ibu Sri",
      relation: "Wali murid",
      institution: "Perorangan",
      address: "Cileungsi",
      phone: "0821-7770-3300",
    },
    hadKifayah: {
      region: "Bogor",
      province: "Jawa Barat",
      familyMonthlyNeed: 4_360_000,
      perCapitaNeed: 1_090_000,
      actualMonthlyIncome: 1_800_000,
      financialGap: 2_560_000,
      recommendedAid: 750_000,
      eligibility: "Layak",
      components: [
        { label: "Makanan", amount: 1_600_000 },
        { label: "Pendidikan", amount: 900_000 },
        { label: "Transportasi sekolah", amount: 450_000 },
        { label: "Kesehatan", amount: 360_000 },
        { label: "Kebutuhan pribadi", amount: 1_050_000 },
      ],
    },
    timeline: [
      {
        label: "Pengajuan dibuat",
        actor: "Fikri Ramadhan",
        at: "12 Jun 2026, 10:10",
        note: "Calon anak asuh dicatat dari rekomendasi sekolah.",
      },
      {
        label: "Bantuan disalurkan",
        actor: "Dewi Lestari",
        at: "25 Jun 2026, 15:20",
        note: "Bukti penyaluran tersimpan.",
      },
    ],
  },
];

// ── Generated caseload ───────────────────────────────────────────────────────
// Deterministic filler so lists, charts, and funnels look realistic in the demo.
// Kept lighter than the hand-authored cases above but fully typed.
const femaleNames = [
  "Aminah",
  "Sri Wahyuni",
  "Nurhayati",
  "Maimunah",
  "Kartini",
  "Halimah",
  "Rukmini",
  "Sundari",
  "Wati Suryani",
  "Endang Puji",
];
const maleNames = [
  "Slamet Riyadi",
  "Bambang Sutrisno",
  "Joko Susanto",
  "Agus Salim",
  "Dedi Kurniawan",
  "Iwan Setiadi",
  "Marwan",
  "Sugianto",
  "Tarno",
  "Hendra Gunawan",
];
const jobs = [
  "Buruh harian",
  "Pedagang kecil",
  "Tukang ojek",
  "Pemulung",
  "Asisten rumah tangga",
  "Buruh cuci",
  "Kuli bangunan",
  "Penjahit",
  "Petani",
  "Sopir angkot",
];
const problems = [
  "Biaya pengobatan menahun tidak tertanggung penghasilan harian.",
  "Anak terancam putus sekolah karena tunggakan biaya pendidikan.",
  "Kebutuhan pangan keluarga tidak tercukupi sejak kehilangan pekerjaan.",
  "Rumah lapuk dan bocor parah, tidak layak huni.",
];
const insidentalPrograms: ProgramCategory[] = [
  "Kesehatan",
  "Pendidikan",
  "Kebutuhan Pokok",
  "Darurat Hunian",
];
const statusPlan: WorkflowStatus[] = [
  "submitted",
  "submitted",
  "submitted",
  "approved_for_verification",
  "approved_for_verification",
  "assigned",
  "assigned",
  "surveyed",
  "surveyed",
  "surveyed",
  "approved",
  "disbursement_pending",
  "disbursement_pending",
  "completed",
  "completed",
  "completed",
  "needs_revision",
  "rejected",
];
const submittedDates = [
  "2026-05-19T09:10:00+07:00",
  "2026-05-22T14:20:00+07:00",
  "2026-05-26T10:05:00+07:00",
  "2026-05-29T11:40:00+07:00",
  "2026-06-02T08:30:00+07:00",
  "2026-06-05T13:15:00+07:00",
  "2026-06-08T15:50:00+07:00",
  "2026-06-11T09:25:00+07:00",
  "2026-06-14T10:35:00+07:00",
  "2026-06-17T14:05:00+07:00",
  "2026-06-19T11:20:00+07:00",
  "2026-06-22T08:55:00+07:00",
  "2026-06-24T16:10:00+07:00",
  "2026-06-26T09:45:00+07:00",
  "2026-06-28T13:30:00+07:00",
  "2026-06-30T10:15:00+07:00",
  "2026-07-01T09:00:00+07:00",
  "2026-07-01T15:40:00+07:00",
];

const verifiers = sipUsers.filter((u) => u.role === "verifikator" && u.status === "Aktif");
const stageOrder: WorkflowStatus[] = [
  "submitted",
  "approved_for_verification",
  "assigned",
  "surveyed",
  "approved",
  "disbursement_pending",
  "completed",
];
const stageIndex = (s: WorkflowStatus) => stageOrder.indexOf(s);

function eligibilityFor(ratio: number): Eligibility {
  if (ratio < 0.4) return "Sangat Layak";
  if (ratio < 0.65) return "Layak";
  if (ratio < 0.85) return "Perlu Review";
  return "Tidak Layak";
}

function buildVerification(
  name: string,
  region: string,
  verifierName: string,
  completed: boolean,
): VerificationSummary {
  return {
    verifierName,
    coverage: region,
    verifiedAt: "2026-06-20T10:00:00+07:00",
    background: `${name} menjadi tulang punggung keluarga dengan penghasilan tidak menentu.`,
    currentCondition: "Kondisi ekonomi menurun, kebutuhan pokok kerap tertunda.",
    requestedNeed: "Bantuan sesuai program yang direkomendasikan.",
    effortsTaken: "Sudah berupaya mencari tambahan penghasilan dan mengurus SKTM.",
    housingObservation: "Hunian sederhana dengan fasilitas terbatas.",
    socialRecord: "Dikenal baik dan aktif di lingkungan sekitar.",
    recommendation: "Direkomendasikan menerima bantuan sesuai kebutuhan.",
    neighborContact: "Ketua RT setempat",
    notes: "Perlu pemantauan lanjutan setelah penyaluran.",
    photos: [
      { label: "Foto hunian", kind: "Hunian", status: "Tersimpan" },
      {
        label: "Bukti penyaluran",
        kind: "Penyaluran",
        status: completed ? "Tersimpan" : "Wajib diunggah",
      },
    ],
  };
}

function buildTimeline(status: WorkflowStatus, at: string, verifierName: string) {
  const tl = [
    {
      label: "Pengajuan dibuat",
      actor: "Fikri Ramadhan",
      at,
      note: "Data awal pemohon dan pelapor dicatat.",
    },
  ];
  if (status === "needs_revision") {
    tl.push({
      label: "Dikembalikan untuk revisi",
      actor: "Nur Azizah",
      at,
      note: "Data awal perlu dilengkapi.",
    });
    return tl;
  }
  if (status === "rejected") {
    tl.push({
      label: "Pengajuan ditolak",
      actor: "Nur Azizah",
      at,
      note: "Belum memenuhi kriteria bantuan.",
    });
    return tl;
  }
  const s = stageIndex(status);
  if (s >= 1)
    tl.push({
      label: "Disetujui untuk verifikasi",
      actor: "Nur Azizah",
      at,
      note: "Diteruskan ke verifikator wilayah.",
    });
  if (s >= 3)
    tl.push({
      label: "Verifikasi selesai",
      actor: verifierName,
      at,
      note: "Hasil survei lapangan tersimpan.",
    });
  if (s >= 4)
    tl.push({
      label: "Nominal disetujui",
      actor: "Nur Azizah",
      at,
      note: "Keputusan nominal ditetapkan.",
    });
  if (s >= 6)
    tl.push({
      label: "Bantuan disalurkan",
      actor: verifierName,
      at,
      note: "Bukti penyaluran tersimpan.",
    });
  return tl;
}

const generatedAidCases: AidCase[] = statusPlan.map((status, i) => {
  const region = regionalIndexes[i % regionalIndexes.length];
  const female = i % 2 === 0;
  const name = female ? femaleNames[i % femaleNames.length] : maleNames[i % maleNames.length];
  const program = insidentalPrograms[i % insidentalPrograms.length];
  const verifier =
    verifiers.find((v) => v.region === region.city) ?? verifiers[i % verifiers.length];
  const s = stageIndex(status);

  const need = region.familyMonthlyNeed;
  const incomeRatio = [0.32, 0.48, 0.6, 0.74][i % 4];
  const income = Math.round((need * incomeRatio) / 50_000) * 50_000;
  const gap = Math.max(0, need - income);
  const recommendedAid = Math.round(gap / 50_000) * 50_000;
  const submittedAt = submittedDates[i % submittedDates.length];
  const dateLabel = formatDateTime(submittedAt);
  const hasVerification = s >= 3;
  const decided = s >= 4;
  const completed = status === "completed";

  return {
    id: `case-1${String(i).padStart(2, "0")}`,
    caseNumber: `SIP-2026-1${String(i).padStart(2, "0")}`,
    aidType: "insidental",
    program,
    status,
    priority: (["urgent", "normal", "monitor", "normal"] as VerificationPriority[])[i % 4],
    submittedBy: i % 2 === 0 ? "Fikri Ramadhan" : "Ahmad Ridwan",
    submittedAt,
    assignedVerifierId: s >= 2 ? verifier.id : undefined,
    nextAction:
      status === "submitted"
        ? "Pengurus melakukan triase pengajuan."
        : status === "surveyed"
          ? "Pengurus menentukan nominal bantuan."
          : "Lanjutkan sesuai tahap alur.",
    problem: problems[i % problems.length],
    applicant: {
      name,
      nik: (3_200_000_000_000_000 + i * 111_317).toString().slice(0, 16),
      birthPlace: region.city,
      birthDate: `19${70 + (i % 25)}-0${(i % 8) + 1}-1${i % 9}`,
      age: 32 + ((i * 3) % 30),
      gender: female ? "Perempuan" : "Laki-laki",
      maritalStatus: (["Menikah", "Janda", "Duda", "Menikah"] as const)[i % 4],
      address: `Kp. ${region.city} RT 0${(i % 8) + 1} RW 0${(i % 6) + 1}`,
      housingStatus: (["Sewa/Kontrak", "Menumpang", "Milik Sendiri", "Tidak Memiliki"] as const)[
        i % 4
      ],
      job: jobs[i % jobs.length],
      incomeAmount: income,
      incomePeriod: "per bulan",
      dependents: i % 5,
      phone: `0812-${String(1000 + i)}-${String(2000 + i * 7).slice(0, 4)}`,
      prayerStatus: (["Ya", "Jarang", "Ya"] as const)[i % 3],
      smokingStatus: (["Tidak", "Jarang", "Ya"] as const)[i % 3],
      priorHelp: i % 3 === 0 ? "Pernah menerima sembako dari lingkungan." : "Belum pernah dibantu.",
      publishConsent: i % 2 === 0,
      sktmStatus: (["Sudah ada", "Bersedia mengurus", "Belum ada"] as const)[i % 3],
      infoSource: (["Tetangga", "Relawan masjid", "Pengurus RT", "Guru sekolah"] as const)[i % 4],
    },
    reporter: {
      name: `Ketua RT ${region.city}`,
      relation: "Pelapor lingkungan",
      institution: (["Masjid setempat", "RT/RW", "Yayasan lokal", "Perorangan"] as const)[i % 4],
      address: region.city,
      phone: `0813-${String(3000 + i)}-${String(4000 + i * 3).slice(0, 4)}`,
    },
    decisionNominal: decided ? recommendedAid : undefined,
    disbursedAt: completed ? "2026-06-27T14:00:00+07:00" : undefined,
    hadKifayah: {
      region: region.city,
      province: region.province,
      familyMonthlyNeed: need,
      perCapitaNeed: region.perCapitaNeed,
      actualMonthlyIncome: income,
      financialGap: gap,
      recommendedAid,
      eligibility: eligibilityFor(incomeRatio),
      components: [
        { label: "Makanan", amount: Math.round(need * 0.42) },
        { label: "Tempat tinggal", amount: Math.round(need * 0.18) },
        { label: "Pendidikan anak", amount: Math.round(need * 0.15) },
        { label: "Kesehatan", amount: Math.round(need * 0.13) },
        { label: "Transportasi & ibadah", amount: Math.round(need * 0.12) },
      ],
    },
    verification: hasVerification
      ? buildVerification(name, region.city, verifier.name, completed)
      : undefined,
    timeline: buildTimeline(status, dateLabel, verifier.name),
  } satisfies AidCase;
});

// Mock intake and verification cases used by the admin and verifier dashboards.
export const aidCases: AidCase[] = [...baseAidCases, ...generatedAidCases];
