// Superadmin dashboard — minimalist ops console, token-driven (theming / dark-mode
// ready). Content anchored on what intake data yields at launch: volume, geography,
// program mix, demographics, workflow health. Money metrics (donasi, gap) deferred
// until those modules exist.
import { formatCurrency, getAssignedVerifier } from "@repo/sip-domain";
import { cn } from "@repo/ui/lib/utils";
import { ArrowRight, ArrowUpRight, Command, Clock, MapPin } from "lucide-react";
import { useState } from "react";
import { SipLogo } from "../../components/logo";
import { BarList, Donut } from "./charts";
import {
  aidCases,
  aidTypeMix,
  approvalQueue,
  avgDependents,
  completionRate,
  disbursementQueue,
  eligibilityMix,
  funnel,
  funnelMax,
  genderMix,
  housingMix,
  kotaMix,
  maritalMix,
  needsAction,
  periodCount,
  periodLabel,
  programByQty,
  programByValue,
  provinceMix,
  recentActivity,
  regionalIndex,
  statusLabels,
  totalPengajuan,
  triageQueue,
} from "./data";

const eligColors = [
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

export function Dashboard() {
  return (
    <div className="mx-auto grid max-w-[1440px] gap-px rounded-xl border bg-border text-foreground [&>*]:bg-background">
      {/* command strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-t-xl px-6 py-4">
        <div className="flex items-center gap-3">
          <SipLogo className="size-8 rounded-md" />
          <div>
            <p className="font-medium text-sm leading-none">Superadmin overview</p>
            <p className="mt-1 text-muted-foreground text-xs">
              Seluruh wilayah · siklus {periodLabel}
            </p>
          </div>
        </div>
        <button
          className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-muted-foreground text-xs transition hover:bg-muted"
          type="button"
        >
          <Command className="size-3.5" /> Cari apa saja
          <kbd className="rounded bg-muted px-1.5 py-0.5 text-[10px]">⌘K</kbd>
        </button>
      </div>

      {/* KPI ledger — volume */}
      <div className="grid grid-cols-2 gap-px bg-border lg:grid-cols-4 [&>*]:bg-background">
        <Kpi label="Total pengajuan" sub="seluruh periode tercatat" value={`${totalPengajuan}`} />
        <Kpi
          label={`Pengajuan ${periodLabel}`}
          sub="volume periode berjalan"
          value={`${periodCount}`}
        />
        <Kpi
          label="Butuh tindakan"
          sub="triase · keputusan · penyaluran"
          value={`${needsAction}`}
        />
        <Kpi
          label="Tingkat penyelesaian"
          sub="kasus selesai / total"
          value={`${completionRate}%`}
        />
      </div>

      {/* body */}
      <div className="grid gap-px bg-border xl:grid-cols-[1.4fr_1fr] [&>*]:bg-background">
        {/* left column */}
        <div className="grid content-start gap-6 p-6">
          <GeoDistribution />

          <section className="grid gap-6 border-t pt-6 sm:grid-cols-2">
            <div>
              <SectionTitle sub="jumlah pengajuan" title="Program · kuantitas" />
              <div className="mt-4">
                <BarList items={programByQty.map((p) => ({ label: p.label, value: p.count }))} />
              </div>
            </div>
            <div>
              <SectionTitle sub="nilai disetujui / rekomendasi" title="Program · rupiah" />
              <div className="mt-4">
                <BarList
                  color="var(--color-foreground)"
                  format={(n) => formatCurrency(n)}
                  items={programByValue.map((p) => ({ label: p.label, value: p.value }))}
                />
              </div>
            </div>
          </section>

          <section className="border-t pt-6">
            <SectionTitle sub="posisi kasus + rata-rata umur di tahap" title="Alur & bottleneck" />
            <div className="mt-4 grid gap-2 sm:grid-cols-2 sm:gap-x-8">
              {funnel.map((f) => (
                <div
                  className="grid grid-cols-[110px_1fr_auto] items-center gap-3 text-sm"
                  key={f.status}
                >
                  <span className="text-muted-foreground">{f.label}</span>
                  <div className="h-6 overflow-hidden rounded-md bg-muted">
                    <div
                      className="flex h-full items-center rounded-md bg-primary/85 px-2 text-primary-foreground text-xs tabular-nums transition-all"
                      style={{ width: `${Math.max(8, (f.count / funnelMax) * 100)}%` }}
                    >
                      {f.count}
                    </div>
                  </div>
                  <span className="w-20 text-right text-muted-foreground text-xs tabular-nums">
                    {f.hereNow > 0 ? `${f.hereNow} · ${f.avgAge}h` : "—"}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="border-t pt-6">
            <SectionTitle
              sub={`profil mustahik · rata-rata ${avgDependents} tanggungan / kasus`}
              title="Demografi"
            />
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              <MiniDist items={maritalMix} title="Status pernikahan" />
              <MiniDist items={housingMix} title="Status tempat tinggal" />
              <MiniDist items={genderMix} title="Jenis kelamin" />
              <MiniDist
                items={eligibilityMix.map((e) => ({ label: e.label, count: e.count }))}
                title="Kelayakan asnaf"
              />
            </div>
          </section>
        </div>

        {/* right rail */}
        <div className="grid content-start gap-6 p-6">
          <section>
            <SectionTitle sub="peristiwa alur terakhir tiap kasus" title="Aktivitas terbaru" />
            <ol className="mt-4 grid gap-0">
              {recentActivity.map((a, i) => (
                <li className="relative flex gap-3 pb-4 last:pb-0" key={a.caseNumber}>
                  {i < recentActivity.length - 1 ? (
                    <span className="absolute top-6 left-[11px] h-full w-px bg-border" />
                  ) : null}
                  <span className="z-10 mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border bg-background">
                    <Clock className="size-3 text-muted-foreground" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{a.label}</span>
                      <span className="text-muted-foreground"> · {a.applicant}</span>
                    </p>
                    <p className="truncate text-muted-foreground text-xs">
                      {a.caseNumber} · {a.actor} · {a.at}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="border-t pt-6">
            <div className="flex items-center justify-between">
              <SectionTitle
                sub={`${triageQueue.length} triase · ${approvalQueue.length} keputusan · ${disbursementQueue.length} salur`}
                title="Butuh tindakan"
              />
              <button
                className="flex items-center gap-1 text-muted-foreground text-xs hover:text-foreground"
                type="button"
              >
                Semua <ArrowRight className="size-3" />
              </button>
            </div>
            <div className="mt-4 grid gap-2">
              {[...triageQueue, ...approvalQueue, ...disbursementQueue].map((c) => {
                const v = getAssignedVerifier(c);
                return (
                  <div
                    className="group flex items-center gap-3 rounded-md border px-3 py-2.5 transition hover:border-foreground/30 hover:bg-muted/50"
                    key={c.id}
                  >
                    <span className="size-1.5 rounded-full bg-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-sm">{c.applicant.name}</p>
                      <p className="truncate text-muted-foreground text-xs">
                        {c.caseNumber} · {c.hadKifayah.region} · {v?.name ?? "belum ditugaskan"}
                      </p>
                    </div>
                    <span className="text-muted-foreground text-xs">{statusLabels[c.status]}</span>
                    <ArrowUpRight className="size-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                  </div>
                );
              })}
            </div>
          </section>

          <section className="flex items-center gap-5 border-t pt-6">
            <Donut
              segments={aidTypeMix.map((t, i) => ({ value: t.count, color: eligColors[i] }))}
              size={116}
              thickness={14}
            >
              <div>
                <p className="font-semibold text-xl tabular-nums">{totalPengajuan}</p>
                <p className="text-[10px] text-muted-foreground">kasus</p>
              </div>
            </Donut>
            <div className="grid flex-1 gap-2">
              <SectionTitle sub="insidental vs rutin bulanan" title="Jenis bantuan" />
              {aidTypeMix.map((t, i) => (
                <div className="flex items-center gap-2 text-sm" key={t.label}>
                  <span className="size-2.5 rounded-full" style={{ background: eligColors[i] }} />
                  <span className="flex-1">{t.label}</span>
                  <span className="text-muted-foreground tabular-nums">{t.count}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="border-t pt-6">
            <SectionTitle
              sub="master indeks yang memicu kalkulasi Had Kifayah"
              title="Indeks HK wilayah"
            />
            <div className="mt-4 grid gap-2">
              {regionalIndex.map((r) => (
                <div
                  className="flex items-center gap-3 rounded-md border px-3 py-2.5 text-sm"
                  key={r.id}
                >
                  <span className="grid size-8 place-items-center rounded-md bg-muted">
                    <MapPin className="size-4 text-muted-foreground" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{r.city}</p>
                    <p className="truncate text-muted-foreground text-xs">
                      {r.province} · indeks pangan {r.foodIndex.toFixed(2)}×
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium tabular-nums">
                      {formatCurrency(r.familyMonthlyNeed)}
                    </p>
                    <p className="text-muted-foreground text-xs">per keluarga / bln</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function GeoDistribution() {
  const [mode, setMode] = useState<"provinsi" | "kota">("provinsi");
  const items = (mode === "provinsi" ? provinceMix : kotaMix).map((r) => ({
    label: r.label,
    value: r.count,
  }));
  return (
    <section>
      <div className="flex items-center justify-between">
        <SectionTitle sub="sebaran pengajuan menurut wilayah" title="Wilayah pengajuan" />
        <div className="flex rounded-md border p-0.5 text-xs">
          {(["provinsi", "kota"] as const).map((m) => (
            <button
              className={cn(
                "rounded px-2.5 py-1 capitalize transition",
                mode === m
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              key={m}
              onClick={() => setMode(m)}
              type="button"
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 text-muted-foreground text-xs">
        <MapPin className="size-3.5" /> {items.length} {mode} · {aidCases.length} pengajuan
      </div>
      <div className="mt-3">
        <BarList items={items} />
      </div>
    </section>
  );
}

function MiniDist({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; count: number }>;
}) {
  const total = items.reduce((t, i) => t + i.count, 0) || 1;
  return (
    <div className="grid gap-2.5">
      <p className="font-medium text-xs text-muted-foreground">{title}</p>
      {items.map((it) => (
        <div className="grid gap-1" key={it.label}>
          <div className="flex items-center justify-between text-sm">
            <span className="truncate">{it.label}</span>
            <span className="text-muted-foreground tabular-nums">
              {it.count}{" "}
              <span className="text-muted-foreground/60 text-xs">
                · {Math.round((it.count / total) * 100)}%
              </span>
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary/70"
              style={{ width: `${(it.count / total) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="p-6">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-2 font-semibold text-2xl tabular-nums tracking-tight">{value}</p>
      <p className="mt-3 text-muted-foreground text-xs">{sub}</p>
    </div>
  );
}

function SectionTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <div>
      <h2 className="font-medium text-sm">{title}</h2>
      <p className="mt-0.5 text-muted-foreground text-xs">{sub}</p>
    </div>
  );
}
