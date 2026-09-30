"use client";
import { Suspense, useEffect, useState } from "react";
import { rupiah, fmtTanggal, today } from "@/lib/format";

type Laporan = {
  dari: string; sampai: string;
  per_komoditas: {
    komoditas_id: number; nama: string; satuan: string; total_berat: number;
    nilai_beli: number; harga_jual_terakhir: number | null;
    estimasi_nilai_jual: number | null; margin_kotor: number | null;
  }[];
  ringkasan: {
    total_berat: number; total_nilai_beli: number;
    total_estimasi_nilai_jual: number; total_margin_kotor: number;
  };
};

function LaporanInner() {
  const [dari, setDari] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [sampai, setSampai] = useState(today());
  const [data, setData] = useState<Laporan | null>(null);

  const muat = async () => {
    const r = await fetch(`/api/laporan?from=${dari}&to=${sampai}`);
    setData(await r.json());
  };
  useEffect(() => { muat(); }, []);

  const input = "rounded border px-3 py-2 text-sm";
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Laporan Stok & Margin</h1>
      <div className="mb-6 flex flex-wrap items-end gap-2 rounded-lg bg-white p-4 shadow">
        <label className="text-sm">Dari <input type="date" className={input} value={dari} onChange={(e) => setDari(e.target.value)} /></label>
        <label className="text-sm">Sampai <input type="date" className={input} value={sampai} onChange={(e) => setSampai(e.target.value)} /></label>
        <button className="rounded bg-emerald-700 px-4 py-2 text-sm text-white" onClick={muat}>Tampilkan</button>
      </div>

      {data && (
        <>
          <div className="mb-6 rounded-lg bg-white p-4 shadow">
            <h2 className="mb-2 font-semibold">Per Komoditas ({fmtTanggal(data.dari)} – {fmtTanggal(data.sampai)})</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="py-2">Komoditas</th>
                  <th className="py-2 text-right">Berat masuk</th>
                  <th className="py-2 text-right">Nilai beli</th>
                  <th className="py-2 text-right">Harga jual terakhir</th>
                  <th className="py-2 text-right">Estimasi nilai jual</th>
                  <th className="py-2 text-right">Margin kotor</th>
                </tr>
              </thead>
              <tbody>
                {data.per_komoditas.map((r) => (
                  <tr key={r.komoditas_id} className="border-b">
                    <td className="py-2 font-medium">{r.nama}</td>
                    <td className="py-2 text-right">{r.total_berat.toLocaleString("id-ID")} {r.satuan}</td>
                    <td className="py-2 text-right">{rupiah(r.nilai_beli)}</td>
                    <td className="py-2 text-right">{r.harga_jual_terakhir != null ? rupiah(r.harga_jual_terakhir) : "-"}</td>
                    <td className="py-2 text-right">{r.estimasi_nilai_jual != null ? rupiah(r.estimasi_nilai_jual) : "-"}</td>
                    <td className={`py-2 text-right font-medium ${r.margin_kotor != null && r.margin_kotor < 0 ? "text-red-600" : "text-emerald-700"}`}>
                      {r.margin_kotor != null ? rupiah(r.margin_kotor) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-lg bg-white p-4 shadow">
              <div className="text-sm text-slate-500">Total berat</div>
              <div className="text-xl font-bold">{data.ringkasan.total_berat.toLocaleString("id-ID")} kg</div>
            </div>
            <div className="rounded-lg bg-white p-4 shadow">
              <div className="text-sm text-slate-500">Nilai beli</div>
              <div className="text-xl font-bold">{rupiah(data.ringkasan.total_nilai_beli)}</div>
            </div>
            <div className="rounded-lg bg-white p-4 shadow">
              <div className="text-sm text-slate-500">Estimasi nilai jual</div>
              <div className="text-xl font-bold">{rupiah(data.ringkasan.total_estimasi_nilai_jual)}</div>
            </div>
            <div className="rounded-lg bg-white p-4 shadow">
              <div className="text-sm text-slate-500">Margin kotor</div>
              <div className={`text-xl font-bold ${data.ringkasan.total_margin_kotor < 0 ? "text-red-600" : "text-emerald-700"}`}>
                {rupiah(data.ringkasan.total_margin_kotor)}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function LaporanPage() {
  return (
    <Suspense fallback={<div>Memuat…</div>}>
      <LaporanInner />
    </Suspense>
  );
}
