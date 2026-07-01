// Formulir 1 — Pengajuan Bantuan Insidental (Data Pemohon/Mustahik + Data Pelapor).
// Intake form per PRD §3.1, mocked: on submit it toasts and returns to the case list
// (no backend). Diinput oleh Admin atau Verifikator.
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { NativeSelect, NativeSelectOption } from "@repo/ui/components/native-select";
import { toast } from "@repo/ui/components/sonner";
import { Textarea } from "@repo/ui/components/textarea";
import { cn } from "@repo/ui/lib/utils";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { type ReactNode, useState } from "react";
import { seedPrograms } from "../programs/data";

const insidentalPrograms = seedPrograms.filter((p) => p.type === "insidental" && p.active);

const initialForm = {
  nama: "",
  nik: "",
  ttl: "",
  usia: "",
  gender: "Perempuan",
  statusPernikahan: "Menikah",
  noHp: "",
  alamat: "",
  statusTinggal: "Milik Sendiri",
  pekerjaan: "",
  penghasilan: "",
  periode: "per bulan",
  tanggungan: "",
  sholat: "Ya",
  merokok: "Tidak",
  priorHelp: "",
  publikasi: "Ya",
  sktm: "Bersedia mengurus",
  asalInfo: "",
  masalah: "",
  // pelapor
  pelaporNama: "",
  pelaporHubungan: "",
  pelaporInstansi: "Perorangan",
  pelaporAlamat: "",
  pelaporTelp: "",
  program: insidentalPrograms[0]?.name ?? "",
};

type FormState = typeof initialForm;

