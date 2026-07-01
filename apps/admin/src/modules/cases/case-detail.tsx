// Insidental case detail — the workflow centerpiece. Form 1 data, Form 2 (verifikasi),
// and penyaluran in tabs; a Had Kifayah decision panel + timeline in the rail. Mock data
// from @repo/sip-domain; decisions are mocked (toast, no backend).
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getAssignedVerifier,
  getCaseById,
  getMonthlyIncome,
  statusLabels,
  statusTone,
  workflowSteps,
  type AidCase,
} from "@repo/sip-domain";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { toast } from "@repo/ui/components/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { cn } from "@repo/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Clock, ImageIcon } from "lucide-react";
import { type ReactNode, useState } from "react";

export function CaseDetail({ caseId }: { caseId: string }) {
  const c = getCaseById(caseId);
  const verifier = getAssignedVerifier(c);
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
              <h1 className="font-semibold text-2xl tracking-tight">{c.applicant.name}</h1>
              <Badge className={cn("border font-normal", statusTone[c.status])} variant="outline">
                {statusLabels[c.status]}
              </Badge>
            </div>
            <p className="mt-1 text-muted-foreground text-sm">
              {c.caseNumber} · {c.program} · {c.hadKifayah.region} · diajukan{" "}
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
          <HadKifayahPanel caseItem={c} />
          <TimelineCard caseItem={c} verifierName={verifier?.name} />
        </aside>
      </div>
    </div>
  );
}

function Stepper({ currentIndex }: { currentIndex: number }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-3 rounded-xl border bg-background p-4">
      {workflowSteps.map((step, i) => {
        const done = currentIndex >= 0 && i < currentIndex;
        const active = i === currentIndex;
        return (
          <div className="flex items-center gap-2" key={step.status}>
            <span
              className={cn(
                "grid size-6 shrink-0 place-items-center rounded-full border text-xs tabular-nums",
                done && "border-primary bg-primary text-primary-foreground",
                active && "border-primary text-primary",
                !done && !active && "border-border text-muted-foreground",
              )}
            >
              {done ? <Check className="size-3.5" strokeWidth={2.5} /> : i + 1}
            </span>
            <span
              className={cn(
                "text-sm",
                active ? "font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              {step.label}
            </span>
            {i < workflowSteps.length - 1 ? <span className="mx-1 h-px w-6 bg-border" /> : null}
          </div>
        );
      })}
    </div>
  );
}

function PemohonTab({ caseItem: c }: { caseItem: AidCase }) {
  const a = c.applicant;
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
            value={`${a.birthPlace}, ${formatDate(a.birthDate)}`}
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
            value={`${formatCurrency(a.incomeAmount)} ${a.incomePeriod} · ≈ ${formatCurrency(getMonthlyIncome(a))}/bln`}
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

      <Card>
        <CardHeader>
          <CardTitle>Data Pelapor</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          <Item label="Nama" value={c.reporter.name} />
          <Item label="Hubungan" value={c.reporter.relation} />
          <Item label="Instansi" value={c.reporter.institution} />
          <Item label="No. telp" value={c.reporter.phone} />
          <Item className="sm:col-span-2" label="Alamat" value={c.reporter.address} />
        </CardContent>
      </Card>
    </div>
  );
}

function VerifikasiTab({ caseItem: c }: { caseItem: AidCase }) {
  const v = c.verification;
  if (!v) {
    return (
      <EmptyState text="Kasus ini belum diverifikasi. Data lapangan (Formulir 2) akan muncul setelah verifikator menyelesaikan survei." />
    );
  }
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Hasil Verifikasi Lapangan (Formulir 2)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-x-8 gap-y-4">
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <span className="text-muted-foreground">
              Verifikator: <span className="text-foreground">{v.verifierName}</span>
            </span>
            <span className="text-muted-foreground">
              Wilayah: <span className="text-foreground">{v.coverage}</span>
            </span>
            <span className="text-muted-foreground">
              Tanggal: <span className="text-foreground">{formatDateTime(v.verifiedAt)}</span>
            </span>
          </div>
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
          {v.photos.map((photo) => (
            <div className="flex items-center gap-3 rounded-lg border p-3" key={photo.label}>
              <span className="grid size-9 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
                <ImageIcon className="size-4" strokeWidth={1.8} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-sm">{photo.label}</p>
                <p className="text-muted-foreground text-xs">{photo.kind}</p>
              </div>
              <Badge variant={photo.status === "Tersimpan" ? "secondary" : "outline"}>
                {photo.status}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function PenyaluranTab({ caseItem: c }: { caseItem: AidCase }) {
  const proof = c.verification?.photos.find((p) => p.kind === "Penyaluran");
  if (!c.disbursedAt && c.status !== "disbursement_pending") {
    return (
      <EmptyState text="Belum ada penyaluran. Tahap ini aktif setelah pengurus menyetujui nominal bantuan." />
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Penyaluran & Penutupan</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
        <Item
          label="Nominal disalurkan"
          value={c.decisionNominal ? formatCurrency(c.decisionNominal) : "Menunggu keputusan"}
        />
        <Item
          label="Tanggal penyaluran"
          value={c.disbursedAt ? formatDateTime(c.disbursedAt) : "Belum disalurkan"}
        />
        <div className="sm:col-span-2">
          <p className="text-muted-foreground text-xs">Bukti penyaluran</p>
          <div className="mt-2 flex items-center gap-3 rounded-lg border p-3">
            <span className="grid size-9 place-items-center rounded-md bg-muted text-muted-foreground">
              <ImageIcon className="size-4" strokeWidth={1.8} />
            </span>
            <p className="flex-1 text-sm">{proof?.label ?? "Foto serah terima"}</p>
            <Badge variant="outline">{proof?.status ?? "Wajib diunggah"}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function HadKifayahPanel({ caseItem: c }: { caseItem: AidCase }) {
  const hk = c.hadKifayah;
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
          Standar BAZNAS · indeks {hk.region}, {hk.province}
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
            <div className="grid gap-2">
              <Label htmlFor="nominal">Nominal keputusan (override)</Label>
              <Input
                id="nominal"
                inputMode="numeric"
                onChange={(e) => setNominal(e.target.value.replace(/\D/g, ""))}
                value={nominal}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() =>
                  toast.success(`Bantuan ${formatCurrency(Number(nominal) || 0)} disetujui.`)
                }
                type="button"
              >
                Setujui bantuan
              </Button>
              <Button onClick={() => toast("Pengajuan ditolak.")} type="button" variant="outline">
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

function TimelineCard({ caseItem: c, verifierName }: { caseItem: AidCase; verifierName?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Riwayat</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-muted-foreground text-xs">
          Verifikator ditugaskan: {verifierName ?? "belum ada"}
        </p>
        <ol className="grid gap-0">
          {c.timeline.map((t, i) => (
            <li className="relative flex gap-3 pb-4 last:pb-0" key={t.label}>
              {i < c.timeline.length - 1 ? (
                <span className="absolute top-6 left-[11px] h-full w-px bg-border" />
              ) : null}
              <span className="z-10 mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border bg-background">
                <Clock className="size-3 text-muted-foreground" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm">{t.label}</p>
                <p className="text-muted-foreground text-xs">
                  {t.actor} · {t.at}
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

function Item({
  label,
  value,
  className,
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-0.5", className)}>
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("tabular-nums", strong ? "font-semibold" : "font-medium")}>{value}</span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed bg-background p-10 text-center">
      <p className="mx-auto max-w-md text-muted-foreground text-sm">{text}</p>
    </div>
  );
}
