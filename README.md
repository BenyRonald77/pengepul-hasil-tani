# Pengepul Hasil Tani

Aplikasi pencatatan pengepul hasil tani: timbang setoran petani, harga beli
harian per komoditas, ledger kasbon/potongan, pembayaran per periode, dan
laporan stok & margin.

## Cara Menjalankan

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm run seed
npm run dev
```

## Halaman

- `/` — dashboard (ringkasan, harga berlaku hari ini, setoran terbaru)
- `/setoran` — timbang setoran + riwayat
- `/petani` — CRUD petani
- `/komoditas` — CRUD komoditas
- `/harga` — input & daftar harga harian
- `/petani/[id]/ledger` — saldo & ledger potongan/kasbon per petani
- `/periode` — daftar + buat + detail + bayar periode pembayaran
- `/laporan` — laporan stok & margin per komoditas

## API

- `GET/POST /api/petani`, `GET/PUT/DELETE /api/petani/[id]`, `GET /api/petani/[id]/saldo`
- `GET/POST /api/komoditas`, `PUT/DELETE /api/komoditas/[id]`
- `GET /api/harga?komoditas_id&date=` (harga berlaku), `POST /api/harga`
- `GET/POST /api/setoran`
- `GET /api/ledger?petani_id=`, `POST /api/ledger`
- `GET/POST /api/periode`, `GET /api/periode/[id]`, `POST /api/periode/[id]/bayar`
- `GET /api/laporan?from&to`

## Aturan bisnis penting

- Setoran gagal 409 jika belum ada harga berlaku untuk tanggal setoran.
- Saldo petani = setoran tercatat − potongan − kasbon − pembayaran (bisa
  negatif = petani berhutang).
- Jenis ledger "pembayaran" hanya dicatat otomatis saat periode dilunasi.
- Pelunasan periode: setoran dalam rentang → status "dibayar".
