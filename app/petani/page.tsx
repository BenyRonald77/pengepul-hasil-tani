"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Petani = { id: number; nama: string; noHp: string | null; alamat: string | null };

export default function PetaniPage() {
  const [rows, setRows] = useState<Petani[]>([]);
  const [nama, setNama] = useState("");
  const [noHp, setNoHp] = useState("");
  const [alamat, setAlamat] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [err, setErr] = useState("");

  const muat = async () => {
    const r = await fetch("/api/petani");
    setRows(await r.json());
  };
  useEffect(() => { muat(); }, []);

  const simpan = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    const body = { nama, no_hp: noHp, alamat };
    const res = await fetch(editId ? `/api/petani/${editId}` : "/api/petani", {
      method: editId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await res.json();
    if (!res.ok) { setErr(j.error || "gagal menyimpan"); return; }
    setNama(""); setNoHp(""); setAlamat(""); setEditId(null);
    muat();
  };

  const mulaiEdit = (p: Petani) => {
    setEditId(p.id);
    setNama(p.nama);
    setNoHp(p.noHp ?? "");
    setAlamat(p.alamat ?? "");
  };

  const hapus = async (id: number) => {
    if (!confirm("Hapus petani ini beserta seluruh riwayatnya?")) return;
    const res = await fetch(`/api/petani/${id}`, { method: "DELETE" });
    if (res.ok) muat();
  };

  const input = "w-full rounded border px-3 py-2 text-sm";
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Petani</h1>
      <div className="mb-6 rounded-lg bg-white p-4 shadow">
        <h2 className="mb-2 font-semibold">{editId ? "Ubah Petani" : "Tambah Petani"}</h2>
        {err && <div className="mb-2 text-sm text-red-600">{err}</div>}
        <form onSubmit={simpan} className="grid gap-2 md:grid-cols-4">
          <input className={input} placeholder="Nama *" value={nama} onChange={(e) => setNama(e.target.value)} />
          <input className={input} placeholder="No. HP" value={noHp} onChange={(e) => setNoHp(e.target.value)} />
          <input className={input} placeholder="Alamat" value={alamat} onChange={(e) => setAlamat(e.target.value)} />
          <div className="flex gap-2">
            <button className="rounded bg-emerald-700 px-4 py-2 text-sm text-white">{editId ? "Simpan" : "Tambah"}</button>
            {editId && (
              <button type="button" className="rounded bg-slate-200 px-4 py-2 text-sm" onClick={() => { setEditId(null); setNama(""); setNoHp(""); setAlamat(""); }}>
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
              <th className="py-2">No. HP</th>
              <th className="py-2">Alamat</th>
              <th className="py-2 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-b">
                <td className="py-2 font-medium">{p.nama}</td>
                <td className="py-2">{p.noHp || "-"}</td>
                <td className="py-2">{p.alamat || "-"}</td>
                <td className="py-2 text-right">
                  <Link href={`/petani/${p.id}/ledger`} className="mr-2 text-emerald-700 underline">Ledger</Link>
                  <button className="mr-2 text-blue-700 underline" onClick={() => mulaiEdit(p)}>Ubah</button>
                  <button className="text-red-600 underline" onClick={() => hapus(p.id)}>Hapus</button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={4} className="py-2 text-slate-500">Belum ada petani.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
