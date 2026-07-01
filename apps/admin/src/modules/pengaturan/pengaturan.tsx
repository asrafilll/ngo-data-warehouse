// Pengaturan — org profile, users/amil, Had Kifayah regional index master, and
// preferences. Tabbed. Mock/in-memory (no backend).
import {
  formatCurrency,
  formatDate,
  regionalIndexes,
  sipUsers,
  type SipRole,
} from "@repo/sip-domain";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
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
import { Plus } from "lucide-react";
import { useState } from "react";

const roleLabels: Record<SipRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  pengurus: "Pengurus",
  verifikator: "Verifikator",
};

export function Pengaturan() {
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
      </Tabs>
    </div>
  );
}

function LembagaTab() {
  const [form, setForm] = useState({
    nama: "Solidaritas Insan Peduli",
    singkatan: "SIP",
    email: "sekretariat@sip.or.id",
    telp: "021-1234-5678",
    alamat: "Jl. Contoh No. 10, Bekasi, Jawa Barat",
  });
  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil Lembaga</CardTitle>
      </CardHeader>
      <CardContent className="grid max-w-2xl gap-4 sm:grid-cols-2">
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="nama">Nama lembaga</Label>
          <Input id="nama" onChange={(e) => set("nama", e.target.value)} value={form.nama} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="singkatan">Singkatan</Label>
          <Input
            id="singkatan"
            onChange={(e) => set("singkatan", e.target.value)}
            value={form.singkatan}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="telp">Telepon</Label>
          <Input id="telp" onChange={(e) => set("telp", e.target.value)} value={form.telp} />
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
          <Input id="alamat" onChange={(e) => set("alamat", e.target.value)} value={form.alamat} />
        </div>
        <div className="sm:col-span-2">
          <Button onClick={() => toast.success("Profil lembaga disimpan.")} type="button">
            Simpan perubahan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PenggunaTab() {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Pengguna & Amil</CardTitle>
        <Button onClick={() => toast("Tambah pengguna (mock).")} size="sm" type="button">
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
              <TableHead className="pr-6">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sipUsers.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="pl-6 font-medium">{u.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{roleLabels[u.role]}</Badge>
                </TableCell>
                <TableCell className="text-sm">{u.region}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{u.phone}</TableCell>
                <TableCell className="pr-6">
                  <span className="inline-flex items-center gap-1.5 text-sm">
                    <span
                      className={cn(
                        "size-2 rounded-full",
                        u.status === "Aktif" ? "bg-primary" : "bg-muted-foreground/40",
                      )}
                    />
                    {u.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function WilayahTab() {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Indeks Had Kifayah Wilayah</CardTitle>
        <Button onClick={() => toast("Tambah wilayah (mock).")} size="sm" type="button">
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
            {regionalIndexes.map((r) => (
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
    </Card>
  );
}

function PreferensiTab() {
  const [prefs, setPrefs] = useState({
    webp: true,
    encrypt: true,
    notifyDecision: true,
    offline: false,
  });
  const toggle = (k: keyof typeof prefs) => (v: boolean) => {
    setPrefs((p) => ({ ...p, [k]: v }));
    toast.success("Preferensi diperbarui.");
  };

  const items: Array<{ key: keyof typeof prefs; title: string; desc: string }> = [
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
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferensi Sistem</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {items.map((item) => (
          <div
            className="flex items-center justify-between gap-4 rounded-lg border p-4"
            key={item.key}
          >
            <div>
              <p className="font-medium text-sm">{item.title}</p>
              <p className="text-muted-foreground text-xs">{item.desc}</p>
            </div>
            <Switch checked={prefs[item.key]} onCheckedChange={toggle(item.key)} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
