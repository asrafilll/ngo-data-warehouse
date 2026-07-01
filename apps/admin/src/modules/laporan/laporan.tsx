// Laporan — operational recap over the caseload: per program, per wilayah, per status,
// with a period filter and (mock) export. Mock data from @repo/sip-domain.
import { aidCases, formatCurrency, statusLabels, type WorkflowStatus } from "@repo/sip-domain";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { NativeSelect, NativeSelectOption } from "@repo/ui/components/native-select";
import { toast } from "@repo/ui/components/sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { Download } from "lucide-react";
import { useMemo, useState } from "react";

const periodOptions = [
  { key: "all", label: "Semua periode" },
  { key: "2026-07", label: "Juli 2026" },
  { key: "2026-06", label: "Juni 2026" },
];

export function Laporan() {
  const [period, setPeriod] = useState("all");

  const cases = useMemo(
    () => (period === "all" ? aidCases : aidCases.filter((c) => c.submittedAt.startsWith(period))),
    [period],
  );

  const totalRecommended = cases.reduce((t, c) => t + c.hadKifayah.recommendedAid, 0);
  const disbursed = cases.filter((c) => c.status === "completed");
  const disbursedAmount = cases.reduce((t, c) => t + (c.decisionNominal ?? 0), 0);

  const perProgram = groupSum(
    cases,
    (c) => c.program,
    (c) => c.hadKifayah.recommendedAid,
  );
  const perWilayah = groupSum(
    cases,
    (c) => c.hadKifayah.region,
    (c) => c.hadKifayah.recommendedAid,
  );
  const perStatus = groupCount(cases, (c) => c.status);

  const exportReport = () => toast.success(`Laporan ${periodLabel(period)} diekspor (mock).`);

  return (
    <div className="mx-auto grid max-w-[1440px] gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Laporan</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Rekap penyaluran bantuan per program, wilayah, dan status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NativeSelect onChange={(e) => setPeriod(e.target.value)} value={period}>
            {periodOptions.map((p) => (
              <NativeSelectOption key={p.key} value={p.key}>
                {p.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <Button onClick={exportReport} type="button">
            <Download className="size-4" strokeWidth={1.8} />
            Ekspor
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border lg:grid-cols-4 [&>*]:bg-background">
        <Stat label="Total pengajuan" value={`${cases.length}`} />
        <Stat label="Selesai" value={`${disbursed.length}`} />
        <Stat label="Total rekomendasi" value={formatCurrency(totalRecommended)} />
        <Stat label="Dana disetujui" value={formatCurrency(disbursedAmount)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ReportTable
          columns={["Program", "Jumlah", "Nilai"]}
          rows={perProgram.map((r) => [r.key, `${r.count}`, formatCurrency(r.value)])}
          title="Rekap per program"
        />
        <ReportTable
          columns={["Wilayah", "Jumlah", "Nilai"]}
          rows={perWilayah.map((r) => [r.key, `${r.count}`, formatCurrency(r.value)])}
          title="Rekap per wilayah"
        />
        <ReportTable
          columns={["Status", "Jumlah"]}
          rows={perStatus.map((r) => [statusLabels[r.key as WorkflowStatus], `${r.count}`])}
          title="Rekap per status"
        />
      </div>
    </div>
  );
}

function ReportTable({
  title,
  columns,
  rows,
}: {
  title: string;
  columns: string[];
  rows: string[][];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columns.map((col, i) => (
                <TableHead
                  className={
                    i === 0 ? "pl-6" : i === columns.length - 1 ? "pr-6 text-right" : "text-right"
                  }
                  key={col}
                >
                  {col}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row[0]}>
                {columns.map((column, i) => {
                  const cell = row[i] ?? "";
                  return (
                    <TableCell
                      className={cn2(
                        i,
                        columns.length,
                        "text-sm",
                        i === 0 ? "pl-6 font-medium" : "text-right tabular-nums",
                      )}
                      key={`${row[0]}-${column}`}
                    >
                      {cell}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function cn2(i: number, len: number, base: string, rest: string) {
  return `${base} ${rest} ${i === len - 1 ? "pr-6" : ""}`.trim();
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-5">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-2 font-semibold text-xl tabular-nums tracking-tight">{value}</p>
    </div>
  );
}

function groupSum<T>(items: T[], key: (t: T) => string, val: (t: T) => number) {
  const map = new Map<string, { count: number; value: number }>();
  for (const it of items) {
    const k = key(it);
    const cur = map.get(k) ?? { count: 0, value: 0 };
    cur.count += 1;
    cur.value += val(it);
    map.set(k, cur);
  }
  return [...map.entries()].map(([k, v]) => ({ key: k, ...v })).sort((a, b) => b.value - a.value);
}

function groupCount<T>(items: T[], key: (t: T) => string) {
  const map = new Map<string, number>();
  for (const it of items) map.set(key(it), (map.get(key(it)) ?? 0) + 1);
  return [...map.entries()]
    .map(([k, count]) => ({ key: k, count }))
    .sort((a, b) => b.count - a.count);
}

function periodLabel(key: string) {
  return periodOptions.find((p) => p.key === key)?.label ?? key;
}
