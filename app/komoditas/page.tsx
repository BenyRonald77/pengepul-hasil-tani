"use client";
import { useEffect, useState } from "react";

type Komoditas = { id: number; nama: string; satuan: string };

export default function KomoditasPage() {
  const [rows, setRows] = useState<Komoditas[]>([]);
  const [nama, setNama] = useState("");
  const [satuan, setSatuan] = useState("kg");
  const [editId, setEditId] = useState<number | null>(null);
  const [err, setErr] = useState("");

  const muat = async () => {
    const r = await fetch("/api/komoditas");
    setRows(await r.json());
  };
  useEffect(() => { muat(); }, []);

  const simpan = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    const body = { nama, satuan };
    const res = await fetch(editId ? `/api/komoditas/${editId}` : "/api/komoditas", {
      method: editId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await res.json();
    if (!res.ok) { setErr(j.error || "gagal menyimpan"); return; }
    setNama(""); setSatuan("kg"); setEditId(null);
    muat();
  };

  const hapus = async (id: number) => {
    if (!confirm("Hapus komoditas ini?")) return;
    const res = await fetch(`/api/komoditas/${id}`, { method: "DELETE" });
    const j = await res.json();
    if (!res.ok) { alert(j.error || "gagal menghapus"); return; }
    muat();
  };

  const input = "w-full rounded border px-3 py-2 text-sm";
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Komoditas</h1>
      <div className="mb-6 rounded-lg bg-white p-4 shadow">
        <h2 className="mb-2 font-semibold">{editId ? "Ubah Komoditas" : "Tambah Komoditas"}</h2>
        {err && <div className="mb-2 text-sm text-red-600">{err}</div>}
        <form onSubmit={simpan} className="grid gap-2 md:grid-cols-4">
          <input className={input} placeholder="Nama *" value={nama} onChange={(e) => setNama(e.target.value)} />
          <input className={input} placeholder="Satuan" value={satuan} onChange={(e) => setSatuan(e.target.value)} />
          <div className="flex gap-2">
            <button className="rounded bg-emerald-700 px-4 py-2 text-sm text-white">{editId ? "Simpan" : "Tambah"}</button>
            {editId && (
              <button type="button" className="rounded bg-slate-200 px-4 py-2 text-sm" onClick={() => { setEditId(null); setNama(""); setSatuan("kg"); }}>
                Batal
              </button>
            )}
          </div>
        </form>
      </div>
      <div className="rounded-lg bg-white p-4 shadow">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-slate-500">
              <th className="py-2">Nama</th>
              <th className="py-2">Satuan</th>
              <th className="py-2 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((k) => (
              <tr key={k.id} className="border-b">
                <td className="py-2 font-medium">{k.nama}</td>
                <td className="py-2">{k.satuan}</td>
                <td className="py-2 text-right">
                  <button className="mr-2 text-blue-700 underline" onClick={() => { setEditId(k.id); setNama(k.nama); setSatuan(k.satuan); }}>Ubah</button>
                  <button className="text-red-600 underline" onClick={() => hapus(k.id)}>Hapus</button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={3} className="py-2 text-slate-500">Belum ada komoditas.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
