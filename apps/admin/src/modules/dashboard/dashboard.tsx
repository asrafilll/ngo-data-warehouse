// Superadmin dashboard — minimalist ops console, token-driven. All aggregates come
// pre-computed from GET /reports/dashboard; this file only renders. Composition covers
// the whole domain: volume, dana (keputusan/penyaluran/rutin/donasi), tren, wilayah,
// program, alur + kasus macet, beban verifikator, rutin periode berjalan, demografi.
import {
  formatCurrency,
  formatDateTime,
  statusLabels,
  type WorkflowStatus,
} from "@repo/sip-domain";
import { cn } from "@repo/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, ArrowUpRight, Clock, MapPin, Scale } from "lucide-react";
import { useState } from "react";
import { SipLogo } from "../../components/logo";
import { BarList, Sparkline } from "./charts";
import { dashboardQueryOptions, type DashboardData } from "./services";

export function Dashboard() {
  const { data: d, isPending } = useQuery(dashboardQueryOptions);

  if (isPending || !d) {
    return <p className="py-16 text-center text-muted-foreground text-sm">Memuat dashboard…</p>;
  }

  return (
    <div className="mx-auto grid max-w-[1440px] gap-px rounded-xl border bg-border text-foreground [&>*]:bg-background">
      {/* command strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-t-xl px-6 py-4">
        <div className="flex items-center gap-3">
          <SipLogo className="size-8 rounded-md" />
          <div>
            <p className="font-medium text-sm leading-none">Superadmin overview</p>
            <p className="mt-1 text-muted-foreground text-xs">
              Seluruh wilayah · siklus {d.period.label}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <TrendInline trend={d.trend} />
        </div>
      </div>

      {/* KPI ledger — volume */}
      <div className="grid grid-cols-2 gap-px bg-border lg:grid-cols-4 [&>*]:bg-background">
        <Kpi label="Total pengajuan" sub="seluruh periode tercatat" value={`${d.volume.total}`} />
        <Kpi
          label={`Pengajuan ${d.period.label}`}
          sub="volume periode berjalan"
          value={`${d.period.count}`}
        />
        <Kpi
          label="Butuh tindakan"
          sub={`${d.volume.triage} triase · ${d.volume.approval} keputusan · ${d.volume.disbursement} salur`}
          value={`${d.volume.needsAction}`}
        />
        <Kpi
          label="Tingkat penyelesaian"
          sub={
            d.volume.avgProcessDays !== null
              ? `rata-rata proses ${d.volume.avgProcessDays} hari`
              : "kasus selesai / total"
          }
          value={`${d.volume.completionRate}%`}
        />
      </div>

      {/* KPI ledger — dana */}
      <div className="grid grid-cols-2 gap-px bg-border lg:grid-cols-4 [&>*]:bg-background">
        <Kpi
          label="Dana disetujui"
          sub="keputusan pengurus, insidental"
          value={formatCurrency(d.money.approvedTotal)}
        />
        <Kpi
          label="Dana tersalur"
          sub="insidental + rutin periode ini"
          value={formatCurrency(d.money.disbursedTotal)}
        />
        <Kpi
          label="Komitmen rutin / bln"
          sub="roster aktif santunan bulanan"
          value={formatCurrency(d.money.rutinMonthlyCommitment)}
        />
        <Kpi
          label="Donasi tercatat"
          sub={`${d.money.donorRecurring} rutin · ${d.money.donorDormant} perlu follow-up`}
          value={formatCurrency(d.money.donorRecorded)}
        />
      </div>

      {/* body */}
      <div className="grid gap-px bg-border xl:grid-cols-[1.4fr_1fr] [&>*]:bg-background">
        {/* left column */}
        <div className="grid content-start gap-6 p-6">
          <GeoDistribution geo={d.geo} total={d.volume.total} />

          <section className="grid gap-6 border-t pt-6 sm:grid-cols-2">
            <div>
              <SectionTitle sub="jumlah pengajuan" title="Program · kuantitas" />
              <div className="mt-4">
                <BarList items={d.programsQty.map((p) => ({ label: p.label, value: p.count }))} />
              </div>
            </div>
            <div>
              <SectionTitle sub="nilai disetujui / rekomendasi" title="Program · rupiah" />
              <div className="mt-4">
                <BarList
                  color="var(--color-foreground)"
                  format={(n) => formatCurrency(n)}
                  items={d.programsValue.map((p) => ({ label: p.label, value: p.value }))}
                />
              </div>
            </div>
          </section>

          <section className="border-t pt-6">
            <SectionTitle sub="posisi kasus + rata-rata umur di tahap" title="Alur & bottleneck" />
            <div className="mt-4 grid gap-2 sm:grid-cols-2 sm:gap-x-8">
              {d.funnel.map((f) => (
                <div
                  className="grid grid-cols-[110px_1fr_auto] items-center gap-3 text-sm"
                  key={f.status}
                >
                  <span className="text-muted-foreground">{f.label}</span>
                  <div className="h-6 overflow-hidden rounded-md bg-muted">
                    <div
                      className="flex h-full items-center rounded-md bg-primary/85 px-2 text-primary-foreground text-xs tabular-nums transition-all"
                      style={{
                        width: `${Math.max(8, (f.count / Math.max(...d.funnel.map((x) => x.count), 1)) * 100)}%`,
                      }}
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
              sub="total donasi menurut preferensi donatur vs nilai kebutuhan program"
              title="Pendanaan vs kebutuhan"
            />
            <div className="mt-4 grid gap-3">
              {d.funding.map((f) => (
                <FundingRow key={f.program} row={f} />
              ))}
              <p className="text-muted-foreground text-xs">
                Preferensi donatur bersifat indikasi — dana "Umum" tidak dialokasikan per program.
              </p>
            </div>
          </section>

          <section className="border-t pt-6">
            <SectionTitle
              sub={`profil mustahik · rata-rata ${d.demographics.avgDependents} tanggungan / kasus`}
              title="Demografi"
            />
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              <MiniDist items={d.demographics.marital} title="Status pernikahan" />
              <MiniDist items={d.demographics.housing} title="Status tempat tinggal" />
              <MiniDist items={d.demographics.gender} title="Jenis kelamin" />
              <MiniDist items={d.demographics.eligibility} title="Kelayakan asnaf" />
            </div>
          </section>
        </div>

        {/* right rail */}
        <div className="grid content-start gap-6 p-6">
          <section>
            <div className="flex items-center justify-between">
              <SectionTitle
                sub="kasus aktif terlama di tahapnya — prioritas ditindak"
                title="Kasus macet"
              />
              <Link
                className="flex items-center gap-1 text-muted-foreground text-xs hover:text-foreground"
                to="/bantuan-insidental"
              >
                Semua <ArrowRight className="size-3" />
              </Link>
            </div>
            <div className="mt-4 grid gap-2">
              {d.stuckCases.map((c) => (
                <Link
                  className="group flex items-center gap-3 rounded-md border px-3 py-2.5 transition hover:border-foreground/30 hover:bg-muted/50"
                  key={c.id}
                  params={{ caseId: c.id }}
                  to="/kasus/$caseId"
                >
                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-md text-xs tabular-nums",
                      c.daysInStage >= 7
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {c.daysInStage}h
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-sm">{c.name}</p>
                    <p className="truncate text-muted-foreground text-xs">
                      {c.caseNumber} · {c.region} · {c.verifierName ?? "belum ditugaskan"}
                    </p>
                  </div>
                  <span className="shrink-0 text-muted-foreground text-xs">
                    {statusLabels[c.status as WorkflowStatus]}
                  </span>
                  <ArrowUpRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          </section>

          <section className="border-t pt-6">
            <SectionTitle sub="kasus aktif per verifikator wilayah" title="Beban verifikator" />
            <div className="mt-4">
              <BarList
                items={d.verifierLoad.map((v) => ({
                  label: v.name,
                  value: v.open,
                  hint: v.region,
                }))}
              />
            </div>
          </section>

          <section className="border-t pt-6">
            <div className="flex items-center justify-between">
              <SectionTitle
                sub={`penyaluran santunan ${d.period.label}`}
                title="Rutin periode ini"
              />
              <Link
                className="flex items-center gap-1 text-muted-foreground text-xs hover:text-foreground"
                to="/bantuan-rutin"
              >
                Kelola <ArrowRight className="size-3" />
              </Link>
            </div>
            <div className="mt-4 grid gap-3">
              {d.rutinProgress.map((p) => (
                <RutinRow key={p.programId} row={p} />
              ))}
            </div>
          </section>

          <section className="flex items-start gap-3 border-t pt-6">
            <span className="grid size-9 shrink-0 place-items-center rounded-md bg-muted">
              <Scale className="size-4 text-muted-foreground" strokeWidth={1.8} />
            </span>
            <div className="min-w-0 flex-1">
              <SectionTitle
                sub={`${d.override.decidedCount} keputusan dibanding rekomendasi Had Kifayah`}
                title="Override pengurus"
              />
              <p className="mt-2 font-semibold text-xl tabular-nums">
                {d.override.avgPct === null
                  ? "—"
                  : `${d.override.avgPct > 0 ? "+" : ""}${d.override.avgPct}%`}
              </p>
              <p className="mt-1 text-muted-foreground text-xs">
                {d.override.avgPct === null
                  ? "Belum ada keputusan nominal."
                  : d.override.avgPct < 0
                    ? "Rata-rata keputusan di bawah rekomendasi sistem."
                    : "Rata-rata keputusan di atas rekomendasi sistem."}
              </p>
            </div>
          </section>

          <section className="border-t pt-6">
            <SectionTitle sub="peristiwa alur terakhir" title="Aktivitas terbaru" />
            <ol className="mt-4 grid gap-0">
              {d.recentActivity.map((a, i) => (
                <li className="relative flex gap-3 pb-4 last:pb-0" key={a.id}>
                  {i < d.recentActivity.length - 1 ? (
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
                      {a.caseNumber} · {a.actor} · {formatDateTime(a.at)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}

// 8-week submission trend, inline in the command strip.
function TrendInline({ trend }: { trend: DashboardData["trend"] }) {
  const total = trend.reduce((t, w) => t + w.count, 0);
  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <p className="font-medium text-sm tabular-nums leading-none">{total}</p>
        <p className="mt-1 text-muted-foreground text-xs">pengajuan · 8 pekan</p>
      </div>
      <Sparkline
        data={trend.map((w) => w.count)}
        fill="var(--color-primary)"
        height={30}
        stroke="var(--color-primary)"
        width={110}
      />
    </div>
  );
}

function GeoDistribution({ geo, total }: { geo: DashboardData["geo"]; total: number }) {
  const [mode, setMode] = useState<"provinsi" | "kota">("provinsi");
  const items = (mode === "provinsi" ? geo.provinces : geo.cities).map((r) => ({
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
        <MapPin className="size-3.5" /> {items.length} {mode} · {total} pengajuan
      </div>
      <div className="mt-3">
        <BarList items={items} />
      </div>
    </section>
  );
}

// Demand vs supply per program: kebutuhan bar (primary) over donasi bar (foreground).
function FundingRow({ row }: { row: DashboardData["funding"][number] }) {
  const max = Math.max(row.demand, row.supply, 1);
  const gap = row.supply - row.demand;
  return (
    <div className="grid gap-1.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="flex items-center gap-2 truncate font-medium">
          {row.program}
          {gap < 0 ? (
            <AlertTriangle className="size-3.5 text-muted-foreground" strokeWidth={1.8} />
          ) : null}
        </span>
        <span className="shrink-0 text-muted-foreground text-xs tabular-nums">
          {gap >= 0 ? "surplus " : "defisit "}
          {formatCurrency(Math.abs(gap))}
        </span>
      </div>
      <div className="grid gap-1">
        <Meter color="var(--color-primary)" label="kebutuhan" max={max} value={row.demand} />
        <Meter color="var(--color-foreground)" label="donasi" max={max} value={row.supply} />
      </div>
    </div>
  );
}

function Meter({
  value,
  max,
  color,
  label,
}: {
  value: number;
  max: number;
  color: string;
  label: string;
}) {
  return (
    <div className="grid grid-cols-[64px_1fr_auto] items-center gap-2">
      <span className="text-muted-foreground text-xs">{label}</span>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.max(2, (value / max) * 100)}%`, background: color }}
        />
      </div>
      <span className="text-muted-foreground text-xs tabular-nums">{formatCurrency(value)}</span>
    </div>
  );
}

function RutinRow({ row }: { row: DashboardData["rutinProgress"][number] }) {
  const pct = row.total ? Math.round((row.disbursed / row.total) * 100) : 0;
  return (
    <div className="grid gap-1.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="truncate font-medium">{row.name}</span>
        <span className="shrink-0 text-muted-foreground text-xs tabular-nums">
          {row.disbursed}/{row.total} · {formatCurrency(row.nominalDisbursed)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", pct === 100 ? "bg-primary" : "bg-primary/60")}
          style={{ width: `${Math.max(2, pct)}%` }}
        />
      </div>
    </div>
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
      <p className="font-medium text-muted-foreground text-xs">{title}</p>
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