export function PengajuanForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(initialForm);
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama.trim()) {
      toast.error("Nama pemohon wajib diisi.");
      return;
    }
    if (form.nik.length !== 16) {
      toast.error("NIK harus 16 digit.");
      return;
    }
    toast.success(`Pengajuan untuk ${form.nama.trim()} berhasil dibuat.`);
    navigate({ to: "/bantuan-insidental" });
  };

  return (
    <div className="mx-auto grid max-w-4xl gap-6">
      <header className="grid gap-2">
        <Link
          className="flex w-fit items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground"
          to="/bantuan-insidental"
        >
          <ArrowLeft className="size-4" strokeWidth={1.8} />
          Kembali ke Bantuan Insidental
        </Link>
        <h1 className="font-semibold text-2xl tracking-tight">Pengajuan Bantuan Insidental</h1>
        <p className="text-muted-foreground text-sm">
          Formulir 1 — data awal calon penerima manfaat (mustahik) dan pelapor.
        </p>
      </header>

      <form className="grid gap-6" onSubmit={handleSubmit}>
        {/* Identitas Pemohon */}
        <Card>
          <CardHeader>
            <CardTitle>Data Pemohon (Mustahik)</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field className="sm:col-span-2" htmlFor="nama" label="Nama lengkap">
              <Input
                id="nama"
                onChange={(e) => set("nama", e.target.value)}
                placeholder="Nama sesuai KTP"
                value={form.nama}
              />
            </Field>
            <Field htmlFor="nik" label="NIK">
              <Input
                id="nik"
                inputMode="numeric"
                maxLength={16}
                onChange={(e) => set("nik", e.target.value.replace(/\D/g, ""))}
                placeholder="16 digit"
                value={form.nik}
              />
            </Field>
            <Field htmlFor="ttl" label="Tempat, tanggal lahir">
              <Input
                id="ttl"
                onChange={(e) => set("ttl", e.target.value)}
                placeholder="mis. Bekasi, 5 Sep 1982"
                value={form.ttl}
              />
            </Field>
            <Field htmlFor="usia" label="Usia">
              <Input
                id="usia"
                inputMode="numeric"
                onChange={(e) => set("usia", e.target.value.replace(/\D/g, ""))}
                placeholder="tahun"
                value={form.usia}
              />
            </Field>
            <Field htmlFor="gender" label="Jenis kelamin">
              <Select
                id="gender"
                onChange={(v) => set("gender", v)}
                options={["Laki-laki", "Perempuan"]}
                value={form.gender}
              />
            </Field>
            <Field htmlFor="statusPernikahan" label="Status pernikahan">
              <Select
                id="statusPernikahan"
                onChange={(v) => set("statusPernikahan", v)}
                options={["Menikah", "Duda", "Janda", "Janda Mati", "Belum Menikah"]}
                value={form.statusPernikahan}
              />
            </Field>
            <Field htmlFor="noHp" label="No. HP yang bisa dihubungi">
              <Input
                id="noHp"
                inputMode="tel"
                onChange={(e) => set("noHp", e.target.value)}
                placeholder="08xx"
                value={form.noHp}
              />
            </Field>
            <Field className="sm:col-span-2" htmlFor="alamat" label="Alamat lengkap saat ini">
              <Textarea
                id="alamat"
                onChange={(e) => set("alamat", e.target.value)}
                placeholder="Alamat domisili"
                rows={2}
                value={form.alamat}
              />
            </Field>
            <Field htmlFor="statusTinggal" label="Status tempat tinggal">
              <Select
                id="statusTinggal"
                onChange={(v) => set("statusTinggal", v)}
                options={["Milik Sendiri", "Sewa/Kontrak", "Menumpang", "Tidak Memiliki"]}
                value={form.statusTinggal}
              />
            </Field>
          </CardContent>
        </Card>

        {/* Ekonomi & Kondisi */}
        <Card>
          <CardHeader>
            <CardTitle>Ekonomi & Kondisi</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field htmlFor="pekerjaan" label="Pekerjaan">
              <Input
                id="pekerjaan"
                onChange={(e) => set("pekerjaan", e.target.value)}
                placeholder="mis. Buruh harian"
                value={form.pekerjaan}
              />
            </Field>
            <Field htmlFor="tanggungan" label="Jumlah tanggungan">
              <Input
                id="tanggungan"
                inputMode="numeric"
                onChange={(e) => set("tanggungan", e.target.value.replace(/\D/g, ""))}
                placeholder="orang"
                value={form.tanggungan}
              />
            </Field>
            <Field htmlFor="penghasilan" label="Penghasilan">
              <Input
                id="penghasilan"
                inputMode="numeric"
                onChange={(e) => set("penghasilan", e.target.value.replace(/\D/g, ""))}
                placeholder="Rp"
                value={form.penghasilan}
              />
            </Field>
            <Field htmlFor="periode" label="Periode penghasilan">
              <Select
                id="periode"
                onChange={(v) => set("periode", v)}
                options={["per hari", "per pekan", "per bulan"]}
                value={form.periode}
              />
            </Field>
            <Field htmlFor="sholat" label="Sholat 5 waktu">
              <Select
                id="sholat"
                onChange={(v) => set("sholat", v)}
                options={["Ya", "Jarang", "Tidak"]}
                value={form.sholat}
              />
            </Field>
            <Field htmlFor="merokok" label="Merokok">
              <Select
                id="merokok"
                onChange={(v) => set("merokok", v)}
                options={["Ya", "Jarang", "Tidak"]}
                value={form.merokok}
              />
            </Field>
            <Field htmlFor="publikasi" label="Bersedia dipublikasi">
              <Select
                id="publikasi"
                onChange={(v) => set("publikasi", v)}
                options={["Ya", "Tidak"]}
                value={form.publikasi}
              />
            </Field>
            <Field htmlFor="sktm" label="Status SKTM">
              <Select
                id="sktm"
                onChange={(v) => set("sktm", v)}
                options={["Belum ada", "Bersedia mengurus", "Sudah ada"]}
                value={form.sktm}
              />
            </Field>
            <Field htmlFor="asalInfo" label="Asal informasi tentang SIP">
              <Input
                id="asalInfo"
                onChange={(e) => set("asalInfo", e.target.value)}
                placeholder="mis. Tetangga, DKM, relawan"
                value={form.asalInfo}
              />
            </Field>
            <Field
              className="sm:col-span-2"
              htmlFor="priorHelp"
              label="Sudah pernah dibantu SIP / lembaga lain"
            >
              <Textarea
                id="priorHelp"
                onChange={(e) => set("priorHelp", e.target.value)}
                placeholder="Jelaskan bila ada"
                rows={2}
                value={form.priorHelp}
              />
            </Field>
            <Field className="sm:col-span-2" htmlFor="masalah" label="Masalah yang dihadapi">
              <Textarea
                id="masalah"
                onChange={(e) => set("masalah", e.target.value)}
                placeholder="Ringkas kondisi & kebutuhan"
                rows={3}
                value={form.masalah}
              />
            </Field>
          </CardContent>
        </Card>

        {/* Pelapor & Program */}
        <Card>
          <CardHeader>
            <CardTitle>Data Pelapor & Program</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field htmlFor="pelaporNama" label="Nama pelapor">
              <Input
                id="pelaporNama"
                onChange={(e) => set("pelaporNama", e.target.value)}
                placeholder="Nama pelapor"
                value={form.pelaporNama}
              />
            </Field>
            <Field htmlFor="pelaporHubungan" label="Status / hubungan dengan mustahik">
              <Input
                id="pelaporHubungan"
                onChange={(e) => set("pelaporHubungan", e.target.value)}
                placeholder="mis. Tetangga, DKM"
                value={form.pelaporHubungan}
              />
            </Field>
            <Field htmlFor="pelaporInstansi" label="Jenis pelapor">
              <Select
                id="pelaporInstansi"
                onChange={(v) => set("pelaporInstansi", v)}
                options={["Perorangan", "Yayasan", "Lembaga", "Komunitas"]}
                value={form.pelaporInstansi}
              />
            </Field>
            <Field htmlFor="pelaporTelp" label="No. telp pelapor">
              <Input
                id="pelaporTelp"
                inputMode="tel"
                onChange={(e) => set("pelaporTelp", e.target.value)}
                placeholder="08xx"
                value={form.pelaporTelp}
              />
            </Field>
            <Field className="sm:col-span-2" htmlFor="pelaporAlamat" label="Alamat pelapor">
              <Textarea
                id="pelaporAlamat"
                onChange={(e) => set("pelaporAlamat", e.target.value)}
                placeholder="Alamat pelapor"
                rows={2}
                value={form.pelaporAlamat}
              />
            </Field>
            <Field
              className="sm:col-span-2"
              htmlFor="program"
              label="Program bantuan yang direkomendasikan"
            >
              <Select
                id="program"
                onChange={(v) => set("program", v)}
                options={insidentalPrograms.map((p) => p.name)}
                value={form.program}
              />
            </Field>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button asChild type="button" variant="outline">
            <Link to="/bantuan-insidental">Batal</Link>
          </Button>
          <Button type="submit">Simpan pengajuan</Button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function Select({
  id,
  value,
  onChange,
  options,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <NativeSelect
      className="w-full"
      id={id}
      onChange={(e) => onChange(e.target.value)}
      value={value}
    >
      {options.map((o) => (
        <NativeSelectOption key={o} value={o}>
          {o}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
}
