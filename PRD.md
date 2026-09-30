# PRD — Pengepul Hasil Tani

Aplikasi pencatatan pengepul hasil tani: timbang setoran petani, harga beli
harian per komoditas, ledger kasbon/potongan, pembayaran per periode, dan
laporan stok & margin.

## Stack

Next.js 14 + TypeScript + Prisma 5.22 + SQLite + Tailwind. Bahasa UI: Indonesia.
Tanggal disimpan sebagai TEXT `YYYY-MM-DD`, timestamp TEXT ISO.

## Model Data

### Petani
- id, nama (wajib), no_hp (opsional), alamat (opsional), dibuat_pada (ISO)

### Komoditas
- id, nama (wajib, unik), satuan (default "kg")

### HargaHarian
- id, komoditas_id (FK), tanggal (YYYY-MM-DD), harga_beli_per_satuan (Rp/satuan),
  harga_jual_per_satuan (Rp/satuan)
- Unik per (komoditas_id, tanggal)
- Harga "berlaku" pada suatu tanggal = baris terbaru dengan tanggal ≤ tanggal
  yang diminta.

### Setoran
- id, petani_id (FK), komoditas_id (FK), tanggal (YYYY-MM-DD),
  berat_kg (float > 0), harga_beli_saat_setor (snapshot dari HargaHarian),
  total_rp (berat × harga), status: "tercatat" | "dibayar"

### Ledger
- id, petani_id (FK), tanggal (YYYY-MM-DD), jenis: "potongan" | "kasbon" |
  "pembayaran", keterangan, nominal_rp (> 0)
- Aturan saldo: kasbon & potongan menambah tanggungan (mengurangi hak),
  pembayaran mengurangi tanggungan (menambah hak).

### PeriodeBayar
- id, petani_id (FK), tanggal_mulai, tanggal_selesai, total_setoran_rp,
  total_potongan_rp, total_kasbon_rp, dibayar_rp, status: "draft" | "lunas",
  dibuat_pada (ISO)

## Fungsionalitas

### F0 — Setup & Dashboard
Schema Prisma, seed, layout, dashboard: ringkasan (jumlah petani, komoditas,
setoran hari ini, total berat hari ini), harga berlaku hari ini, setoran
terbaru. Seed: 4 petani, 3 komoditas (gabah, jagung, cabai), harga harian 7
hari terakhir, contoh setoran + kasbon.

### F1 — Master data
CRUD petani & komoditas, input harga harian (form komoditas + tanggal + harga
beli + harga jual). Endpoint GET /api/harga?komoditas_id=&date= mengembalikan
harga berlaku (terbaru ≤ tanggal), 404 jika belum ada harga.

### F2 — Setoran (timbang)
POST /api/setoran {petani_id, komoditas_id, tanggal, berat_kg}: ambil
harga_beli berlaku; error 409 jika belum ada harga untuk tanggal itu;
validasi berat > 0 (400). Simpan snapshot harga_beli_saat_setor dan
total_rp = berat × harga. Halaman timbang: form + riwayat setoran terbaru.

### F3 — Ledger potongan & kasbon
POST /api/ledger {petani_id, jenis: "potongan"|"kasbon", nominal, keterangan}:
jenis "pembayaran" tidak boleh dibuat langsung (409).
GET /api/petani/[id]/saldo: total setoran berstatus "tercatat" − total
potongan − total kasbon − total pembayaran = sisa hak petani (bisa negatif
= petani berhutang). Halaman ledger per petani: saldo, riwayat ledger, form
tambah potongan/kasbon.

### F4 — Pembayaran per periode
POST /api/periode {petani_id, tanggal_mulai, tanggal_selesai}: agregasi
setoran "tercatat" dalam rentang + potongan/kasbon dalam rentang → buat
PeriodeBayar status "draft". Error 400 jika tidak ada setoran tercatat.
POST /api/periode/[id]/bayar {dibayar_rp}: status → "lunas", setoran dalam
rentang → "dibayar", catat Ledger jenis "pembayaran" sebesar dibayar_rp.
Halaman: daftar periode, detail, tombol bayar.

### F5 — Laporan stok & margin
GET /api/laporan?from&to: per komoditas → total berat masuk (setoran),
nilai beli (Σ total_rp), estimasi nilai jual (berat × harga_jual terakhir),
margin kotor (jual − beli), plus ringkasan total. Halaman /laporan dengan
filter tanggal, tabel per komoditas + ringkasan.

## API

- GET /api/petani, POST /api/petani, PUT/DELETE /api/petani/[id]
- GET /api/komoditas, POST /api/komoditas, PUT/DELETE /api/komoditas/[id]
- GET /api/harga?komoditas_id&date=, POST /api/harga
- GET /api/setoran, POST /api/setoran
- GET /api/ledger?petani_id=, POST /api/ledger
- GET /api/petani/[id]/saldo
- GET /api/periode, POST /api/periode, GET /api/periode/[id], POST /api/periode/[id]/bayar
- GET /api/laporan?from&to

## Halaman

- / — dashboard
- /petani — CRUD petani
- /komoditas — CRUD komoditas
- /harga — input & daftar harga harian
- /setoran — timbang + riwayat
- /petani/[id]/ledger — ledger & saldo per petani
- /periode — daftar periode + buat + detail + bayar
- /laporan — laporan stok & margin
