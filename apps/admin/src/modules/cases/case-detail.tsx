// Insidental case detail — the workflow centerpiece, fully API-backed. Form 1 data,
// Form 2 (verifikasi, editable saat status ditugaskan), and penyaluran in tabs; a Had
// Kifayah decision panel + timeline in the rail. Every stage transition hits the API.
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  statusLabels,
  statusTone,
  workflowSteps,
} from "@repo/sip-domain";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { NativeSelect, NativeSelectOption } from "@repo/ui/components/native-select";
import { toast } from "@repo/ui/components/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { Textarea } from "@repo/ui/components/textarea";
import { cn } from "@repo/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Clock, ImageIcon, Upload } from "lucide-react";
import { type FormEvent, useState } from "react";
import { usersQueryOptions } from "../pengaturan/services";
import { EmptyState, FormField, Item, Line, Stepper } from "./case-detail-parts";
import {
  caseQueryOptions,
  useAssignMutation,
  useDecisionMutation,
  useDisburseMutation,
  useTriageMutation,
  useVerificationMutation,
} from "./hooks";
import { uploadCasePhoto, type CaseDetail as CaseDetailData } from "./services";

const photoKindLabels: Record<string, string> = {
  hunian: "Hunian",
  penyaluran: "Penyaluran",
  dokumen: "Dokumen",
};

export function CaseDetail({ caseId }: { caseId: string }) {
  const { data: c, isPending, isError } = useQuery(caseQueryOptions(caseId));

  if (isPending) {
    return <p className="py-16 text-center text-muted-foreground text-sm">Memuat kasus…</p>;
  }
  if (isError || !c) {
    return (
      <p className="py-16 text-center text-muted-foreground text-sm">Kasus tidak ditemukan.</p>
    );
  }

  const currentIndex = workflowSteps.findIndex((s) => s.status === c.status);

  return (
    <div className="mx-auto grid max-w-[1440px] gap-6">
      <header className="grid gap-3">
        <Link
          className="flex w-fit items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground"
          to="/bantuan-insidental"
        >
          <ArrowLeft className="size-4" strokeWidth={1.8} />
          Kembali ke Bantuan Insidental
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-semibold text-2xl tracking-tight">{c.mustahik.name}</h1>
              <Badge className={cn("border font-normal", statusTone[c.status])} variant="outline">
                {statusLabels[c.status]}
              </Badge>
            </div>
            <p className="mt-1 text-muted-foreground text-sm">
              {c.caseNumber} · {c.program.name} · {c.hadKifayah.region} · diajukan{" "}
              {formatDate(c.submittedAt)}
            </p>
          </div>
        </div>
      </header>

      <Stepper currentIndex={currentIndex} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* main — tabs */}
        <Tabs className="gap-4" defaultValue="pemohon">
          <TabsList>
            <TabsTrigger value="pemohon">Data Pemohon</TabsTrigger>
            <TabsTrigger value="verifikasi">Verifikasi</TabsTrigger>
            <TabsTrigger value="penyaluran">Penyaluran</TabsTrigger>
          </TabsList>

          <TabsContent value="pemohon">
            <PemohonTab caseItem={c} />
          </TabsContent>
          <TabsContent value="verifikasi">
            <VerifikasiTab caseItem={c} />
          </TabsContent>
          <TabsContent value="penyaluran">
            <PenyaluranTab caseItem={c} />
          </TabsContent>
        </Tabs>

        {/* rail */}
        <aside className="grid content-start gap-6">
          <ActionPanel caseItem={c} />
          <HadKifayahPanel caseItem={c} />
          <TimelineCard caseItem={c} />
        </aside>
      </div>
    </div>
  );
}

