import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hargaBerlaku } from "@/lib/harga";
import { today } from "@/lib/format";

const TANGGAL_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const komoditasId = searchParams.get("komoditas_id");
  const tanggal = searchParams.get("date") || today();

  if (komoditasId) {
    const id = Number(komoditasId);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "komoditas_id tidak valid" }, { status: 400 });
    }
    if (!TANGGAL_RE.test(tanggal)) {
      return NextResponse.json({ error: "date tidak valid (YYYY-MM-DD)" }, { status: 400 });
    }
    const harga = await hargaBerlaku(id, tanggal);
    if (!harga) {
      return NextResponse.json(
        { error: "belum ada harga untuk komoditas pada tanggal tersebut" },
        { status: 404 }
      );
    }
    return NextResponse.json({
      ...harga,
      harga_beli_per_satuan: harga.hargaBeliPerSatuan,
      harga_jual_per_satuan: harga.hargaJualPerSatuan,
      tanggal_berlaku: harga.tanggal,
    });
  }

  const rows = await prisma.hargaHarian.findMany({
    include: { komoditas: true },
    orderBy: [{ tanggal: "desc" }, { komoditasId: "asc" }],
    take: 100,
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (
    !body ||
    !body.komoditas_id ||
    !body.tanggal ||
    body.harga_beli_per_satuan == null ||
    body.harga_jual_per_satuan == null
  ) {
    return NextResponse.json(
      { error: "komoditas_id, tanggal, harga_beli_per_satuan, harga_jual_per_satuan wajib diisi" },
      { status: 400 }
    );
  }
  if (!TANGGAL_RE.test(String(body.tanggal))) {
    return NextResponse.json({ error: "tanggal tidak valid (YYYY-MM-DD)" }, { status: 400 });
  }
  const beli = Number(body.harga_beli_per_satuan);
  const jual = Number(body.harga_jual_per_satuan);
  if (!Number.isFinite(beli) || beli <= 0 || !Number.isFinite(jual) || jual <= 0) {
    return NextResponse.json({ error: "harga harus angka positif" }, { status: 400 });
  }
  const komoditas = await prisma.komoditas.findUnique({
    where: { id: Number(body.komoditas_id) },
  });
  if (!komoditas) {
    return NextResponse.json({ error: "komoditas tidak ditemukan" }, { status: 404 });
  }
  try {
    const created = await prisma.hargaHarian.upsert({
      where: {
        komoditasId_tanggal: {
          komoditasId: komoditas.id,
          tanggal: String(body.tanggal),
        },
      },
      create: {
        komoditasId: komoditas.id,
        tanggal: String(body.tanggal),
        hargaBeliPerSatuan: Math.round(beli),
        hargaJualPerSatuan: Math.round(jual),
      },
      update: {
        hargaBeliPerSatuan: Math.round(beli),
        hargaJualPerSatuan: Math.round(jual),
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: "gagal menyimpan harga" }, { status: 500 });
  }
}
