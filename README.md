# SIP Manajemen

SIP Manajemen adalah aplikasi internal untuk membantu Solidaritas Insan Peduli mengelola bantuan sosial secara lebih rapi, terukur, dan mudah dipertanggungjawabkan.

Aplikasi ini menyatukan proses pengajuan, verifikasi lapangan, keputusan bantuan, penyaluran dana, data mustahik, data donatur, program bantuan, dan laporan operasional dalam satu konsol kerja.

## Tujuan

SIP Manajemen dibuat agar tim operasional tidak bergantung pada catatan terpisah, chat, spreadsheet manual, atau ingatan personal saat menangani bantuan. Dengan sistem ini, setiap pengajuan punya status yang jelas, riwayat tindakan yang tercatat, data penerima yang mudah ditemukan, dan laporan yang dapat dibaca oleh pengurus.

Secara bisnis, aplikasi ini membantu lembaga untuk:

- Mempercepat tindak lanjut pengajuan bantuan.
- Mengurangi kasus yang macet karena status dan penanggung jawab tidak jelas.
- Menjaga data mustahik tetap terpusat dan tidak duplikatif.
- Melihat kebutuhan dana, realisasi penyaluran, dan komitmen bantuan rutin.
- Mengelola program bantuan insidental dan rutin dalam satu alur.
- Memantau beban kerja verifikator dan progres penyaluran per wilayah.
- Menyediakan dasar laporan untuk pengurus, donor, dan kebutuhan audit internal.

## Alur Utama Bantuan

1. Pengajuan bantuan dibuat oleh admin atau verifikator.
2. Pengurus melakukan triase awal: lanjut verifikasi, minta revisi, atau tolak.
3. Kasus ditugaskan ke verifikator wilayah.
4. Verifikator mengisi data lapangan dan dokumentasi pendukung.
5. Sistem membantu membaca kelayakan melalui data ekonomi, tanggungan, wilayah, dan indeks Had Kifayah.
6. Pengurus menetapkan keputusan dan nominal bantuan.
7. Tim menandai penyaluran, menyimpan bukti, dan menutup kasus.
8. Data masuk ke dashboard dan laporan operasional.

## Modul dan Fitur

### Dashboard

Ringkasan untuk superadmin dan pengurus. Dashboard menampilkan volume pengajuan, dana disetujui, dana tersalur, komitmen bantuan rutin, tren kasus, program yang paling aktif, wilayah dengan kebutuhan tinggi, beban verifikator, kasus macet, dan progres penyaluran periode berjalan.

### Pengajuan Baru

Formulir awal untuk mencatat calon penerima manfaat dan pelapor. Data yang dicatat meliputi identitas mustahik, NIK, alamat, wilayah, kondisi ekonomi, tanggungan, status tempat tinggal, kebutuhan bantuan, sumber informasi, dan data pelapor.

### Bantuan Insidental

Daftar kasus bantuan sekali selesai. Tim dapat mencari dan memfilter kasus berdasarkan nama, NIK, nomor kasus, wilayah, program, dan status. Modul ini menjadi pusat operasional untuk bantuan yang melewati alur lengkap dari pengajuan sampai penyaluran.

### Detail Kasus

Halaman kerja untuk satu kasus. Di dalamnya ada data pemohon, data pelapor, form verifikasi lapangan, panel keputusan Had Kifayah, nominal bantuan, bukti penyaluran, dokumentasi foto, penugasan verifikator, dan timeline aktivitas.

### Bantuan Rutin

Roster penerima santunan bulanan. Tim dapat memilih program dan periode, melihat jumlah penerima aktif, total nominal bulanan, status penyaluran, menambah penerima, menandai satu per satu, atau menandai semua penerima sebagai tersalur untuk periode tersebut.

### Program

Master program bantuan. Program dapat dibedakan antara bantuan insidental dan bantuan rutin. Untuk program rutin, sistem dapat menyimpan nominal default bulanan agar proses roster lebih konsisten.

### Mustahik

Master data penerima manfaat. Profil mustahik dibuat unik berdasarkan NIK, sehingga riwayat bantuan seseorang dapat dilihat lebih mudah. Modul ini membantu tim melihat apakah seseorang pernah menerima bantuan, sedang masuk roster rutin, atau memiliki kasus terakhir yang masih berjalan.

### Donatur

