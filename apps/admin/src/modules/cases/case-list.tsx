// Bantuan Insidental — one-off cases that run the full 6-stage workflow. Searchable +
// filterable table backed by the API (server-side filter + pagination). Rutin bantuan is
// a separate roster (its own menu), so it is excluded here.
import { formatDate, statusLabels, statusTone, type WorkflowStatus } from "@repo/sip-domain";
import { Badge } from "@repo/ui/components/badge";
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
import { cn } from "@repo/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { CalendarDays, Plus, Search } from "lucide-react";
import { useState } from "react";
import { TablePagination } from "../../components/pagination";
import { programsQueryOptions } from "../programs/services";
import { casesQueryOptions } from "./hooks";
import type { CaseListRow } from "./services";

const statusOptions = Object.entries(statusLabels) as Array<[WorkflowStatus, string]>;

export function CaseList({
  page,
  onPageChange,
}: {
  page: number;
  onPageChange: (next: number) => void;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<WorkflowStatus | "all">("all");
  const [program, setProgram] = useState<string>("all");
  const resetPage = () => onPageChange(1);

  const { data: programs = [] } = useQuery(programsQueryOptions({ type: "insidental" }));
  const { data, isPending } = useQuery(
    casesQueryOptions({
      page: String(page),
      q: query.trim() || undefined,
      status: status === "all" ? undefined : status,
      program: program === "all" ? undefined : program,
      aidType: "insidental",
    }),
  );

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const perPage = data?.perPage ?? 10;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  const resetFilters = () => {
    setQuery("");
    setStatus("all");
    setProgram("all");
    resetPage();
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
              onChange={(e) => {
                setQuery(e.target.value);
                resetPage();
              }}
              placeholder="Cari nama, NIK, nomor kasus, atau wilayah"
              value={query}
            />
          </div>
          <NativeSelect
            onChange={(e) => {
              setStatus(e.target.value as WorkflowStatus | "all");
              resetPage();
            }}
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
          <NativeSelect
            onChange={(e) => {
              setProgram(e.target.value);
              resetPage();
            }}
            size="sm"
            value={program}
          >
            <NativeSelectOption value="all">Semua program</NativeSelectOption>
            {programs.map((p) => (
              <NativeSelectOption key={p.id} value={p.name}>
                {p.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          {filtered ? (
            <button
              className="text-muted-foreground text-xs hover:text-foreground"
              onClick={resetFilters}
              type="button"
            >
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
                  {isPending ? "Memuat kasus…" : "Tidak ada kasus yang cocok dengan filter."}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((c) => <CaseRow caseItem={c} key={c.id} />)
            )}
          </TableBody>
        </Table>

        <TablePagination
          from={from}
          label="kasus"
          onPageChange={onPageChange}
          page={page}
          pageCount={pageCount}
          to={to}
          total={total}
        />
      </div>
    </div>
  );
}

function CaseRow({ caseItem: c }: { caseItem: CaseListRow }) {
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
          <span className="font-medium">{c.mustahik.name}</span>
          <span className="max-w-[260px] truncate text-muted-foreground text-xs">
            {c.mustahik.address}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-sm">{c.program.name}</TableCell>
      <TableCell className="text-sm">{c.mustahik.region?.city ?? "—"}</TableCell>
      <TableCell>
        <Badge className={cn("border font-normal", statusTone[c.status])} variant="outline">
          {statusLabels[c.status]}
        </Badge>
      </TableCell>
      <TableCell className="pr-4 text-sm">{c.assignedVerifier?.name ?? "—"}</TableCell>
    </TableRow>
  );
}
