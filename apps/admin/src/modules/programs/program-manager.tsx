// Program — CRUD over the program master, API-backed. Each program is typed insidental
// or rutin; rutin programs carry a default monthly nominal.
import { formatCurrency } from "@repo/sip-domain";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/alert-dialog";
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
import { Switch } from "@repo/ui/components/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { Textarea } from "@repo/ui/components/textarea";
import { cn } from "@repo/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { TablePagination, paginate } from "../../components/pagination";
import {
  programsQueryOptions,
  programTypeLabels,
  useProgramMutations,
  type Program,
  type ProgramType,
} from "./services";

type Draft = {
  name: string;
  type: ProgramType;
  description: string;
  active: boolean;
  defaultNominal: string;
};

const emptyDraft: Draft = {
  name: "",
  type: "insidental",
  description: "",
  active: true,
  defaultNominal: "",
};

export function ProgramManager({
  page,
  onPageChange,
}: {
  page: number;
  onPageChange: (next: number) => void;
}) {
  const [typeFilter, setTypeFilter] = useState<ProgramType | "all">("all");
  const [editing, setEditing] = useState<Program | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Program | null>(null);
  const resetPage = () => onPageChange(1);

  const { data: programs = [] } = useQuery(programsQueryOptions());
  const { create, update, remove } = useProgramMutations();

  const rows = useMemo(
    () => (typeFilter === "all" ? programs : programs.filter((p) => p.type === typeFilter)),
    [programs, typeFilter],
  );
  const paged = paginate(rows, page);

  const openAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (p: Program) => {
    setEditing(p);
    setDialogOpen(true);
  };

  const handleSave = (draft: Draft) => {
    const nominal =
      draft.type === "rutin" && draft.defaultNominal ? Number(draft.defaultNominal) : null;
    const input = {
      name: draft.name,
      type: draft.type,
      description: draft.description,
      active: draft.active,
      defaultNominal: nominal,
    };
    if (editing) {
      update.mutate(
        { id: editing.id, ...input },
        {
          onSuccess: () => {
            toast.success(`Program "${draft.name}" diperbarui.`);
            setDialogOpen(false);
          },
        },
      );
    } else {
      create.mutate(input, {
        onSuccess: () => {
          toast.success(`Program "${draft.name}" ditambahkan.`);
          resetPage();
          setDialogOpen(false);
        },
      });
    }
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    remove.mutate(deleteTarget.id, {
      onSuccess: (result) => {
        toast.success(
          result.deleted
            ? `Program "${deleteTarget.name}" dihapus.`
            : `Program "${deleteTarget.name}" dinonaktifkan (masih dipakai riwayat kasus).`,
        );
      },
    });
    setDeleteTarget(null);
  };

  return (
    <div className="mx-auto grid max-w-[1440px] gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Program</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Kelola program bantuan — insidental (sekali selesai) dan rutin (santunan bulanan).
          </p>
        </div>
        <Button onClick={openAdd} type="button">
          <Plus className="size-4" strokeWidth={1.8} />
          Tambah program
        </Button>
      </header>

      <div className="rounded-xl border bg-background">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
          <NativeSelect
            onChange={(e) => {
              setTypeFilter(e.target.value as ProgramType | "all");
              resetPage();
            }}
            size="sm"
            value={typeFilter}
          >
            <NativeSelectOption value="all">Semua tipe</NativeSelectOption>
            <NativeSelectOption value="insidental">Insidental</NativeSelectOption>
            <NativeSelectOption value="rutin">Rutin bulanan</NativeSelectOption>
          </NativeSelect>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="pl-4">Program</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead>Nominal default</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="pr-4 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell className="py-12 text-center text-muted-foreground text-sm" colSpan={5}>
                  Belum ada program.
                </TableCell>
              </TableRow>
            ) : (
              paged.pageRows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="pl-4">
                    <div className="grid gap-0.5">
                      <span className="font-medium">{p.name}</span>
                      <span className="max-w-[420px] truncate text-muted-foreground text-xs">
                        {p.description}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.type === "rutin" ? "default" : "secondary"}>
                      {programTypeLabels[p.type]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm tabular-nums">
                    {p.type === "rutin" && p.defaultNominal
                      ? formatCurrency(p.defaultNominal)
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 text-sm",
                        p.active ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "size-2 rounded-full",
                          p.active ? "bg-primary" : "bg-muted-foreground/40",
                        )}
                      />
                      {p.active ? "Aktif" : "Nonaktif"}
                    </span>
                  </TableCell>
                  <TableCell className="pr-4">
                    <div className="flex justify-end gap-1">
                      <Button
                        onClick={() => openEdit(p)}
                        size="icon-sm"
                        type="button"
                        variant="ghost"
                      >
                        <Pencil className="size-4" strokeWidth={1.8} />
                      </Button>
                      <Button
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteTarget(p)}
                        size="icon-sm"
                        type="button"
                        variant="ghost"
                      >
                        <Trash2 className="size-4" strokeWidth={1.8} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <TablePagination
          from={paged.from}
          label="program"
          onPageChange={onPageChange}
          page={paged.page}
          pageCount={paged.pageCount}
          to={paged.to}
          total={paged.total}
        />
      </div>

      <ProgramDialog
        key={editing?.id ?? "new"}
        onOpenChange={setDialogOpen}
        onSave={handleSave}
        open={dialogOpen}
        program={editing}
      />

      <AlertDialog onOpenChange={(o) => !o && setDeleteTarget(null)} open={deleteTarget !== null}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus program?</AlertDialogTitle>
            <AlertDialogDescription>
              Program "{deleteTarget?.name}" akan dihapus dari daftar. Tindakan ini tidak dapat
              dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} variant="destructive">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ProgramDialog({
  program,
  open,
  onOpenChange,
  onSave,
}: {
  program: Program | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (draft: Draft) => void;
}) {
  const [draft, setDraft] = useState<Draft>(
    program
      ? {
          name: program.name,
          type: program.type,
          description: program.description,
          active: program.active,
          defaultNominal: program.defaultNominal ? String(program.defaultNominal) : "",
        }
      : emptyDraft,
  );

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) {
      toast.error("Nama program wajib diisi.");
      return;
    }
    onSave({ ...draft, name: draft.name.trim() });
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{program ? "Edit program" : "Tambah program"}</DialogTitle>
          <DialogDescription>
            {program ? "Perbarui detail program bantuan." : "Buat program bantuan baru."}
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" id="program-form" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="name">Nama program</Label>
            <Input
              id="name"
              onChange={(e) => set("name", e.target.value)}
              placeholder="mis. Kesehatan"
              value={draft.name}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="type">Tipe</Label>
            <NativeSelect
              className="w-full"
              id="type"
              onChange={(e) => set("type", e.target.value as ProgramType)}
              value={draft.type}
            >
              <NativeSelectOption value="insidental">
                Insidental (sekali selesai)
              </NativeSelectOption>
              <NativeSelectOption value="rutin">Rutin bulanan</NativeSelectOption>
            </NativeSelect>
          </div>

          {draft.type === "rutin" ? (
            <div className="grid gap-2">
              <Label htmlFor="nominal">Nominal default / bulan</Label>
              <Input
                id="nominal"
                inputMode="numeric"
                onChange={(e) => set("defaultNominal", e.target.value.replace(/\D/g, ""))}
                placeholder="mis. 500000"
                value={draft.defaultNominal}
              />
            </div>
          ) : null}

          <div className="grid gap-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              onChange={(e) => set("description", e.target.value)}
              placeholder="Ringkasan singkat program"
              rows={3}
              value={draft.description}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
            <div>
              <Label htmlFor="active">Status aktif</Label>
              <p className="text-muted-foreground text-xs">
                Program aktif bisa dipilih di pengajuan.
              </p>
            </div>
            <Switch checked={draft.active} id="active" onCheckedChange={(v) => set("active", v)} />
          </div>
        </form>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
            Batal
          </Button>
          <Button form="program-form" type="submit">
            {program ? "Simpan perubahan" : "Tambah program"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