Data kontak dan kontribusi donatur. Modul ini mencatat jenis donatur, kanal, preferensi program, histori donasi, komitmen rutin, status aktif, dan donor yang perlu di-follow-up.

### Laporan

Rekap operasional per periode, program, wilayah, dan status kasus. Laporan membantu pengurus melihat jumlah pengajuan, kasus selesai, nilai rekomendasi, dan dana yang disetujui.

### Pengaturan

Konfigurasi lembaga dan sistem. Termasuk profil lembaga, pengguna dan peran amil, status aktif pengguna, wilayah kerja, indeks Had Kifayah per kota/kabupaten, dan preferensi operasional.

## Pengguna Utama

- Superadmin / pengurus: melihat kondisi menyeluruh, mengambil keputusan, dan memantau akuntabilitas.
- Admin operasional: membuat pengajuan, mengelola data, dan menjaga proses tetap berjalan.
- Verifikator: menangani survei lapangan, melengkapi data, dan memberi rekomendasi.
- Tim program dan fundraising: membaca kebutuhan, realisasi bantuan, serta data donatur.

## Status Produk

Saat ini SIP Manajemen berada pada tahap prototype validasi. Fokus utamanya adalah membuktikan alur kerja, struktur data, dan kebutuhan dashboard operasional sebelum masuk ke tahap produksi penuh.

## Menjalankan Secara Lokal

Persiapan awal:

```sh
pnpm install
cp .env.example .env
docker compose -f docker-compose.dev.yaml up -d
pnpm db:generate
pnpm db:migrate
```

Jalankan aplikasi:

```sh
pnpm --filter @repo/api dev
pnpm --filter @repo/admin dev
pnpm --filter @repo/worker dev
```

Buat akun admin:

```sh
pnpm createsuperuser
```

Port lokal bawaan:

- Admin: `http://localhost:4000`
- API: `http://localhost:8000`
- MinIO console: `http://localhost:9001`

## Catatan Teknis Singkat

Repository ini berisi aplikasi admin web, API, worker, database schema, shared UI, dan domain helpers. Detail teknis sengaja dijaga ringkas di README ini karena dokumen utama ditujukan untuk memahami nilai bisnis, modul, dan alur kerja aplikasi.

## Sinkronisasi Pengguna SIP Approval

Worker menyinkronkan direktori pengguna dari SIP Approval setiap hari pukul 02.00
`Asia/Jakarta`. Jadwal dapat diubah melalui `USER_SYNC_CRON` dan
`USER_SYNC_TIMEZONE`.

Konfigurasikan `EXTERNAL_AUTH_API_KEY` dengan kunci yang sama seperti
`EXTERNAL_API_KEY` di SIP Approval. Gunakan kunci internal terpisah untuk
`USER_SYNC_API_KEY`.

Sinkronisasi juga dapat dijalankan secara manual:

```sh
curl -H "x-user-sync-key: $USER_SYNC_API_KEY" \
  https://api-sip.asrafil.dev/users/sync
```

Endpoint tersebut menggunakan metode `GET`, tidak dapat di-cache, dan hanya menerima
kunci sinkronisasi atau sesi `super_admin`.

## CI/CD Produksi

Push ke branch `main` menjalankan `.github/workflows/deploy-production.yml`.
Workflow memeriksa format, tipe, tes, build, histori migrasi Prisma, dan dependency
critical sebelum mengirim commit yang tepat ke server produksi. Pull request ke `main`
menjalankan pemeriksaan yang sama tanpa melakukan deployment.

Deployment menyimpan `.env.production` hanya di server, menjalankan
`prisma migrate deploy`, lalu membuat ulang container API, admin, dan worker. PostgreSQL,
Redis, dan MinIO tidak dimulai ulang pada setiap perubahan aplikasi.

Job deployment menggunakan repository-scoped self-hosted runner berlabel
`sip-production` di server. Runner hanya menerima job deployment setelah pemeriksaan
push `main` berhasil. GitHub environment `production` hanya memerlukan variable
`PROD_PATH`; kredensial aplikasi tetap berada di `.env.production` dengan mode `600`
dan tidak disimpan di GitHub.

Seluruh perubahan `schema.prisma` wajib disertai migration SQL di
`apps/api/prisma/migrations`. CI akan menolak deployment bila keduanya tidak sinkron.
