import {
  aidCases,
  formatCurrency,
  formatDate,
  getAssignedVerifier,
  getMonthlyIncome,
  statusLabels,
  statusTone,
  verifierDrafts,
  type AidCase,
  type WorkflowStatus,
} from "@repo/sip-domain";
import { Alert, AlertDescription, AlertTitle } from "@repo/ui/components/alert";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Checkbox } from "@repo/ui/components/checkbox";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Progress } from "@repo/ui/components/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { Textarea } from "@repo/ui/components/textarea";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Cloud,
  FileText,
  Home,
  MapPin,
  Navigation,
  Phone,
  Save,
  Send,
  Upload,
  UserRoundCheck,
  WalletCards,
  WifiOff,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";

export const Route = createFileRoute("/")({
  component: VerifierDashboard,
});

const assignedCases = aidCases.filter((item) =>
  ["assigned", "surveyed", "disbursement_pending"].includes(item.status),
);
const activeCase = aidCases[2];
const disbursementCase = aidCases[3];

function VerifierDashboard() {
  return (
    <div className="mx-auto grid max-w-[1400px] gap-6">
      <VerifierHero />
      <VerifierMetrics />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_400px]">
        <div className="grid gap-6">
          <TaskBoard />
          <VerificationWorkspace caseItem={activeCase} />
        </div>
        <aside className="grid h-fit gap-6 xl:sticky xl:top-24">
          <SyncStatusCard />
          <DisbursementCard caseItem={disbursementCase} />
          <DraftsCard />
        </aside>
      </div>
    </div>
  );
}

function VerifierHero() {
  return (
    <section className="grid gap-5 rounded-xl border border-[#d9ded4] bg-[#fbfcf8] p-5 shadow-[0_18px_50px_rgba(34,43,34,0.06)] lg:grid-cols-[1fr_auto] lg:items-end">
      <div>
        <Badge
          className="rounded-md border-[#c8d8c8] bg-[#eef6ec] text-[#245c3f]"
          variant="outline"
        >
          Dashboard verifikator
        </Badge>
        <h1 className="mt-4 max-w-3xl text-2xl font-semibold leading-tight sm:text-3xl lg:text-4xl">
          Operasional lapangan wilayah Bogor
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[#657164]">
          Review tugas, lengkapi verifikasi, simpan draft, dan unggah bukti penyaluran dari satu
          dashboard yang tetap nyaman di desktop dan mobile.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:flex">
        <StatusPill icon={MapPin} label="Wilayah" value="Bogor" />
        <StatusPill icon={Cloud} label="Sync" value="Online" />
      </div>
    </section>
  );
}

function VerifierMetrics() {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard icon={ClipboardCheck} label="Tugas aktif" value={`${assignedCases.length}`} />
      <MetricCard icon={UserRoundCheck} label="Perlu verifikasi" value="1" />
      <MetricCard icon={WalletCards} label="Siap salur" value="1" />
      <MetricCard icon={WifiOff} label="Draft lokal" value={`${verifierDrafts.length}`} />
    </section>
  );
}

