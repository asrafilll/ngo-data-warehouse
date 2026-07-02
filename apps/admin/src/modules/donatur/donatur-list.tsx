// Donatur — fundraising contacts: donation history, recurring commitment, program
// preference. API-backed search + filter + summary.
import { formatCurrency, formatDate } from "@repo/sip-domain";
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
import { cn } from "@repo/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useState } from "react";
import { TablePagination } from "../../components/pagination";
import { donorsQueryOptions } from "./services";

const statusDot: Record<string, string> = {
  Aktif: "bg-primary",
  "Perlu follow-up": "bg-primary/60",
  Dormant: "bg-muted-foreground/40",
};

export function DonaturList({
  page,
  onPageChange,
}: {
  page: number;
  onPageChange: (next: number) => void;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const resetPage = () => onPageChange(1);

  const { data, isPending } = useQuery(
    donorsQueryOptions({
      q: query.trim() || undefined,
      status: status === "all" ? undefined : status,
      type: type === "all" ? undefined : type,
      page,
    }),
  );

  const rows = data?.donors ?? [];
  const stats = data?.stats;
  const total = data?.total ?? 0;
  const perPage = data?.perPage ?? 10;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  return (
    <div className="mx-auto grid max-w-[1440px] gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Donatur</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Kontak donatur, histori donasi, dan komitmen rutin.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border lg:grid-cols-4 [&>*]:bg-background">
        <Stat label="Total donatur" value={`${stats?.total ?? 0}`} />
        <Stat label="Donatur aktif" value={`${stats?.active ?? 0}`} />
        <Stat label="Komitmen rutin" value={`${stats?.recurring ?? 0}`} />
        <Stat label="Total donasi tercatat" value={formatCurrency(stats?.totalDonation ?? 0)} />
      </div>

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
              placeholder="Cari nama donatur atau preferensi program"
              value={query}
            />
          </div>
          <NativeSelect
            onChange={(e) => {
              setType(e.target.value);
              resetPage();
            }}
            size="sm"
            value={type}
          >
            <NativeSelectOption value="all">Semua jenis</NativeSelectOption>
            <NativeSelectOption value="Individu">Individu</NativeSelectOption>
            <NativeSelectOption value="Komunitas">Komunitas</NativeSelectOption>
            <NativeSelectOption value="Perusahaan">Perusahaan</NativeSelectOption>
          </NativeSelect>
          <NativeSelect
            onChange={(e) => {
              setStatus(e.target.value);
              resetPage();
            }}
            size="sm"
            value={status}
          >
            <NativeSelectOption value="all">Semua status</NativeSelectOption>
            <NativeSelectOption value="Aktif">Aktif</NativeSelectOption>
            <NativeSelectOption value="Perlu follow-up">Perlu follow-up</NativeSelectOption>
            <NativeSelectOption value="Dormant">Dormant</NativeSelectOption>
          </NativeSelect>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="pl-4">Donatur</TableHead>
              <TableHead>Kanal</TableHead>
              <TableHead>Preferensi</TableHead>
              <TableHead>Donasi terakhir</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="pr-4 text-right">Total donasi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell className="py-12 text-center text-muted-foreground text-sm" colSpan={6}>
                  {isPending ? "Memuat donatur…" : "Tidak ada donatur yang cocok."}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-2">
                      <div className="grid gap-0.5">
                        <span className="font-medium">{d.name}</span>
                        <span className="text-muted-foreground text-xs">{d.type}</span>
                      </div>
                      {d.recurring ? <Badge variant="secondary">Rutin</Badge> : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{d.channel}</TableCell>
                  <TableCell className="text-sm">{d.programPreference}</TableCell>
                  <TableCell className="text-sm">
                    {d.lastDonationAt ? formatDate(d.lastDonationAt) : "—"}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-sm">
                      <span
                        className={cn(
                          "size-2 rounded-full",
                          statusDot[d.status] ?? "bg-muted-foreground/40",
                        )}
                      />
                      {d.status}
                    </span>
                  </TableCell>
                  <TableCell className="pr-4 text-right font-medium tabular-nums">
                    {formatCurrency(d.totalDonation)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <TablePagination
          from={from}
          label="donatur"
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-5">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-2 font-semibold text-xl tabular-nums tracking-tight">{value}</p>
    </div>
  );
}
