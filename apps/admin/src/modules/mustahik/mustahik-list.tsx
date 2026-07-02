// Mustahik — master profile of penerima manfaat (unique by NIK), API-backed with
// server-side search + pagination. A row opens the person's most recent case.
import { formatDate, statusLabels } from "@repo/sip-domain";
import { Badge } from "@repo/ui/components/badge";
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
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";
import { TablePagination } from "../../components/pagination";
import { mustahikQueryOptions } from "./services";

export function MustahikList({
  page,
  onPageChange,
}: {
  page: number;
  onPageChange: (next: number) => void;
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"all" | "true" | "false">("all");
  const resetPage = () => onPageChange(1);

  const { data, isPending } = useQuery(
    mustahikQueryOptions({
      q: query.trim() || undefined,
      isRutin: kind === "all" ? undefined : kind,
      page,
    }),
  );

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const perPage = data?.perPage ?? 10;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

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
              placeholder="Cari nama, NIK, atau alamat"
              value={query}
            />
          </div>
          <NativeSelect
            onChange={(e) => {
              setKind(e.target.value as typeof kind);
              resetPage();
            }}
            size="sm"
            value={kind}
          >
            <NativeSelectOption value="all">Semua jenis</NativeSelectOption>
            <NativeSelectOption value="false">Insidental</NativeSelectOption>
            <NativeSelectOption value="true">Binaan rutin</NativeSelectOption>
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
              <TableHead className="pr-4">Kasus terakhir</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell className="py-12 text-center text-muted-foreground text-sm" colSpan={7}>
                  {isPending ? "Memuat mustahik…" : "Tidak ada mustahik yang cocok."}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((m) => {
                const latest = m.cases[0];
                return (
                  <TableRow
                    className={latest ? "cursor-pointer" : undefined}
                    key={m.id}
                    onClick={() =>
                      latest && navigate({ to: "/kasus/$caseId", params: { caseId: latest.id } })
                    }
                  >
                    <TableCell className="pl-4">
                      <div className="grid gap-0.5">
                        <span className="flex items-center gap-2 font-medium">
                          {m.name}
                          {m.isRutin ? <Badge variant="secondary">Rutin</Badge> : null}
                        </span>
                        <span className="max-w-[260px] truncate text-muted-foreground text-xs">
                          {m.address}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground text-xs">
                      {m.nik}
                    </TableCell>
                    <TableCell className="text-sm">{m.region?.city ?? "—"}</TableCell>
                    <TableCell className="text-sm">
                      {m.age} · {m.gender === "Perempuan" ? "P" : "L"}
                    </TableCell>
                    <TableCell className="text-sm tabular-nums">{m.dependents}</TableCell>
                    <TableCell className="text-sm">
                      {m._count.cases} kasus
                      {m._count.rutinBeneficiaries > 0
                        ? ` · ${m._count.rutinBeneficiaries} rutin`
                        : ""}
                    </TableCell>
                    <TableCell className="pr-4 text-sm">
                      {latest
                        ? `${latest.program.name} · ${statusLabels[latest.status]} · ${formatDate(latest.submittedAt)}`
                        : "—"}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        <TablePagination
          from={from}
          label="mustahik"
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