function TaskBoard() {
  return (
    <Card className="rounded-xl border-[#d9ded4] shadow-[0_14px_42px_rgba(34,43,34,0.06)]">
      <CardHeader className="gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="size-5 text-[#245c3f]" strokeWidth={1.8} />
            Task board verifikasi
          </CardTitle>
          <p className="mt-1 text-sm text-[#657164]">Tugas aktif dari SIP Center dan pengurus.</p>
        </div>
        <Button type="button" variant="outline">
          Pengajuan baru
        </Button>
      </CardHeader>
      <CardContent className="grid gap-3">
        {assignedCases.map((caseItem) => (
          <TaskRow caseItem={caseItem} key={caseItem.id} />
        ))}
      </CardContent>
    </Card>
  );
}

function VerificationWorkspace({ caseItem }: { caseItem: AidCase }) {
  const verifier = getAssignedVerifier(caseItem);

  return (
    <Card className="rounded-xl border-[#d9ded4] shadow-[0_14px_42px_rgba(34,43,34,0.06)]">
      <CardHeader className="gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-5 text-[#245c3f]" strokeWidth={1.8} />
            Workspace verifikasi lapangan
          </CardTitle>
          <p className="mt-1 text-sm text-[#657164]">
            Form tetap lengkap, tetapi layout dibuat sebagai dashboard web responsive.
          </p>
        </div>
        <StatusBadge status={caseItem.status} />
      </CardHeader>
      <CardContent className="grid gap-6">
        <CaseSummary caseItem={caseItem} />

        <div className="grid gap-5 lg:grid-cols-2">
          <FormPanel title="Data faktual pemohon">
            <Field label="Nama" value={caseItem.applicant.name} />
            <Field label="NIK" value={caseItem.applicant.nik} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Usia" value={`${caseItem.applicant.age}`} />
              <SelectField
                label="Jenis kelamin"
                options={["Laki-laki", "Perempuan"]}
                value={caseItem.applicant.gender}
              />
            </div>
            <TextareaField label="Alamat saat ini" value={caseItem.applicant.address} />
            <SelectField
              label="Status tempat tinggal"
              options={["Milik Sendiri", "Sewa/Kontrak", "Menumpang", "Tidak Memiliki"]}
              value={caseItem.applicant.housingStatus}
            />
            <Field label="Pekerjaan aktual" value={caseItem.applicant.job} />
            <Field
              label="Penghasilan aktual per bulan"
              value={`${getMonthlyIncome(caseItem.applicant)}`}
            />
          </FormPanel>

          <FormPanel title="Catatan dan rekomendasi">
            <TextareaField
              label="Latar belakang"
              value="Keluarga mengalami penurunan pemasukan karena sakit punggung kepala keluarga."
            />
            <TextareaField
              label="Kondisi saat ini"
              value="Kebutuhan pangan belum tercukupi dan keluarga menumpang di rumah kerabat."
            />
            <TextareaField
              label="Kebutuhan bantuan"
              value="Paket sembako dan bantuan biaya pengobatan dasar."
            />
            <TextareaField
              label="Saran verifikator"
              value="Layak dibantu kebutuhan pokok dan dipantau ulang dalam 2 pekan."
            />
          </FormPanel>
        </div>

        <div className="grid gap-4 rounded-xl border border-[#d9ded4] bg-[#f7f8f4] p-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="grid gap-3 sm:grid-cols-3">
            <UploadSlot label="Foto hunian depan" />
            <UploadSlot label="Foto ruang utama" />
            <UploadSlot label="SKTM/Keterangan" document />
          </div>
          <div className="grid gap-2 sm:flex lg:grid">
            <Button type="button" variant="outline">
              <Save className="size-4" strokeWidth={1.8} />
              Simpan draft
            </Button>
            <Button className="bg-[#1f5f43] text-white hover:bg-[#194d38]" type="button">
              <Send className="size-4" strokeWidth={1.8} />
              Kirim verifikasi
            </Button>
          </div>
        </div>

        <div className="grid gap-3 rounded-xl border border-[#d9ded4] bg-white p-4 sm:grid-cols-4">
          <SummaryLine label="Verifikator" value={verifier?.name ?? "-"} />
          <SummaryLine label="Wilayah" value={verifier?.region ?? caseItem.hadKifayah.region} />
          <SummaryLine
            label="Had Kifayah"
            value={formatCurrency(caseItem.hadKifayah.familyMonthlyNeed)}
          />
          <SummaryLine
            label="Rekomendasi"
            value={formatCurrency(caseItem.hadKifayah.recommendedAid)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function SyncStatusCard() {
  return (
    <Card className="rounded-xl border-[#d9ded4] shadow-[0_14px_42px_rgba(34,43,34,0.06)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="size-5 text-[#245c3f]" strokeWidth={1.8} />
          Sync dan draft
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Alert className="rounded-lg border-[#c8d8c8] bg-[#eef6ec]">
          <CheckCircle2 className="size-4 text-[#245c3f]" strokeWidth={1.8} />
          <AlertTitle>Koneksi stabil</AlertTitle>
          <AlertDescription>Draft bisa dikirim ke dashboard pusat.</AlertDescription>
        </Alert>
        <div className="grid gap-2 text-sm">
          <SummaryLine label="Draft tersimpan" value={`${verifierDrafts.length}`} />
          <SummaryLine label="Upload tertunda" value="1 foto" />
          <SummaryLine label="Last sync" value="1 Jul 2026, 09:42" />
        </div>
        <Button className="bg-[#1f5f43] text-white hover:bg-[#194d38]" type="button">
          Sinkronkan sekarang
        </Button>
      </CardContent>
    </Card>
  );
}

function DisbursementCard({ caseItem }: { caseItem: AidCase }) {
  return (
    <Card className="rounded-xl border-[#d9ded4] shadow-[0_14px_42px_rgba(34,43,34,0.06)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <WalletCards className="size-5 text-[#245c3f]" strokeWidth={1.8} />
          Penyaluran berikutnya
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="rounded-lg border border-[#d9ded4] bg-[#fbfcf8] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{caseItem.applicant.name}</p>
              <p className="mt-1 text-xs text-[#657164]">{caseItem.caseNumber}</p>
            </div>
            <StatusBadge status={caseItem.status} />
          </div>
          <div className="mt-4 grid gap-2 text-sm">
            <SummaryLine label="Nominal" value={formatCurrency(caseItem.decisionNominal ?? 0)} />
            <SummaryLine label="Program" value={caseItem.program} />
            <SummaryLine label="Kontak" value={caseItem.applicant.phone} />
          </div>
        </div>
        <div className="grid gap-2">
          {["Nominal sesuai keputusan", "Tanggal penyaluran", "Foto bukti", "Catatan saksi"].map(
            (item, index) => {
              const id = `salur-${item.replace(/\W+/g, "-")}`;

              return (
                <div className="flex items-center gap-3 text-sm" key={item}>
                  <Checkbox defaultChecked={index !== 2} id={id} />
                  <Label htmlFor={id}>{item}</Label>
                </div>
              );
            },
          )}
        </div>
        <Button type="button" variant="outline">
          <Upload className="size-4" strokeWidth={1.8} />
          Upload bukti
        </Button>
      </CardContent>
    </Card>
  );
}

function DraftsCard() {
  return (
    <Card className="rounded-xl border-[#d9ded4] shadow-[0_14px_42px_rgba(34,43,34,0.06)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <WifiOff className="size-5 text-[#245c3f]" strokeWidth={1.8} />
          Draft lokal
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {verifierDrafts.map((draft) => (
          <div className="rounded-lg border border-[#d9ded4] bg-[#fbfcf8] p-4" key={draft.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{draft.title}</p>
                <p className="mt-1 text-xs text-[#657164]">{draft.updatedAt}</p>
              </div>
              <span className="text-sm font-semibold">{draft.completion}%</span>
            </div>
            <Progress className="mt-3 h-1.5 bg-[#e6eae2]" value={draft.completion} />
            <p className="mt-2 text-xs text-[#657164]">Kurang: {draft.missing}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function TaskRow({ caseItem }: { caseItem: AidCase }) {
  return (
    <article className="grid gap-4 rounded-xl border border-[#d9ded4] bg-[#fbfcf8] p-4 lg:grid-cols-[1fr_auto] lg:items-center">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold">{caseItem.applicant.name}</p>
          <StatusBadge status={caseItem.status} />
        </div>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#657164]">{caseItem.problem}</p>
        <div className="mt-3 flex flex-wrap gap-3 text-sm text-[#657164]">
          <IconText icon={MapPin} text={caseItem.hadKifayah.region} />
          <IconText icon={Phone} text={caseItem.applicant.phone} />
          <IconText icon={Home} text={caseItem.applicant.housingStatus} />
        </div>
      </div>
      <div className="flex flex-wrap gap-2 lg:justify-end">
        <Button size="sm" type="button" variant="outline">
          <Navigation className="size-4" strokeWidth={1.8} />
          Rute
        </Button>
        <Button className="bg-[#1f5f43] text-white hover:bg-[#194d38]" size="sm" type="button">
          Buka
          <ArrowUpRight className="size-4" strokeWidth={1.8} />
        </Button>
      </div>
    </article>
  );
}

function CaseSummary({ caseItem }: { caseItem: AidCase }) {
  return (
    <div className="grid gap-4 rounded-xl border border-[#d9ded4] bg-[#f7f8f4] p-4 md:grid-cols-[1fr_auto] md:items-center">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold">{caseItem.applicant.name}</p>
          <Badge className="rounded-md border-[#d9ded4] bg-white text-[#4f554d]" variant="outline">
            {caseItem.caseNumber}
          </Badge>
          <Badge className="rounded-md border-[#c8d8c8] bg-white text-[#245c3f]" variant="outline">
            {caseItem.program}
          </Badge>
        </div>
        <p className="mt-2 text-sm leading-6 text-[#657164]">{caseItem.problem}</p>
      </div>
      <div className="text-left md:text-right">
        <p className="text-xs text-[#657164]">Diajukan</p>
        <p className="mt-1 font-medium">{formatDate(caseItem.submittedAt)}</p>
      </div>
    </div>
  );
}

function FormPanel({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="grid gap-4 rounded-xl border border-[#d9ded4] bg-white p-4">
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

function Field({ label, type = "text", value }: { label: string; type?: string; value: string }) {
  const id = label.toLowerCase().replace(/\W+/g, "-");

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} defaultValue={value} />
    </div>
  );
}

function TextareaField({ label, value }: { label: string; value: string }) {
  const id = label.toLowerCase().replace(/\W+/g, "-");

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea id={id} defaultValue={value} />
    </div>
  );
}

function SelectField({
  label,
  options,
  value,
}: {
  label: string;
  options: string[];
  value: string;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Select defaultValue={value}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function UploadSlot({ document, label }: { document?: boolean; label: string }) {
  const Icon = document ? FileText : Camera;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-dashed border-[#bfc9bd] bg-white p-3">
      <span className="grid size-10 place-items-center rounded-lg bg-[#eef6ec] text-[#245c3f]">
        <Icon className="size-5" strokeWidth={1.8} />
      </span>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-[#657164]">Belum diunggah</p>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
}) {
  return (
    <Card className="rounded-xl border-[#d9ded4] bg-white shadow-[0_10px_32px_rgba(34,43,34,0.05)]">
      <CardContent className="flex items-center gap-4 p-5">
        <span className="grid size-11 place-items-center rounded-lg bg-[#eef6ec] text-[#245c3f]">
          <Icon className="size-5" strokeWidth={1.8} />
        </span>
        <div>
          <p className="text-sm text-[#657164]">{label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusPill({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-[#d9ded4] bg-white px-3 py-2">
      <div className="flex items-center gap-2 text-xs text-[#657164]">
        <Icon className="size-4 text-[#245c3f]" strokeWidth={1.8} />
        {label}
      </div>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function IconText({
  icon: Icon,
  text,
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  text: string;
}) {
  return (
    <span className="flex items-center gap-2">
      <Icon className="size-4 text-[#245c3f]" strokeWidth={1.8} />
      {text}
    </span>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-[#657164]">{label}</span>
      <span className="max-w-[58%] text-right font-medium">{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: WorkflowStatus }) {
  return (
    <Badge className={`rounded-md border ${statusTone[status]}`} variant="outline">
      {statusLabels[status]}
    </Badge>
  );
}
