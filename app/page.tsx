"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { rupiah, fmtTanggal, today } from "@/lib/format";

type HargaRow = {
  id: number;
  komoditasId: number;
  tanggal: string;
  hargaBeliPerSatuan: number;
  hargaJualPerSatuan: number;
  komoditas: { nama: string };
};

type SetoranRow = {
  id: number;
  tanggal: string;
  beratKg: number;
  totalRp: number;
  status: string;
  petani: { nama: string };
  komoditas: { nama: string };
};

export default function Dashboard() {
  const [petani, setPetani] = useState<any[]>([]);
  const [komoditas, setKomoditas] = useState<any[]>([]);
  const [harga, setHarga] = useState<HargaRow[]>([]);
  const [setoran, setSetoran] = useState<SetoranRow[]>([]);

  useEffect(() => {
    (async () => {
      const [p, k, h, s] = await Promise.all([
        fetch("/api/petani").then((r) => r.json()),
        fetch("/api/komoditas").then((r) => r.json()),
        fetch("/api/harga").then((r) => r.json()),
        fetch("/api/setoran").then((r) => r.json()),
      ]);
      setPetani(p);
      setKomoditas(k);
      setHarga(h);
      setSetoran(s);
    })();
  }, []);

  const tgl = today();
  const setoranHariIni = setoran.filter((s) => s.tanggal === tgl);
  const totalBerat = setoranHariIni.reduce((a, s) => a + s.beratKg, 0);

  // harga berlaku per komoditas (baris pertama = tanggal terbaru)
  const hargaBerlaku: HargaRow[] = [];
  const dilihat = new Set<number>();
  for (const h of harga) {
    if (!dilihat.has(h.komoditasId)) {
      dilihat.add(h.komoditasId);
      hargaBerlaku.push(h);
    }
  }

  const card = "rounded-lg bg-white p-4 shadow";
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Dashboard</h1>
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className={card}>
          <div className="text-sm text-slate-500">Petani</div>
          <div className="text-2xl font-bold">{petani.length}</div>
        </div>
        <div className={card}>
          <div className="text-sm text-slate-500">Komoditas</div>
          <div className="text-2xl font-bold">{komoditas.length}</div>
        </div>
        <div className={card}>
          <div className="text-sm text-slate-500">Setoran hari ini</div>
          <div className="text-2xl font-bold">{setoranHariIni.length}</div>
        </div>
        <div className={card}>
          <div className="text-sm text-slate-500">Berat hari ini (kg)</div>
          <div className="text-2xl font-bold">{totalBerat.toLocaleString("id-ID")}</div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className={card}>
          <h2 className="mb-2 font-semibold">Harga berlaku hari ini</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="py-1">Komoditas</th>
                <th className="py-1 text-right">Harga beli</th>
                <th className="py-1 text-right">Harga jual</th>
              </tr>
            </thead>
            <tbody>
              {hargaBerlaku.map((h) => (
                <tr key={h.id} className="border-b">
                  <td className="py-1">{h.komoditas.nama}</td>
                  <td className="py-1 text-right">{rupiah(h.hargaBeliPerSatuan)}</td>
                  <td className="py-1 text-right">{rupiah(h.hargaJualPerSatuan)}</td>
                </tr>
              ))}
              {hargaBerlaku.length === 0 && (
                <tr><td colSpan={3} className="py-2 text-slate-500">Belum ada harga. <Link className="text-emerald-700 underline" href="/harga">Isi harga harian</Link></td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className={card}>
          <h2 className="mb-2 font-semibold">Setoran terbaru</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="py-1">Tanggal</th>
                <th className="py-1">Petani</th>
                <th className="py-1 text-right">Berat</th>
                <th className="py-1 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {setoran.slice(0, 8).map((s) => (
                <tr key={s.id} className="border-b">
                  <td className="py-1">{fmtTanggal(s.tanggal)}</td>
                  <td className="py-1">{s.petani.nama} ({s.komoditas.nama})</td>
                  <td className="py-1 text-right">{s.beratKg.toLocaleString("id-ID")} kg</td>
                  <td className="py-1 text-right">{rupiah(s.totalRp)}</td>
                </tr>
              ))}
              {setoran.length === 0 && (
                <tr><td colSpan={4} className="py-2 text-slate-500">Belum ada setoran.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
