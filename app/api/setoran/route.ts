import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hargaBerlaku } from "@/lib/harga";

const TANGGAL_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const petaniId = searchParams.get("petani_id");
  const rows = await prisma.setoran.findMany({
    where: petaniId ? { petaniId: Number(petaniId) } : undefined,
    include: { petani: true, komoditas: true },
    orderBy: [{ tanggal: "desc" }, { id: "desc" }],
    take: 100,
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (
    !body ||
    !body.petani_id ||
    !body.komoditas_id ||
    !body.tanggal ||
    body.berat_kg == null
  ) {
    return NextResponse.json(
      { error: "petani_id, komoditas_id, tanggal, berat_kg wajib diisi" },
      { status: 400 }
    );
  }
  if (!TANGGAL_RE.test(String(body.tanggal))) {
    return NextResponse.json({ error: "tanggal tidak valid (YYYY-MM-DD)" }, { status: 400 });
  }
  const berat = Number(body.berat_kg);
  if (!Number.isFinite(berat) || berat <= 0) {
    return NextResponse.json({ error: "berat_kg harus angka positif" }, { status: 400 });
  }
  const [petani, komoditas] = await Promise.all([
    prisma.petani.findUnique({ where: { id: Number(body.petani_id) } }),
    prisma.komoditas.findUnique({ where: { id: Number(body.komoditas_id) } }),
  ]);
  if (!petani) return NextResponse.json({ error: "petani tidak ditemukan" }, { status: 404 });
  if (!komoditas) return NextResponse.json({ error: "komoditas tidak ditemukan" }, { status: 404 });

  const harga = await hargaBerlaku(komoditas.id, String(body.tanggal));
  if (!harga) {
    return NextResponse.json(
      { error: `belum ada harga beli untuk ${komoditas.nama} pada tanggal ${body.tanggal}` },
      { status: 409 }
    );
  }

  const totalRp = Math.round(berat * harga.hargaBeliPerSatuan);
  const created = await prisma.setoran.create({
    data: {
      petaniId: petani.id,
      komoditasId: komoditas.id,
      tanggal: String(body.tanggal),
      beratKg: berat,
      hargaBeliSaatSetor: harga.hargaBeliPerSatuan,
      totalRp,
      status: "tercatat",
    },
  });
  return NextResponse.json(created, { status: 201 });
}
