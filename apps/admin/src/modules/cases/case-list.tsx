// Bantuan Insidental — one-off cases that run the full 6-stage workflow. Searchable +
// filterable table, the operational hub the workflow pages branch from. Rutin bantuan is
// a separate roster (its own menu), so it is excluded here. Mock data from @repo/sip-domain.
import {
  aidCases,
  formatDate,
  getAssignedVerifier,
  statusLabels,
  statusTone,
  type AidCase,
  type WorkflowStatus,
} from "@repo/sip-domain";
import { Button } from "@repo/ui/components/button";
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
import { Badge } from "@repo/ui/components/badge";
import { cn } from "@repo/ui/lib/utils";
import { Link, useNavigate } from "@tanstack/react-router";
import { CalendarDays, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";

const incidentalCases = aidCases.filter((c) => c.aidType === "insidental");
const programs = [...new Set(incidentalCases.map((c) => c.program))];
const statusOptions = Object.entries(statusLabels) as Array<[WorkflowStatus, string]>;

export function CaseList() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<WorkflowStatus | "all">("all");
  const [program, setProgram] = useState<string>("all");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return incidentalCases.filter((c) => {
      if (status !== "all" && c.status !== status) return false;
      if (program !== "all" && c.program !== program) return false;
      if (!q) return true;
      return (
        c.applicant.name.toLowerCase().includes(q) ||
        c.caseNumber.toLowerCase().includes(q) ||
        c.applicant.nik.includes(q) ||
        c.hadKifayah.region.toLowerCase().includes(q)
      );
    });
  }, [query, status, program]);

  const resetFilters = () => {
    setQuery("");
    setStatus("all");
    setProgram("all");
  };
  const filtered = query !== "" || status !== "all" || program !== "all";

  return (
    <div className="mx-auto grid max-w-[1440px] gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Bantuan Insidental</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Kasus bantuan sekali selesai — dari pengajuan hingga penyaluran.
          </p>
        </div>
        <Button asChild>
          <Link to="/pengajuan-baru">
            <Plus className="size-4" strokeWidth={1.8} />
            Pengajuan baru
          </Link>
        </Button>
      </header>

      <div className="rounded-xl border bg-background">
        {/* toolbar */}
        <div className="flex flex-wrap items-center gap-3 border-b p-4">
          <div className="relative min-w-56 flex-1">
            <Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
            <Input
              className="h-9 pl-9"
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama, NIK, nomor kasus, atau wilayah"
              value={query}
            />
          </div>
          <NativeSelect
            onChange={(e) => setStatus(e.target.value as WorkflowStatus | "all")}
            size="sm"
            value={status}
          >
            <NativeSelectOption value="all">Semua status</NativeSelectOption>
            {statusOptions.map(([value, label]) => (
              <NativeSelectOption key={value} value={value}>
                {label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <NativeSelect onChange={(e) => setProgram(e.target.value)} size="sm" value={program}>
            <NativeSelectOption value="all">Semua program</NativeSelectOption>
            {programs.map((p) => (
              <NativeSelectOption key={p} value={p}>
                {p}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>

        {/* result meta */}
        <div className="flex items-center justify-between px-4 py-2.5 text-muted-foreground text-xs">
          <span>
            Menampilkan <span className="font-medium text-foreground">{rows.length}</span> dari{" "}
            {incidentalCases.length} kasus
          </span>
          {filtered ? (
            <button className="hover:text-foreground" onClick={resetFilters} type="button">
              Reset filter
            </button>
          ) : null}
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="pl-4">Kasus</TableHead>
              <TableHead>Mustahik</TableHead>
              <TableHead>Program</TableHead>
              <TableHead>Wilayah</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="pr-4">Verifikator</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell className="py-12 text-center text-muted-foreground text-sm" colSpan={6}>
                  Tidak ada kasus yang cocok dengan filter.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((c) => <CaseRow caseItem={c} key={c.id} />)
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function CaseRow({ caseItem: c }: { caseItem: AidCase }) {
  const verifier = getAssignedVerifier(c);
  const navigate = useNavigate();
  return (
    <TableRow
      className="cursor-pointer"
      onClick={() => navigate({ to: "/kasus/$caseId", params: { caseId: c.id } })}
    >
      <TableCell className="pl-4">
        <div className="grid gap-0.5">
          <span className="font-medium">{c.caseNumber}</span>
          <span className="flex items-center gap-1 text-muted-foreground text-xs">
            <CalendarDays className="size-3" strokeWidth={1.8} />
            {formatDate(c.submittedAt)}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <div className="grid gap-0.5">
          <span className="font-medium">{c.applicant.name}</span>
          <span className="max-w-[260px] truncate text-muted-foreground text-xs">
            {c.applicant.address}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-sm">{c.program}</TableCell>
      <TableCell className="text-sm">{c.hadKifayah.region}</TableCell>
      <TableCell>
        <Badge className={cn("border font-normal", statusTone[c.status])} variant="outline">
          {statusLabels[c.status]}
        </Badge>
      </TableCell>
      <TableCell className="pr-4 text-sm">{verifier?.name ?? "—"}</TableCell>
    </TableRow>
  );
}
