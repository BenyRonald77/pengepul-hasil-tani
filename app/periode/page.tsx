"use client";
import { useEffect, useState } from "react";
import { rupiah, fmtTanggal, today } from "@/lib/format";

type Periode = {
  id: number; tanggalMulai: string; tanggalSelesai: string;
  totalSetoranRp: number; totalPotonganRp: number; totalKasbonRp: number;
  dibayarRp: number; status: string; dibuatPada: string;
  petani: { nama: string };
};

type Detail = {
  periode: Periode;
  setoran: { id: number; tanggal: string; beratKg: number; totalRp: number; komoditas: { nama: string } }[];
};

export default function PeriodePage() {
  const [petani, setPetani] = useState<{ id: number; nama: string }[]>([]);
  const [rows, setRows] = useState<Periode[]>([]);
  const [f, setF] = useState({ petani_id: "", tanggal_mulai: today(), tanggal_selesai: today() });
  const [detail, setDetail] = useState<Detail | null>(null);
  const [dibayarRp, setDibayarRp] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const muat = async () => {
    const [p, per] = await Promise.all([
      fetch("/api/petani").then((r) => r.json()),
      fetch("/api/periode").then((r) => r.json()),
    ]);
    setPetani(p); setRows(per);
  };
  useEffect(() => { muat(); }, []);

  const buat = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setMsg("");
    const res = await fetch("/api/periode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        petani_id: Number(f.petani_id),
        tanggal_mulai: f.tanggal_mulai,
        tanggal_selesai: f.tanggal_selesai,
      }),
    });
    const j = await res.json();
    if (!res.ok) { setErr(j.error || "gagal membuat periode"); return; }
    setMsg("Periode draft dibuat.");
    setDetail(null);
    muat();
    lihatDetail(j.id);
  };

  const lihatDetail = async (id: number) => {
    const r = await fetch(`/api/periode/${id}`);
    setDetail(await r.json());
    setDibayarRp("");
  };

  const bayar = async () => {
    if (!detail) return;
    setErr(""); setMsg("");
    if (!confirm(`Lunasi periode ${detail.periode.petani.nama} sebesar ${rupiah(Number(dibayarRp))}?`)) return;
    const res = await fetch(`/api/periode/${detail.periode.id}/bayar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dibayar_rp: Number(dibayarRp) }),
    });
    const j = await res.json();
    if (!res.ok) { setErr(j.error || "gagal membayar"); return; }
    setMsg("Periode dilunasi.");
    muat();
    lihatDetail(detail.periode.id);
  };

  const input = "w-full rounded border px-3 py-2 text-sm";
  const neto = (p: Periode) => p.totalSetoranRp - p.totalPotonganRp - p.totalKasbonRp;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Periode Pembayaran</h1>
      <div className="mb-6 rounded-lg bg-white p-4 shadow">
        <h2 className="mb-2 font-semibold">Buat Periode Baru</h2>
        {err && <div className="mb-2 text-sm text-red-600">{err}</div>}
        {msg && <div className="mb-2 text-sm text-emerald-700">{msg}</div>}
        <form onSubmit={buat} className="grid gap-2 md:grid-cols-4">
          <select className={input} value={f.petani_id} onChange={(e) => setF({ ...f, petani_id: e.target.value })} required>
            <option value="">— Petani —</option>
            {petani.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
          </select>
          <input type="date" className={input} value={f.tanggal_mulai} onChange={(e) => setF({ ...f, tanggal_mulai: e.target.value })} required />
          <input type="date" className={input} value={f.tanggal_selesai} onChange={(e) => setF({ ...f, tanggal_selesai: e.target.value })} required />
          <button className="rounded bg-emerald-700 px-4 py-2 text-sm text-white">Buat Draft</button>
        </form>
      </div>

      <div className="mb-6 rounded-lg bg-white p-4 shadow">
        <h2 className="mb-2 font-semibold">Daftar Periode</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-slate-500">
              <th className="py-2">Petani</th>
              <th className="py-2">Rentang</th>
              <th className="py-2 text-right">Setoran</th>
              <th className="py-2 text-right">Potong+Kasbon</th>
              <th className="py-2 text-right">Neto</th>
              <th className="py-2">Status</th>
              <th className="py-2 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-b">
                <td className="py-2">{p.petani.nama}</td>
                <td className="py-2">{fmtTanggal(p.tanggalMulai)} – {fmtTanggal(p.tanggalSelesai)}</td>
                <td className="py-2 text-right">{rupiah(p.totalSetoranRp)}</td>
                <td className="py-2 text-right">{rupiah(p.totalPotonganRp + p.totalKasbonRp)}</td>
                <td className="py-2 text-right font-medium">{rupiah(neto(p))}</td>
                <td className="py-2">
                  <span className={`rounded px-2 py-0.5 text-xs ${p.status === "lunas" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                    {p.status}
                  </span>
                </td>
                <td className="py-2 text-right">
                  <button className="text-blue-700 underline" onClick={() => lihatDetail(p.id)}>Detail</button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={7} className="py-2 text-slate-500">Belum ada periode.</td></tr>}
          </tbody>
        </table>
      </div>

      {detail && (
        <div className="rounded-lg bg-white p-4 shadow">
          <h2 className="mb-2 font-semibold">
            Detail — {detail.periode.petani.nama} ({fmtTanggal(detail.periode.tanggalMulai)} – {fmtTanggal(detail.periode.tanggalSelesai)})
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="py-2">Tanggal</th>
                <th className="py-2">Komoditas</th>
                <th className="py-2 text-right">Berat</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {detail.setoran.map((s) => (
                <tr key={s.id} className="border-b">
                  <td className="py-2">{fmtTanggal(s.tanggal)}</td>
                  <td className="py-2">{s.komoditas.nama}</td>
                  <td className="py-2 text-right">{s.beratKg.toLocaleString("id-ID")} kg</td>
                  <td className="py-2 text-right">{rupiah(s.totalRp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 text-sm">
            <div>Total setoran: <b>{rupiah(detail.periode.totalSetoranRp)}</b></div>
            <div>Potongan: <b>{rupiah(detail.periode.totalPotonganRp)}</b> · Kasbon: <b>{rupiah(detail.periode.totalKasbonRp)}</b></div>
            <div>Neto: <b>{rupiah(neto(detail.periode))}</b></div>
            {detail.periode.status === "lunas" && <div>Dibayar: <b className="text-emerald-700">{rupiah(detail.periode.dibayarRp)}</b></div>}
          </div>
          {detail.periode.status === "draft" && (
            <div className="mt-3 flex items-center gap-2">
              <input type="number" className={`${input} max-w-xs`} placeholder="Nominal dibayar (Rp)" value={dibayarRp} onChange={(e) => setDibayarRp(e.target.value)} min={1} />
              <button className="rounded bg-emerald-700 px-4 py-2 text-sm text-white" onClick={bayar}>Bayar & Lunas</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
