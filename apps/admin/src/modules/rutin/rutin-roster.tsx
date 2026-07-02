// Bantuan Rutin — standing roster detail, API-backed. Pick a rutin program + period
// (bulan); the roster carries over each month and you settle/adjust a few rows.
// Disbursement status is per beneficiary + period.
import { formatCurrency } from "@repo/sip-domain";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
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
import { cn } from "@repo/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Plus, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { TablePagination, paginate } from "../../components/pagination";
import { programsQueryOptions } from "../programs/services";
import { buildPeriods, rosterQueryOptions, useRutinMutations } from "./services";

const periods = buildPeriods();

function formatMonth(iso: string) {
  return new Intl.DateTimeFormat("id-ID", { month: "short", year: "numeric" }).format(
    new Date(`${iso}-01T00:00:00`),
  );
}

export function RutinRoster({
  page,
  onPageChange,
}: {
  page: number;
  onPageChange: (next: number) => void;
}) {
  const { data: rutinPrograms = [] } = useQuery(programsQueryOptions({ type: "rutin" }));
  const [programId, setProgramId] = useState("");
  const [periodKey, setPeriodKey] = useState(periods[0].key);
  const [addOpen, setAddOpen] = useState(false);
  const resetPage = () => onPageChange(1);

  // Default to the first rutin program once loaded.
  useEffect(() => {
    if (!programId && rutinPrograms.length > 0) setProgramId(rutinPrograms[0].id);
  }, [programId, rutinPrograms]);

  const program = rutinPrograms.find((p) => p.id === programId);
  const { data: roster = [] } = useQuery(rosterQueryOptions(programId, periodKey));
  const { add, toggle, disburseAll } = useRutinMutations(programId, periodKey);

  const paged = paginate(roster, page);
  const disbursedRows = roster.filter((b) => b.disbursed);
  const totalNominal = roster.reduce((t, b) => t + b.nominal, 0);
  const disbursedNominal = disbursedRows.reduce((t, b) => t + b.nominal, 0);
  const allDone = roster.length > 0 && disbursedRows.length >= roster.length;

  return (
    <div className="mx-auto grid max-w-[1440px] gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Bantuan Rutin</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Roster penerima santunan bulanan. Data berlanjut tiap periode — sesuaikan bila ada
            perubahan.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setAddOpen(true)} type="button" variant="outline">
            <Plus className="size-4" strokeWidth={1.8} />
            Tambah penerima
          </Button>
          <Button
            disabled={allDone || roster.length === 0 || disburseAll.isPending}
            onClick={() =>
              disburseAll.mutate(undefined, {
                onSuccess: () =>
                  toast.success(
                    `Semua penerima ${program?.name} untuk periode ini ditandai tersalur.`,
                  ),
              })
            }
            type="button"
          >
            <Wallet className="size-4" strokeWidth={1.8} />
            Salurkan semua
          </Button>
        </div>
      </header>

      {/* controls */}
      <div className="flex flex-wrap items-center gap-3">
        <NativeSelect
          onChange={(e) => {
            setProgramId(e.target.value);
            resetPage();
          }}
          value={programId}
        >
          {rutinPrograms.map((p) => (
            <NativeSelectOption key={p.id} value={p.id}>
              {p.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <NativeSelect
          onChange={(e) => {
            setPeriodKey(e.target.value);
            resetPage();
          }}
          value={periodKey}
        >
          {periods.map((p) => (
            <NativeSelectOption key={p.key} value={p.key}>
              {p.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      {/* summary */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border lg:grid-cols-4 [&>*]:bg-background">
        <Stat label="Penerima aktif" value={`${roster.length}`} sub={program?.description ?? ""} />
        <Stat
          label="Nominal / bulan"
          value={formatCurrency(totalNominal)}
          sub="total roster periode ini"
        />
        <Stat
          label="Tersalur"
          value={`${disbursedRows.length} / ${roster.length}`}
          sub={
            roster.length
              ? `${Math.round((disbursedRows.length / roster.length) * 100)}% selesai`
              : "—"
          }
        />
        <Stat
          label="Dana tersalur"
          value={formatCurrency(disbursedNominal)}
          sub={`dari ${formatCurrency(totalNominal)}`}
        />
      </div>

      {/* roster table */}
      <div className="rounded-xl border bg-background">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <p className="font-medium text-sm">{program?.name}</p>
            <p className="text-muted-foreground text-xs">
              Periode {periods.find((p) => p.key === periodKey)?.label}
            </p>
          </div>
          {allDone ? (
            <Badge className="gap-1 border-primary/20 bg-primary/10 text-primary" variant="outline">
              <CheckCircle2 className="size-3.5" /> Periode selesai
            </Badge>
          ) : null}
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="pl-4">Penerima</TableHead>
              <TableHead>NIK</TableHead>
              <TableHead>Sejak</TableHead>
              <TableHead>Nominal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="pr-4 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roster.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell className="py-12 text-center text-muted-foreground text-sm" colSpan={6}>
                  Belum ada penerima pada roster ini.
                </TableCell>
              </TableRow>
            ) : (
              paged.pageRows.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="pl-4">
                    <div className="grid gap-0.5">
                      <span className="font-medium">{b.name}</span>
                      <span className="text-muted-foreground text-xs">{b.region}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground text-xs">{b.nik}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatMonth(b.since)}
                  </TableCell>
                  <TableCell className="text-sm tabular-nums">
                    {formatCurrency(b.nominal)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 text-sm",
                        b.disbursed ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "size-2 rounded-full",
                          b.disbursed ? "bg-primary" : "bg-muted-foreground/40",
                        )}
                      />
                      {b.disbursed ? "Tersalur" : "Belum"}
                    </span>
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <Button
                      disabled={toggle.isPending}
                      onClick={() =>
                        toggle.mutate({ beneficiaryId: b.id, disbursed: !b.disbursed })
                      }
                      size="sm"
                      type="button"
                      variant={b.disbursed ? "ghost" : "outline"}
                    >
                      {b.disbursed ? "Batalkan" : "Tandai tersalur"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <TablePagination
          from={paged.from}
          label="penerima"
          onPageChange={onPageChange}
          page={paged.page}
          pageCount={paged.pageCount}
          to={paged.to}
          total={paged.total}
        />
      </div>

      <AddBeneficiaryDialog
        defaultNominal={program?.defaultNominal ?? 0}
        onOpenChange={setAddOpen}
        onSave={(draft) =>
          add.mutate(draft, {
            onSuccess: () => {
              toast.success(`${draft.name} ditambahkan ke roster ${program?.name}.`);
              setAddOpen(false);
            },
          })
        }
        open={addOpen}
        programName={program?.name ?? ""}
      />
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="p-5">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-2 font-semibold text-xl tabular-nums tracking-tight">{value}</p>
      <p className="mt-1 truncate text-muted-foreground text-xs">{sub}</p>
    </div>
  );
}

function AddBeneficiaryDialog({
  programName,
  defaultNominal,
  open,
  onOpenChange,
  onSave,
}: {
  programName: string;
  defaultNominal: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (draft: { name: string; region: string; nik: string; nominal: number }) => void;
}) {
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [nik, setNik] = useState("");
  const [nominal, setNominal] = useState(defaultNominal ? String(defaultNominal) : "");

  const reset = () => {
    setName("");
    setRegion("");
    setNik("");
    setNominal(defaultNominal ? String(defaultNominal) : "");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nama penerima wajib diisi.");
      return;
    }
    if (nik.length !== 16) {
      toast.error("NIK harus 16 digit.");
      return;
    }
    if (!Number(nominal)) {
      toast.error("Nominal wajib diisi.");
      return;
    }
    onSave({
      name: name.trim(),
      region: region.trim(),
      nik: nik.trim(),
      nominal: Number(nominal),
    });
    reset();
  };

  return (
    <Dialog
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
      open={open}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah penerima</DialogTitle>
          <DialogDescription>Tambahkan penerima ke roster {programName}.</DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" id="add-beneficiary-form" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="b-name">Nama</Label>
            <Input
              id="b-name"
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama penerima"
              value={name}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="b-region">Wilayah</Label>
              <Input
                id="b-region"
                onChange={(e) => setRegion(e.target.value)}
                placeholder="Kota / kab."
                value={region}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="b-nominal">Nominal / bulan</Label>
              <Input
                id="b-nominal"
                inputMode="numeric"
                onChange={(e) => setNominal(e.target.value.replace(/\D/g, ""))}
                placeholder="mis. 500000"
                value={nominal}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="b-nik">NIK</Label>
            <Input
              id="b-nik"
              inputMode="numeric"
              maxLength={16}
              onChange={(e) => setNik(e.target.value.replace(/\D/g, ""))}
              placeholder="16 digit"
              value={nik}
            />
          </div>
        </form>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
            Batal
          </Button>
          <Button form="add-beneficiary-form" type="submit">
            Tambah
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
