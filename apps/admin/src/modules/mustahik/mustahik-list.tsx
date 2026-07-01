// Mustahik — master profile of penerima manfaat, derived from the caseload (unique by
// NIK). Search + filter; a row opens the person's most recent case. Mock data.
import { aidCases, formatCurrency, type AidCase, type Applicant } from "@repo/sip-domain";
import { Input } from "@repo/ui/components/input";
import { NativeSelect, NativeSelectOption } from "@repo/ui/components/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { TablePagination, paginate } from "../../components/pagination";

type MustahikEntry = {
  applicant: Applicant;
  region: string;
  cases: AidCase[];
  totalRecommended: number;
};

const mustahikList: MustahikEntry[] = (() => {
  const byNik = new Map<string, MustahikEntry>();
  for (const c of aidCases) {
    const key = c.applicant.nik;
    const entry =
      byNik.get(key) ??
      ({
        applicant: c.applicant,
        region: c.hadKifayah.region,
        cases: [],
        totalRecommended: 0,
      } satisfies MustahikEntry);
    entry.cases.push(c);
    entry.totalRecommended += c.hadKifayah.recommendedAid;
    byNik.set(key, entry);
  }
  return [...byNik.values()].sort((a, b) => a.applicant.name.localeCompare(b.applicant.name));
})();

const regions = [...new Set(mustahikList.map((m) => m.region))];

export function MustahikList({
  page,
  onPageChange,
}: {
  page: number;
  onPageChange: (next: number) => void;
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("all");
  const resetPage = () => onPageChange(1);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mustahikList.filter((m) => {
      if (region !== "all" && m.region !== region) return false;
      if (!q) return true;
      return (
        m.applicant.name.toLowerCase().includes(q) ||
        m.applicant.nik.includes(q) ||
        m.region.toLowerCase().includes(q)
      );
    });
  }, [query, region]);
  const paged = paginate(rows, page);

  return (
    <div className="mx-auto grid max-w-[1440px] gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Mustahik</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Profil calon penerima manfaat beserta riwayat bantuannya.
          </p>
        </div>
      </header>

      <div className="rounded-xl border bg-background">
        <div className="flex flex-wrap items-center gap-3 border-b p-4">
          <div className="relative min-w-56 flex-1">
            <Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
            <Input
              className="h-9 pl-9"
              onChange={(e) => {
                setQuery(e.target.value);
                resetPage();
              }}
              placeholder="Cari nama, NIK, atau wilayah"
              value={query}
            />
          </div>
          <NativeSelect
            onChange={(e) => {
              setRegion(e.target.value);
              resetPage();
            }}
            size="sm"
            value={region}
          >
            <NativeSelectOption value="all">Semua wilayah</NativeSelectOption>
            {regions.map((r) => (
              <NativeSelectOption key={r} value={r}>
                {r}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="pl-4">Nama</TableHead>
              <TableHead>NIK</TableHead>
              <TableHead>Wilayah</TableHead>
              <TableHead>Usia / JK</TableHead>
              <TableHead>Tanggungan</TableHead>
              <TableHead>Riwayat</TableHead>
              <TableHead className="pr-4 text-right">Total rekomendasi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell className="py-12 text-center text-muted-foreground text-sm" colSpan={7}>
                  Tidak ada mustahik yang cocok.
                </TableCell>
              </TableRow>
            ) : (
              paged.pageRows.map((m) => {
                const latest = m.cases[m.cases.length - 1];
                return (
                  <TableRow
                    className="cursor-pointer"
                    key={m.applicant.nik}
                    onClick={() =>
                      navigate({ to: "/kasus/$caseId", params: { caseId: latest.id } })
                    }
                  >
                    <TableCell className="pl-4">
                      <div className="grid gap-0.5">
                        <span className="font-medium">{m.applicant.name}</span>
                        <span className="max-w-[260px] truncate text-muted-foreground text-xs">
                          {m.applicant.address}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground text-xs">
                      {m.applicant.nik}
                    </TableCell>
                    <TableCell className="text-sm">{m.region}</TableCell>
                    <TableCell className="text-sm">
                      {m.applicant.age} · {m.applicant.gender === "Perempuan" ? "P" : "L"}
                    </TableCell>
                    <TableCell className="text-sm tabular-nums">{m.applicant.dependents}</TableCell>
                    <TableCell className="text-sm">{m.cases.length} bantuan</TableCell>
                    <TableCell className="pr-4 text-right font-medium tabular-nums">
                      {formatCurrency(m.totalRecommended)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        <TablePagination
          from={paged.from}
          label="mustahik"
          onPageChange={onPageChange}
          page={paged.page}
          pageCount={paged.pageCount}
          to={paged.to}
          total={paged.total}
        />
      </div>
    </div>
  );
}
