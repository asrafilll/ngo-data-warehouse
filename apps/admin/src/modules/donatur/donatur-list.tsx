// Donatur — fundraising contacts: donation history, recurring commitment, program
// preference. Search + filter + summary. Mock data from @repo/sip-domain.
import { donors, formatCurrency, formatDate, type Donor } from "@repo/sip-domain";
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
import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { TablePagination, paginate } from "../../components/pagination";

const statusDot: Record<Donor["status"], string> = {
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
  const [status, setStatus] = useState<Donor["status"] | "all">("all");
  const [type, setType] = useState<Donor["type"] | "all">("all");
  const resetPage = () => onPageChange(1);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return donors.filter((d) => {
      if (status !== "all" && d.status !== status) return false;
      if (type !== "all" && d.type !== type) return false;
      if (!q) return true;
      return d.name.toLowerCase().includes(q) || d.programPreference.toLowerCase().includes(q);
    });
  }, [query, status, type]);
  const paged = paginate(rows, page);

  const totalDonation = donors.reduce((t, d) => t + d.totalDonation, 0);
  const activeCount = donors.filter((d) => d.status === "Aktif").length;
  const recurringCount = donors.filter((d) => d.recurring).length;

  return (
    <div className="mx-auto grid max-w-[1440px] gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Donatur</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Kontak donatur, histori donasi, dan komitmen rutin.
          </p>
        </div>
        <Button type="button">
          <Plus className="size-4" strokeWidth={1.8} />
          Tambah donatur
        </Button>
      </header>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border lg:grid-cols-4 [&>*]:bg-background">
        <Stat label="Total donatur" value={`${donors.length}`} />
        <Stat label="Donatur aktif" value={`${activeCount}`} />
        <Stat label="Komitmen rutin" value={`${recurringCount}`} />
        <Stat label="Total donasi tercatat" value={formatCurrency(totalDonation)} />
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
              setType(e.target.value as Donor["type"] | "all");
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
              setStatus(e.target.value as Donor["status"] | "all");
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
                  Tidak ada donatur yang cocok.
                </TableCell>
              </TableRow>
            ) : (
              paged.pageRows.map((d) => (
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
                  <TableCell className="text-sm">{formatDate(d.lastDonationAt)}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-sm">
                      <span className={cn("size-2 rounded-full", statusDot[d.status])} />
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
          from={paged.from}
          label="donatur"
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-5">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-2 font-semibold text-xl tabular-nums tracking-tight">{value}</p>
    </div>
  );
}
