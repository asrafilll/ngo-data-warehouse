// Pengaturan — org profile, users/amil, Had Kifayah regional index master, and
// preferences. Tabbed, fully API-backed.
import { formatCurrency, formatDate } from "@repo/sip-domain";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
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
import { Switch } from "@repo/ui/components/switch";
import { toast } from "@repo/ui/components/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
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
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { meQueryOptions } from "../auth/hooks/use-auth";
import {
  approvalsQueryOptions,
  regionsQueryOptions,
  roleLabels,
  settingsQueryOptions,
  type StageApprovals,
  useAmilMutations,
  useApprovalsMutation,
  useRegionMutations,
  useSettingsMutation,
  usersQueryOptions,
  type SipRole,
  type WorkflowStage,
} from "./services";

export function Pengaturan() {
  const { data: me } = useQuery(meQueryOptions);
  const isSuperAdmin = (me?.role ?? "").split(",").includes("super_admin");

  return (
    <div className="mx-auto grid max-w-[1440px] gap-6">
      <header>
        <h1 className="font-semibold text-2xl tracking-tight">Pengaturan</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Profil lembaga, pengguna, indeks Had Kifayah, dan preferensi sistem.
        </p>
      </header>

      <Tabs className="gap-4" defaultValue="lembaga">
        <TabsList>
          <TabsTrigger value="lembaga">Lembaga</TabsTrigger>
          <TabsTrigger value="pengguna">Pengguna</TabsTrigger>
          <TabsTrigger value="wilayah">Indeks Wilayah</TabsTrigger>
          <TabsTrigger value="preferensi">Preferensi</TabsTrigger>
          {isSuperAdmin ? <TabsTrigger value="approval">Approval</TabsTrigger> : null}
        </TabsList>

        <TabsContent value="lembaga">
          <LembagaTab />
        </TabsContent>
        <TabsContent value="pengguna">
          <PenggunaTab />
        </TabsContent>
        <TabsContent value="wilayah">
          <WilayahTab />
        </TabsContent>
        <TabsContent value="preferensi">
          <PreferensiTab />
        </TabsContent>
        {isSuperAdmin ? (
          <TabsContent value="approval">
            <ApprovalTab />
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
}

function LembagaTab() {
  const { data: settings } = useQuery(settingsQueryOptions);
  const mutation = useSettingsMutation();
  const [form, setForm] = useState({ name: "", legalName: "", email: "", phone: "", address: "" });
  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (settings) {
      setForm({
        name: settings.name,
        legalName: settings.legalName,
        email: settings.email,
        phone: settings.phone,
        address: settings.address,
      });
    }
  }, [settings]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil Lembaga</CardTitle>
      </CardHeader>
      <CardContent className="grid max-w-2xl gap-4 sm:grid-cols-2">
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="nama">Nama lembaga</Label>
          <Input id="nama" onChange={(e) => set("name", e.target.value)} value={form.name} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="legal">Nama resmi / yayasan</Label>
          <Input
            id="legal"
            onChange={(e) => set("legalName", e.target.value)}
            value={form.legalName}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="telp">Telepon</Label>
          <Input id="telp" onChange={(e) => set("phone", e.target.value)} value={form.phone} />
        </div>
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            onChange={(e) => set("email", e.target.value)}
            type="email"
            value={form.email}
          />
        </div>
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="alamat">Alamat</Label>
          <Input
            id="alamat"
            onChange={(e) => set("address", e.target.value)}
            value={form.address}
          />
        </div>
        <div className="sm:col-span-2">
          <Button
            disabled={mutation.isPending}
            onClick={() =>
              mutation.mutate(form, {
                onSuccess: () => toast.success("Profil lembaga disimpan."),
              })
            }
            type="button"
          >
            Simpan perubahan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PenggunaTab() {
  const { data: users = [] } = useQuery(usersQueryOptions());
  const { create, update } = useAmilMutations();
  const [addOpen, setAddOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Pengguna & Amil</CardTitle>
        <Button onClick={() => setAddOpen(true)} size="sm" type="button">
          <Plus className="size-4" strokeWidth={1.8} />
          Tambah pengguna
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-6">Nama</TableHead>
              <TableHead>Peran</TableHead>
              <TableHead>Wilayah</TableHead>
              <TableHead>No. HP</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="pr-6 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="pl-6">
                  <div className="grid gap-0.5">
                    <span className="font-medium">{u.name}</span>
                    <span className="text-muted-foreground text-xs">{u.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {roleLabels[(u.role as SipRole) ?? "admin"] ?? u.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{u.region ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{u.phone ?? "—"}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5 text-sm">
                    <span
                      className={cn(
                        "size-2 rounded-full",
                        u.active ? "bg-primary" : "bg-muted-foreground/40",
                      )}
                    />
                    {u.active ? "Aktif" : "Nonaktif"}
                  </span>
                </TableCell>
                <TableCell className="pr-6 text-right">
                  <Button
                    disabled={update.isPending}
                    onClick={() =>
                      update.mutate(
                        { id: u.id, active: !u.active },
                        {
                          onSuccess: () =>
                            toast.success(
                              `${u.name} ${u.active ? "dinonaktifkan" : "diaktifkan"}.`,
                            ),
                        },
                      )
                    }
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    {u.active ? "Nonaktifkan" : "Aktifkan"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <AddUserDialog
        onOpenChange={setAddOpen}
        onSave={(input) =>
          create.mutate(input, {
            onSuccess: () => {
              toast.success(`Pengguna ${input.name} ditambahkan.`);
              setAddOpen(false);
            },
          })
        }
        open={addOpen}
        pending={create.isPending}
      />
    </Card>
  );
}

function AddUserDialog({
  open,
  onOpenChange,
  onSave,
  pending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (input: {
    name: string;
    email: string;
    password: string;
    role: SipRole;
    phone: string;
    region: string;
  }) => void;
  pending: boolean;
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "verifikator" as SipRole,
    phone: "",
    region: "",
  });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Nama dan email wajib diisi.");
      return;
    }
    if (form.password.length < 8) {
      toast.error("Password minimal 8 karakter.");
      return;
    }
    onSave(form);
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah pengguna</DialogTitle>
          <DialogDescription>Akun amil baru dengan peran NGO.</DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" id="add-user-form" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="u-name">Nama</Label>
            <Input id="u-name" onChange={(e) => set("name", e.target.value)} value={form.name} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="u-email">Email</Label>
              <Input
                id="u-email"
                onChange={(e) => set("email", e.target.value)}
                type="email"
                value={form.email}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="u-password">Password</Label>
              <Input
                id="u-password"
                onChange={(e) => set("password", e.target.value)}
                type="password"
                value={form.password}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="u-role">Peran</Label>
              <NativeSelect
                className="w-full"
                id="u-role"
                onChange={(e) => set("role", e.target.value as SipRole)}
                value={form.role}
              >
                {(Object.entries(roleLabels) as Array<[SipRole, string]>).map(([value, label]) => (
                  <NativeSelectOption key={value} value={value}>
                    {label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="u-region">Wilayah tugas</Label>
              <Input
                id="u-region"
                onChange={(e) => set("region", e.target.value)}
                placeholder="mis. Bekasi"
                value={form.region}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="u-phone">No. HP</Label>
            <Input id="u-phone" onChange={(e) => set("phone", e.target.value)} value={form.phone} />
          </div>
        </form>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
            Batal
          </Button>
          <Button disabled={pending} form="add-user-form" type="submit">
            Tambah
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function WilayahTab() {
  const { data: regions = [] } = useQuery(regionsQueryOptions);
  const { create } = useRegionMutations();
  const [addOpen, setAddOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Indeks Had Kifayah Wilayah</CardTitle>
        <Button onClick={() => setAddOpen(true)} size="sm" type="button">
          <Plus className="size-4" strokeWidth={1.8} />
          Tambah wilayah
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-6">Kota / Kabupaten</TableHead>
              <TableHead>Provinsi</TableHead>
              <TableHead className="text-right">Kebutuhan keluarga</TableHead>
              <TableHead className="text-right">Per kapita</TableHead>
              <TableHead className="text-right">Indeks pangan</TableHead>
              <TableHead className="pr-6 text-right">Update</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {regions.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="pl-6 font-medium">{r.city}</TableCell>
                <TableCell className="text-sm">{r.province}</TableCell>
                <TableCell className="text-right text-sm tabular-nums">
                  {formatCurrency(r.familyMonthlyNeed)}
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums">
                  {formatCurrency(r.perCapitaNeed)}
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums">
                  {r.foodIndex.toFixed(2)}×
                </TableCell>
                <TableCell className="pr-6 text-right text-muted-foreground text-xs">
                  {formatDate(r.updatedAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <AddRegionDialog
        onOpenChange={setAddOpen}
        onSave={(input) =>
          create.mutate(input, {
            onSuccess: () => {
              toast.success(`Wilayah ${input.city} ditambahkan.`);
              setAddOpen(false);
            },
          })
        }
        open={addOpen}
        pending={create.isPending}
      />
    </Card>
  );
}

function AddRegionDialog({
  open,
  onOpenChange,
  onSave,
  pending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (input: {
    province: string;
    city: string;
    familyMonthlyNeed: number;
    perCapitaNeed: number;
    foodIndex: number;
  }) => void;
  pending: boolean;
}) {
  const [form, setForm] = useState({
    province: "",
    city: "",
    familyMonthlyNeed: "",
    perCapitaNeed: "",
    foodIndex: "1.00",
  });
  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.city.trim() || !form.province.trim()) {
      toast.error("Kota dan provinsi wajib diisi.");
      return;
    }
    if (!Number(form.familyMonthlyNeed) || !Number(form.perCapitaNeed)) {
      toast.error("Nilai kebutuhan wajib diisi.");
      return;
    }
    onSave({
      province: form.province.trim(),
      city: form.city.trim(),
      familyMonthlyNeed: Number(form.familyMonthlyNeed),
      perCapitaNeed: Number(form.perCapitaNeed),
      foodIndex: Number(form.foodIndex) || 1,
    });
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah wilayah</DialogTitle>
          <DialogDescription>Indeks biaya hidup untuk kalkulasi Had Kifayah.</DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" id="add-region-form" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="r-city">Kota / kabupaten</Label>
              <Input id="r-city" onChange={(e) => set("city", e.target.value)} value={form.city} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="r-province">Provinsi</Label>
              <Input
                id="r-province"
                onChange={(e) => set("province", e.target.value)}
                value={form.province}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="r-family">Kebutuhan keluarga / bln</Label>
              <Input
                id="r-family"
                inputMode="numeric"
                onChange={(e) => set("familyMonthlyNeed", e.target.value.replace(/\D/g, ""))}
                placeholder="Rp"
                value={form.familyMonthlyNeed}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="r-capita">Per kapita / bln</Label>
              <Input
                id="r-capita"
                inputMode="numeric"
                onChange={(e) => set("perCapitaNeed", e.target.value.replace(/\D/g, ""))}
                placeholder="Rp"
                value={form.perCapitaNeed}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="r-food">Indeks pangan</Label>
            <Input
              id="r-food"
              inputMode="decimal"
              onChange={(e) => set("foodIndex", e.target.value.replace(/[^\d.]/g, ""))}
              placeholder="mis. 1.08"
              value={form.foodIndex}
            />
          </div>
        </form>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
            Batal
          </Button>
          <Button disabled={pending} form="add-region-form" type="submit">
            Tambah
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const stageMeta: Array<{ stage: WorkflowStage; title: string; desc: string }> = [
  { stage: "intake", title: "Pengajuan (Form 1)", desc: "Membuat & memperbaiki data pengajuan." },
  { stage: "triage", title: "Triase", desc: "Lanjut verifikasi, revisi, atau tolak." },
  { stage: "assign", title: "Penugasan", desc: "Menugaskan verifikator wilayah." },
  { stage: "verification", title: "Verifikasi (Form 2)", desc: "Mengisi hasil survei lapangan." },
  {
    stage: "decision",
    title: "Keputusan nominal",
    desc: "Menyetujui / menolak dan menetapkan nominal.",
  },
  { stage: "disburse", title: "Penyaluran", desc: "Menyalurkan bantuan + bukti foto." },
  { stage: "reopen", title: "Buka kembali", desc: "Membuka kasus yang ditolak." },
];

const assignableRoles: SipRole[] = ["admin", "pengurus", "verifikator"];

// Super_admin only: choose which roles may perform each workflow stage. super_admin
// itself always passes every guard, so it is not listed.
function ApprovalTab() {
  const { data: approvals } = useQuery(approvalsQueryOptions);
  const mutation = useApprovalsMutation();
  const [draft, setDraft] = useState<StageApprovals | null>(null);

  useEffect(() => {
    if (approvals) setDraft(approvals);
  }, [approvals]);

  if (!draft) return null;

  const toggleRole = (stage: WorkflowStage, role: SipRole) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const current = prev[stage] ?? [];
      const next = current.includes(role) ? current.filter((r) => r !== role) : [...current, role];
      return { ...prev, [stage]: next };
    });
  };

  const hasEmptyStage = stageMeta.some(({ stage }) => (draft[stage] ?? []).length === 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Approval per Tahap</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <p className="text-muted-foreground text-sm">
          Tentukan peran yang boleh melakukan aksi di tiap tahap alur bantuan insidental. Super
          Admin selalu bisa melakukan semua aksi.
        </p>
        {stageMeta.map(({ stage, title, desc }) => (
          <div
            className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4"
            key={stage}
          >
            <div>
              <p className="font-medium text-sm">{title}</p>
              <p className="text-muted-foreground text-xs">{desc}</p>
            </div>
            <div className="flex gap-2">
              {assignableRoles.map((role) => {
                const active = (draft[stage] ?? []).includes(role);
                return (
                  <Button
                    key={role}
                    onClick={() => toggleRole(stage, role)}
                    size="sm"
                    type="button"
                    variant={active ? "default" : "outline"}
                  >
                    {roleLabels[role]}
                  </Button>
                );
              })}
            </div>
          </div>
        ))}
        {hasEmptyStage ? (
          <p className="text-destructive text-xs">Setiap tahap minimal punya satu peran.</p>
        ) : null}
        <div>
          <Button
            disabled={mutation.isPending || hasEmptyStage}
            onClick={() =>
              mutation.mutate(draft, {
                onSuccess: () => toast.success("Pengaturan approval disimpan."),
              })
            }
            type="button"
          >
            Simpan pengaturan approval
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

const prefItems = [
  {
    key: "webp",
    title: "Konversi WebP otomatis",
    desc: "Kompres & konversi foto unggahan ke WebP di sisi klien.",
  },
  {
    key: "encrypt",
    title: "Enkripsi dokumen sensitif",
    desc: "Enkripsi AES-256 untuk arsip KTP, KK, dan SKTM.",
  },
  {
    key: "notifyDecision",
    title: "Notifikasi keputusan",
    desc: "Kirim notifikasi saat pengurus menetapkan nominal.",
  },
  {
    key: "offline",
    title: "Mode offline verifikator",
    desc: "Izinkan Formulir 2 diisi offline lalu sinkron otomatis.",
  },
] as const;

function PreferensiTab() {
  const { data: settings } = useQuery(settingsQueryOptions);
  const mutation = useSettingsMutation();
  const prefs = (settings?.preferences ?? {}) as Record<string, unknown>;

  const toggle = (key: string) => (value: boolean) => {
    mutation.mutate(
      { preferences: { ...prefs, [key]: value } },
      { onSuccess: () => toast.success("Preferensi diperbarui.") },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferensi Sistem</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {prefItems.map((item) => (
          <div
            className="flex items-center justify-between gap-4 rounded-lg border p-4"
            key={item.key}
          >
            <div>
              <p className="font-medium text-sm">{item.title}</p>
              <p className="text-muted-foreground text-xs">{item.desc}</p>
            </div>
            <Switch checked={Boolean(prefs[item.key])} onCheckedChange={toggle(item.key)} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
