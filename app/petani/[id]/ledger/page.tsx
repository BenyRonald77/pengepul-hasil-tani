"use client";
import { useEffect, useState } from "react";
import { rupiah, fmtTanggal, today } from "@/lib/format";

type LedgerRow = { id: number; tanggal: string; jenis: string; keterangan: string | null; nominalRp: number };
type Saldo = {
  petani: { id: number; nama: string };
  total_setoran: number; total_potongan: number; total_kasbon: number;
  total_pembayaran: number; sisa_hak: number; berhutang: boolean;
};

const labelJenis: Record<string, string> = {
  potongan: "Potongan",
  kasbon: "Kasbon",
  pembayaran: "Pembayaran",
};

export default function LedgerPetaniPage({ params }: { params: { id: string } }) {
  const [rows, setRows] = useState<LedgerRow[]>([]);
  const [saldo, setSaldo] = useState<Saldo | null>(null);
  const [jenis, setJenis] = useState("kasbon");
  const [nominal, setNominal] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [tanggal, setTanggal] = useState(today());
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const muat = async () => {
    const [l, s] = await Promise.all([
      fetch(`/api/ledger?petani_id=${params.id}`).then((r) => r.json()),
      fetch(`/api/petani/${params.id}/saldo`).then((r) => r.json()),
    ]);
    setRows(l);
    setSaldo(s);
  };
  useEffect(() => { muat(); }, []);

  const simpan = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setMsg("");
    const res = await fetch("/api/ledger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        petani_id: Number(params.id),
        jenis,
        nominal: Number(nominal),
        keterangan,
        tanggal,
      }),
    });
    const j = await res.json();
    if (!res.ok) { setErr(j.error || "gagal menyimpan"); return; }
    setMsg("Tercatat.");
    setNominal(""); setKeterangan("");
    muat();
  };

  const input = "w-full rounded border px-3 py-2 text-sm";
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">
        Ledger{saldo ? ` — ${saldo.petani.nama}` : ""}
      </h1>

      {saldo && (
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
          <div className="rounded-lg bg-white p-4 shadow">
            <div className="text-sm text-slate-500">Setoran tercatat</div>
            <div className="text-xl font-bold">{rupiah(saldo.total_setoran)}</div>
          </div>
          <div className="rounded-lg bg-white p-4 shadow">
            <div className="text-sm text-slate-500">Potongan + kasbon</div>
            <div className="text-xl font-bold text-red-600">
              {rupiah(saldo.total_potongan + saldo.total_kasbon)}
            </div>
          </div>
          <div className="rounded-lg bg-white p-4 shadow">
            <div className="text-sm text-slate-500">Sudah dibayar</div>
            <div className="text-xl font-bold">{rupiah(saldo.total_pembayaran)}</div>
          </div>
          <div className="col-span-2 rounded-lg bg-white p-4 shadow md:col-span-3">
            <div className="text-sm text-slate-500">Sisa hak petani</div>
            <div className={`text-2xl font-bold ${saldo.berhutang ? "text-red-600" : "text-emerald-700"}`}>
              {rupiah(saldo.sisa_hak)}{saldo.berhutang ? " (berhutang)" : ""}
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 rounded-lg bg-white p-4 shadow">
        <h2 className="mb-2 font-semibold">Catat Potongan / Kasbon</h2>
        {err && <div className="mb-2 text-sm text-red-600">{err}</div>}
        {msg && <div className="mb-2 text-sm text-emerald-700">{msg}</div>}
        <form onSubmit={simpan} className="grid gap-2 md:grid-cols-5">
          <select className={input} value={jenis} onChange={(e) => setJenis(e.target.value)}>
            <option value="kasbon">Kasbon</option>
            <option value="potongan">Potongan</option>
          </select>
          <input type="number" className={input} placeholder="Nominal (Rp) *" value={nominal} onChange={(e) => setNominal(e.target.value)} required min={1} />
          <input className={input} placeholder="Keterangan" value={keterangan} onChange={(e) => setKeterangan(e.target.value)} />
          <input type="date" className={input} value={tanggal} onChange={(e) => setTanggal(e.target.value)} required />
          <button className="rounded bg-emerald-700 px-4 py-2 text-sm text-white">Catat</button>
        </form>
      </div>

      <div className="rounded-lg bg-white p-4 shadow">
        <h2 className="mb-2 font-semibold">Riwayat Ledger</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-slate-500">
              <th className="py-2">Tanggal</th>
              <th className="py-2">Jenis</th>
              <th className="py-2">Keterangan</th>
              <th className="py-2 text-right">Nominal</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((l) => (
              <tr key={l.id} className="border-b">
                <td className="py-2">{fmtTanggal(l.tanggal)}</td>
                <td className="py-2">
                  <span className={`rounded px-2 py-0.5 text-xs ${
                    l.jenis === "pembayaran" ? "bg-emerald-100 text-emerald-800" :
                    l.jenis === "kasbon" ? "bg-red-100 text-red-800" :
                    "bg-amber-100 text-amber-800"
                  }`}>
                    {labelJenis[l.jenis] ?? l.jenis}
                  </span>
                </td>
                <td className="py-2">{l.keterangan || "-"}</td>
                <td className="py-2 text-right">{rupiah(l.nominalRp)}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={4} className="py-2 text-slate-500">Belum ada ledger.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
