"use client";
import { useEffect, useState } from "react";
import { rupiah, fmtTanggal, today } from "@/lib/format";

type Komoditas = { id: number; nama: string; satuan: string };
type HargaRow = {
  id: number; komoditasId: number; tanggal: string;
  hargaBeliPerSatuan: number; hargaJualPerSatuan: number;
  komoditas: { nama: string; satuan: string };
};

export default function HargaPage() {
  const [komoditas, setKomoditas] = useState<Komoditas[]>([]);
  const [rows, setRows] = useState<HargaRow[]>([]);
  const [komoditasId, setKomoditasId] = useState("");
  const [tanggal, setTanggal] = useState(today());
  const [beli, setBeli] = useState("");
  const [jual, setJual] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const muat = async () => {
    const [k, h] = await Promise.all([
      fetch("/api/komoditas").then((r) => r.json()),
      fetch("/api/harga").then((r) => r.json()),
    ]);
    setKomoditas(k);
    setRows(h);
  };
  useEffect(() => { muat(); }, []);

  const simpan = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setMsg("");
    const res = await fetch("/api/harga", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        komoditas_id: Number(komoditasId),
        tanggal,
        harga_beli_per_satuan: Number(beli),
        harga_jual_per_satuan: Number(jual),
      }),
    });
    const j = await res.json();
    if (!res.ok) { setErr(j.error || "gagal menyimpan"); return; }
    setMsg("Harga tersimpan.");
    setBeli(""); setJual("");
    muat();
  };

  const input = "w-full rounded border px-3 py-2 text-sm";
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Harga Harian</h1>
      <div className="mb-6 rounded-lg bg-white p-4 shadow">
        <h2 className="mb-2 font-semibold">Input / Perbarui Harga</h2>
        {err && <div className="mb-2 text-sm text-red-600">{err}</div>}
        {msg && <div className="mb-2 text-sm text-emerald-700">{msg}</div>}
        <form onSubmit={simpan} className="grid gap-2 md:grid-cols-5">
          <select className={input} value={komoditasId} onChange={(e) => setKomoditasId(e.target.value)} required>
            <option value="">— Komoditas —</option>
            {komoditas.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
          </select>
          <input type="date" className={input} value={tanggal} onChange={(e) => setTanggal(e.target.value)} required />
          <input type="number" className={input} placeholder="Harga beli/kg (Rp) *" value={beli} onChange={(e) => setBeli(e.target.value)} required min={1} />
          <input type="number" className={input} placeholder="Harga jual/kg (Rp) *" value={jual} onChange={(e) => setJual(e.target.value)} required min={1} />
          <button className="rounded bg-emerald-700 px-4 py-2 text-sm text-white">Simpan</button>
        </form>
      </div>
      <div className="rounded-lg bg-white p-4 shadow">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-slate-500">
              <th className="py-2">Tanggal</th>
              <th className="py-2">Komoditas</th>
              <th className="py-2 text-right">Harga beli</th>
              <th className="py-2 text-right">Harga jual</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((h) => (
              <tr key={h.id} className="border-b">
                <td className="py-2">{fmtTanggal(h.tanggal)}</td>
                <td className="py-2 font-medium">{h.komoditas.nama}</td>
                <td className="py-2 text-right">{rupiah(h.hargaBeliPerSatuan)}/{h.komoditas.satuan}</td>
                <td className="py-2 text-right">{rupiah(h.hargaJualPerSatuan)}/{h.komoditas.satuan}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={4} className="py-2 text-slate-500">Belum ada harga.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