// Stage-specific actions: triase (pengurus), penugasan verifikator. Keputusan nominal
// lives in the Had Kifayah panel; penyaluran in its tab.
function ActionPanel({ caseItem: c }: { caseItem: CaseDetailData }) {
  const triage = useTriageMutation(c.id);
  const assign = useAssignMutation(c.id);
  const { data: verifiers = [] } = useQuery(
    usersQueryOptions({ role: "verifikator", active: true }),
  );
  const [verifierId, setVerifierId] = useState("");

  if (c.status === "submitted" || c.status === "needs_revision") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Triase Pengajuan</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          <p className="text-muted-foreground text-xs">{c.nextAction}</p>
          <Button
            disabled={triage.isPending}
            onClick={() =>
              triage.mutate(
                { decision: "approve" },
                { onSuccess: () => toast.success("Kasus diteruskan untuk verifikasi.") },
              )
            }
            type="button"
          >
            Setujui untuk verifikasi
          </Button>
          <div className="grid grid-cols-2 gap-2">
            {c.status !== "needs_revision" ? (
              <Button
                disabled={triage.isPending}
                onClick={() =>
                  triage.mutate(
                    { decision: "needs_revision" },
                    { onSuccess: () => toast("Dikembalikan untuk revisi.") },
                  )
                }
                type="button"
                variant="outline"
              >
                Minta revisi
              </Button>
            ) : null}
            <Button
              disabled={triage.isPending}
              onClick={() =>
                triage.mutate(
                  { decision: "reject" },
                  { onSuccess: () => toast("Pengajuan ditolak.") },
                )
              }
              type="button"
              variant="outline"
            >
              Tolak
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (c.status === "approved_for_verification" || c.status === "assigned") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Penugasan Verifikator</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <p className="text-muted-foreground text-xs">
            {c.assignedVerifier
              ? `Saat ini: ${c.assignedVerifier.name} (${c.assignedVerifier.region ?? "-"})`
              : "Pilih verifikator wilayah domisili pemohon."}
          </p>
          <NativeSelect onChange={(e) => setVerifierId(e.target.value)} value={verifierId}>
            <NativeSelectOption value="">Pilih verifikator…</NativeSelectOption>
            {verifiers.map((v) => (
              <NativeSelectOption key={v.id} value={v.id}>
                {v.name} — {v.region ?? "-"}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <Button
            disabled={!verifierId || assign.isPending}
            onClick={() =>
              assign.mutate(verifierId, {
                onSuccess: () => toast.success("Verifikator ditugaskan."),
              })
            }
            type="button"
          >
            Tugaskan
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
}

function PemohonTab({ caseItem: c }: { caseItem: CaseDetailData }) {
  const a = c.mustahik;
  const monthly = c.hadKifayah.actualMonthlyIncome;
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Identitas & Kondisi</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          <Item label="NIK" value={a.nik} />
          <Item
            label="Tempat, tanggal lahir"
            value={`${a.birthPlace || "-"}${a.birthDate ? `, ${formatDate(a.birthDate)}` : ""}`}
          />
          <Item label="Usia" value={`${a.age} tahun`} />
          <Item label="Jenis kelamin" value={a.gender} />
          <Item label="Status pernikahan" value={a.maritalStatus} />
          <Item label="No. HP" value={a.phone} />
          <Item className="sm:col-span-2" label="Alamat" value={a.address} />
          <Item label="Status tempat tinggal" value={a.housingStatus} />
          <Item label="Pekerjaan" value={a.job} />
          <Item
            label="Penghasilan"
            value={`${formatCurrency(a.incomeAmount)} ${a.incomePeriod} · ≈ ${formatCurrency(monthly)}/bln`}
          />
          <Item label="Jumlah tanggungan" value={`${a.dependents} orang`} />
          <Item label="Sholat 5 waktu" value={a.prayerStatus} />
          <Item label="Merokok" value={a.smokingStatus} />
          <Item label="Status SKTM" value={a.sktmStatus} />
          <Item label="Bersedia dipublikasi" value={a.publishConsent ? "Ya" : "Tidak"} />
          <Item label="Asal informasi" value={a.infoSource} />
          <Item className="sm:col-span-2" label="Masalah yang dihadapi" value={c.problem} />
        </CardContent>
      </Card>

      {c.pelapor ? (
        <Card>
          <CardHeader>
            <CardTitle>Data Pelapor</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            <Item label="Nama" value={c.pelapor.name} />
            <Item label="Hubungan" value={c.pelapor.relation} />
            <Item label="Instansi" value={c.pelapor.institution} />
            <Item label="No. telp" value={c.pelapor.phone} />
            <Item className="sm:col-span-2" label="Alamat" value={c.pelapor.address} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function VerifikasiTab({ caseItem: c }: { caseItem: CaseDetailData }) {
  const v = c.verification;
  const canEdit = c.status === "assigned" || c.status === "approved_for_verification";

  if (!v && !canEdit) {
    return (
      <EmptyState text="Kasus ini belum diverifikasi. Data lapangan (Formulir 2) akan muncul setelah verifikator menyelesaikan survei." />
    );
  }

  if (canEdit) {
    return <VerificationForm caseItem={c} />;
  }

  if (!v) return null;
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Hasil Verifikasi Lapangan (Formulir 2)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-x-8 gap-y-4">
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <span className="text-muted-foreground">
              Verifikator: <span className="text-foreground">{v.verifier?.name ?? "-"}</span>
            </span>
            <span className="text-muted-foreground">
              Wilayah: <span className="text-foreground">{v.coverage || "-"}</span>
            </span>
            <span className="text-muted-foreground">
              Tanggal:{" "}
              <span className="text-foreground">
                {v.verifiedAt ? formatDateTime(v.verifiedAt) : "-"}
              </span>
            </span>
          </div>
          <Item
            label="Penghasilan aktual"
            value={`${formatCurrency(v.actualIncome)}/bln${v.actualJob ? ` · ${v.actualJob}` : ""}`}
          />
          <Item label="Latar belakang" value={v.background} />
          <Item label="Kondisi saat ini" value={v.currentCondition} />
          <Item label="Kebutuhan bantuan" value={v.requestedNeed} />
          <Item label="Upaya yang telah dilakukan" value={v.effortsTaken} />
          <Item label="Pengamatan visual hunian" value={v.housingObservation} />
          <Item label="Track record sosial" value={v.socialRecord} />
          <Item label="Rekomendasi verifikator" value={v.recommendation} />
          <Item label="Kontak kerabat/tetangga" value={v.neighborContact} />
          <Item label="Catatan tambahan" value={v.notes} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dokumentasi</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {c.photos.length === 0 ? (
            <p className="text-muted-foreground text-sm">Belum ada foto tersimpan.</p>
          ) : (
            c.photos.map((photo) => (
              <div className="flex items-center gap-3 rounded-lg border p-3" key={photo.id}>
                <span className="grid size-9 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
                  <ImageIcon className="size-4" strokeWidth={1.8} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-sm">{photo.label || photo.storageKey}</p>
                  <p className="text-muted-foreground text-xs">{photoKindLabels[photo.kind]}</p>
                </div>
                <Badge variant="secondary">Tersimpan</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Formulir 2 — auto-populated from Form 1 (per PRD §3.2); verifikator corrects and
// completes the qualitative findings, uploads housing photos, then submits → surveyed.
function VerificationForm({ caseItem: c }: { caseItem: CaseDetailData }) {
  const mutation = useVerificationMutation(c.id);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    coverage: c.hadKifayah.region,
    actualJob: c.mustahik.job,
    actualIncome: String(c.mustahik.incomeAmount),
    actualIncomePeriod: c.mustahik.incomePeriod as "per hari" | "per pekan" | "per bulan",
    rentCost: c.mustahik.rentCost ? String(c.mustahik.rentCost) : "",
    background: "",
    currentCondition: "",
    requestedNeed: "",
    effortsTaken: "",
    housingObservation: "",
    lengthOfStay: "",
    socialRecord: "",
    recommendation: "",
    neighborContact: "",
    notes: "",
  });
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      const keys: string[] = [];
      for (const file of files) {
        keys.push(await uploadCasePhoto(c.id, "hunian", file));
      }
      mutation.mutate(
        {
          ...form,
          actualIncome: Number(form.actualIncome) || 0,
          rentCost: form.rentCost ? Number(form.rentCost) : null,
          rentPeriod: form.rentCost ? "per_bulan" : "tidak_sewa",
          dependentsDetail: "",
          housingPhotoKeys: keys,
        },
        { onSuccess: () => toast.success("Hasil verifikasi tersimpan. Status: Sudah Verifikasi.") },
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unggah foto gagal.");
    } finally {
      setUploading(false);
    }
  };

  const busy = uploading || mutation.isPending;

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Formulir 2 — Verifikasi Lapangan</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <p className="text-muted-foreground text-xs sm:col-span-2">
            Data pemohon terisi otomatis dari Formulir 1 — koreksi bila ada temuan berbeda di
            lapangan.
          </p>
          <FormField htmlFor="coverage" label="Wilayah cakupan">
            <Input
              id="coverage"
              onChange={(e) => set("coverage", e.target.value)}
              value={form.coverage}
            />
          </FormField>
          <FormField htmlFor="actualJob" label="Pekerjaan aktual">
            <Input
              id="actualJob"
              onChange={(e) => set("actualJob", e.target.value)}
              value={form.actualJob}
            />
          </FormField>
          <FormField htmlFor="actualIncome" label="Penghasilan aktual">
            <Input
              id="actualIncome"
              inputMode="numeric"
              onChange={(e) => set("actualIncome", e.target.value.replace(/\D/g, ""))}
              value={form.actualIncome}
            />
          </FormField>
          <FormField htmlFor="incomePeriod" label="Periode penghasilan">
            <NativeSelect
              className="w-full"
              id="incomePeriod"
              onChange={(e) =>
                set("actualIncomePeriod", e.target.value as typeof form.actualIncomePeriod)
              }
              value={form.actualIncomePeriod}
            >
              <NativeSelectOption value="per hari">per hari</NativeSelectOption>
              <NativeSelectOption value="per pekan">per pekan</NativeSelectOption>
              <NativeSelectOption value="per bulan">per bulan</NativeSelectOption>
            </NativeSelect>
          </FormField>
          <FormField htmlFor="rentCost" label="Biaya sewa/kontrak per bulan (bila ada)">
            <Input
              id="rentCost"
              inputMode="numeric"
              onChange={(e) => set("rentCost", e.target.value.replace(/\D/g, ""))}
              placeholder="Rp"
              value={form.rentCost}
            />
          </FormField>
          <FormField htmlFor="lengthOfStay" label="Lama tinggal di tempat sekarang">
            <Input
              id="lengthOfStay"
              onChange={(e) => set("lengthOfStay", e.target.value)}
              placeholder="mis. 5 tahun"
              value={form.lengthOfStay}
            />
          </FormField>
          {(
            [
              ["background", "Latar belakang"],
              ["currentCondition", "Kondisi saat ini"],
              ["requestedNeed", "Kebutuhan bantuan yang diperlukan"],
              ["effortsTaken", "Usaha & upaya yang telah dilakukan"],
              ["housingObservation", "Pengamatan visual kondisi tempat tinggal"],
              ["socialRecord", "Track record & kondisi sosial di masyarakat"],
              ["recommendation", "Kritik & saran verifikator"],
            ] as const
          ).map(([key, label]) => (
            <FormField className="sm:col-span-2" htmlFor={key} key={key} label={label}>
              <Textarea
                id={key}
                onChange={(e) => set(key, e.target.value)}
                rows={2}
                value={form[key]}
              />
            </FormField>
          ))}
          <FormField htmlFor="neighborContact" label="Kerabat/tetangga yang bisa dihubungi">
            <Input
              id="neighborContact"
              onChange={(e) => set("neighborContact", e.target.value)}
              placeholder="Nama & no. telp"
              value={form.neighborContact}
            />
          </FormField>
          <FormField htmlFor="notes" label="Catatan tambahan">
            <Input id="notes" onChange={(e) => set("notes", e.target.value)} value={form.notes} />
          </FormField>
          <FormField className="sm:col-span-2" htmlFor="photos" label="Foto kondisi hunian">
            <Input
              accept="image/*"
              id="photos"
              multiple
              onChange={(e) => setFiles([...(e.target.files ?? [])])}
              type="file"
            />
            <p className="text-muted-foreground text-xs">
              Foto dikompres & dikonversi WebP otomatis sebelum diunggah.
            </p>
          </FormField>
          <div className="sm:col-span-2">
            <Button disabled={busy} type="submit">
              <Upload className="size-4" strokeWidth={1.8} />
              {busy ? "Menyimpan…" : "Simpan hasil verifikasi"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

function PenyaluranTab({ caseItem: c }: { caseItem: CaseDetailData }) {
  const canDisburse = c.status === "disbursement_pending" || c.status === "approved";
  if (!c.disbursement && !canDisburse) {
    return (
      <EmptyState text="Belum ada penyaluran. Tahap ini aktif setelah pengurus menyetujui nominal bantuan." />
    );
  }

  if (canDisburse) {
    return <DisburseForm caseItem={c} />;
  }

  const d = c.disbursement;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Penyaluran & Penutupan</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
        <Item
          label="Nominal disalurkan"
          value={d ? formatCurrency(d.nominal) : "Menunggu keputusan"}
        />
        <Item
          label="Tanggal penyaluran"
          value={d ? formatDateTime(d.disbursedAt) : "Belum disalurkan"}
        />
        <div className="sm:col-span-2">
          <p className="text-muted-foreground text-xs">Bukti penyaluran</p>
          <div className="mt-2 flex items-center gap-3 rounded-lg border p-3">
            <span className="grid size-9 place-items-center rounded-md bg-muted text-muted-foreground">
              <ImageIcon className="size-4" strokeWidth={1.8} />
            </span>
            <p className="flex-1 truncate text-sm">{d?.buktiKey ?? "Foto serah terima"}</p>
            <Badge variant={d ? "secondary" : "outline"}>
              {d ? "Tersimpan" : "Wajib diunggah"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Penyaluran (tahap 6): verifikator uploads the bukti photo (auto-WebP) — completing
// the upload is what closes the case.
function DisburseForm({ caseItem: c }: { caseItem: CaseDetailData }) {
  const mutation = useDisburseMutation(c.id);
  const [nominal, setNominal] = useState(String(c.decisionNominal ?? ""));
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Bukti foto penyaluran wajib diunggah.");
      return;
    }
    setUploading(true);
    try {
      const buktiKey = await uploadCasePhoto(c.id, "penyaluran", file);
      mutation.mutate(
        { nominal: Number(nominal) || 0, buktiKey },
        { onSuccess: () => toast.success("Bantuan disalurkan. Kasus selesai.") },
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unggah bukti gagal.");
    } finally {
      setUploading(false);
    }
  };

  const busy = uploading || mutation.isPending;

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Penyaluran & Penutupan</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormField htmlFor="d-nominal" label="Nominal disalurkan">
            <Input
              id="d-nominal"
              inputMode="numeric"
              onChange={(e) => setNominal(e.target.value.replace(/\D/g, ""))}
              value={nominal}
            />
            <p className="text-muted-foreground text-xs">
              Keputusan pengurus:{" "}
              {c.decisionNominal ? formatCurrency(c.decisionNominal) : "belum ditetapkan"}
            </p>
          </FormField>
          <FormField htmlFor="d-bukti" label="Bukti foto serah terima">
            <Input
              accept="image/*"
              id="d-bukti"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              type="file"
            />
            <p className="text-muted-foreground text-xs">
              Wajib — status berubah Selesai setelah bukti tersimpan (WebP otomatis).
            </p>
          </FormField>
          <div className="sm:col-span-2">
            <Button disabled={busy || !nominal} type="submit">
              <Upload className="size-4" strokeWidth={1.8} />
              {busy ? "Menyalurkan…" : "Salurkan & tutup kasus"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

function HadKifayahPanel({ caseItem: c }: { caseItem: CaseDetailData }) {
  const hk = c.hadKifayah;
  const decision = useDecisionMutation(c.id);
  const [nominal, setNominal] = useState(String(hk.recommendedAid));
  const componentMax = Math.max(...hk.components.map((x) => x.amount), 1);
  const canDecide = c.status === "surveyed";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kalkulasi Had Kifayah</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <p className="text-muted-foreground text-xs">
          Standar BAZNAS · indeks {hk.region}, {hk.province} · kelayakan{" "}
          <span className="font-medium text-foreground">{hk.eligibility}</span>
        </p>

        <div className="grid gap-2">
          {hk.components.map((x) => (
            <div className="grid gap-1" key={x.label}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{x.label}</span>
                <span className="tabular-nums">{formatCurrency(x.amount)}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary/70"
                  style={{ width: `${(x.amount / componentMax) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-2 border-t pt-4 text-sm">
          <Line label="Kebutuhan keluarga / bln" value={formatCurrency(hk.familyMonthlyNeed)} />
          <Line label="Penghasilan riil / bln" value={formatCurrency(hk.actualMonthlyIncome)} />
          <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
            <span className="font-medium">Defisit (gap)</span>
            <span className="font-semibold tabular-nums">{formatCurrency(hk.financialGap)}</span>
          </div>
          <Line label="Rekomendasi bantuan" strong value={formatCurrency(hk.recommendedAid)} />
        </div>

        {canDecide ? (
          <div className="grid gap-3 border-t pt-4">
            <FormField htmlFor="nominal" label="Nominal keputusan (override)">
              <Input
                id="nominal"
                inputMode="numeric"
                onChange={(e) => setNominal(e.target.value.replace(/\D/g, ""))}
                value={nominal}
              />
            </FormField>
            <div className="grid grid-cols-2 gap-2">
              <Button
                disabled={decision.isPending || !nominal}
                onClick={() =>
                  decision.mutate(
                    { decision: "approve", nominal: Number(nominal) || 0 },
                    {
                      onSuccess: () =>
                        toast.success(`Bantuan ${formatCurrency(Number(nominal) || 0)} disetujui.`),
                    },
                  )
                }
                type="button"
              >
                Setujui bantuan
              </Button>
              <Button
                disabled={decision.isPending}
                onClick={() =>
                  decision.mutate(
                    { decision: "reject" },
                    { onSuccess: () => toast("Pengajuan ditolak.") },
                  )
                }
                type="button"
                variant="outline"
              >
                Tolak
              </Button>
            </div>
          </div>
        ) : (
          <p className="border-t pt-4 text-muted-foreground text-xs">
            Keputusan nominal tersedia saat status kasus{" "}
            <span className="font-medium">Sudah Verifikasi</span>.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function TimelineCard({ caseItem: c }: { caseItem: CaseDetailData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Riwayat</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-muted-foreground text-xs">
          Verifikator ditugaskan: {c.assignedVerifier?.name ?? "belum ada"}
        </p>
        <ol className="grid gap-0">
          {c.events.map((t, i) => (
            <li className="relative flex gap-3 pb-4 last:pb-0" key={t.id}>
              {i < c.events.length - 1 ? (
                <span className="absolute top-6 left-[11px] h-full w-px bg-border" />
              ) : null}
              <span className="z-10 mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border bg-background">
                <Clock className="size-3 text-muted-foreground" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm">{t.label}</p>
                <p className="text-muted-foreground text-xs">
                  {t.actor} · {formatDateTime(t.at)}
                </p>
                <p className="mt-1 text-muted-foreground text-xs">{t.note}</p>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
