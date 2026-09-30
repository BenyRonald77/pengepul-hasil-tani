"use client";
import { useEffect, useState } from "react";
import { rupiah, fmtTanggal, today } from "@/lib/format";

type Opt = { id: number; nama: string };
type SetoranRow = {
  id: number; tanggal: string; beratKg: number; hargaBeliSaatSetor: number;
  totalRp: number; status: string;
  petani: { nama: string }; komoditas: { nama: string; satuan: string };
};

export default function SetoranPage() {
  const [petani, setPetani] = useState<Opt[]>([]);
  const [komoditas, setKomoditas] = useState<Opt[]>([]);
  const [rows, setRows] = useState<SetoranRow[]>([]);
  const [f, setF] = useState({ petani_id: "", komoditas_id: "", tanggal: today(), berat_kg: "" });
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const muat = async () => {
    const [p, k, s] = await Promise.all([
      fetch("/api/petani").then((r) => r.json()),
      fetch("/api/komoditas").then((r) => r.json()),
      fetch("/api/setoran").then((r) => r.json()),
    ]);
    setPetani(p); setKomoditas(k); setRows(s);
  };
  useEffect(() => { muat(); }, []);

  const simpan = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setMsg("");
    const res = await fetch("/api/setoran", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        petani_id: Number(f.petani_id),
        komoditas_id: Number(f.komoditas_id),
        tanggal: f.tanggal,
        berat_kg: Number(f.berat_kg),
      }),
    });
    const j = await res.json();
    if (!res.ok) { setErr(j.error || "gagal menyimpan"); return; }
    setMsg(`Tersimpan: ${j.beratKg} kg × ${rupiah(j.hargaBeliSaatSetor)} = ${rupiah(j.totalRp)}`);
    setF({ ...f, berat_kg: "" });
    muat();
  };

  const input = "w-full rounded border px-3 py-2 text-sm";
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Timbang Setoran</h1>
      <div className="mb-6 rounded-lg bg-white p-4 shadow">
        <h2 className="mb-2 font-semibold">Setoran Baru</h2>
        {err && <div className="mb-2 text-sm text-red-600">{err}</div>}
        {msg && <div className="mb-2 text-sm text-emerald-700">{msg}</div>}
        <form onSubmit={simpan} className="grid gap-2 md:grid-cols-5">
          <select className={input} value={f.petani_id} onChange={(e) => setF({ ...f, petani_id: e.target.value })} required>
            <option value="">— Petani —</option>
            {petani.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
          </select>
          <select className={input} value={f.komoditas_id} onChange={(e) => setF({ ...f, komoditas_id: e.target.value })} required>
            <option value="">— Komoditas —</option>
            {komoditas.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
          </select>
          <input type="date" className={input} value={f.tanggal} onChange={(e) => setF({ ...f, tanggal: e.target.value })} required />
          <input type="number" step="0.01" className={input} placeholder="Berat (kg) *" value={f.berat_kg} onChange={(e) => setF({ ...f, berat_kg: e.target.value })} required min={0.01} />
          <button className="rounded bg-emerald-700 px-4 py-2 text-sm text-white">Simpan Setoran</button>
        </form>
        <p className="mt-2 text-xs text-slate-500">Harga beli diambil otomatis dari harga harian yang berlaku pada tanggal setoran.</p>
      </div>
      <div className="rounded-lg bg-white p-4 shadow">
        <h2 className="mb-2 font-semibold">Riwayat Setoran</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-slate-500">
              <th className="py-2">Tanggal</th>
              <th className="py-2">Petani</th>
              <th className="py-2">Komoditas</th>
              <th className="py-2 text-right">Berat</th>
              <th className="py-2 text-right">Harga/kg</th>
              <th className="py-2 text-right">Total</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className="border-b">
                <td className="py-2">{fmtTanggal(s.tanggal)}</td>
                <td className="py-2">{s.petani.nama}</td>
                <td className="py-2">{s.komoditas.nama}</td>
                <td className="py-2 text-right">{s.beratKg.toLocaleString("id-ID")} kg</td>
                <td className="py-2 text-right">{rupiah(s.hargaBeliSaatSetor)}</td>
                <td className="py-2 text-right font-medium">{rupiah(s.totalRp)}</td>
                <td className="py-2">
                  <span className={`rounded px-2 py-0.5 text-xs ${s.status === "dibayar" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                    {s.status === "dibayar" ? "dibayar" : "tercatat"}
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={7} className="py-2 text-slate-500">Belum ada setoran.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
