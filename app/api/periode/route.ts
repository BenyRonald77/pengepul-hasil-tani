import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nowIso } from "@/lib/format";

const TANGGAL_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET() {
  const rows = await prisma.periodeBayar.findMany({
    include: { petani: true },
    orderBy: [{ dibuatPada: "desc" }, { id: "desc" }],
    take: 100,
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || !body.petani_id || !body.tanggal_mulai || !body.tanggal_selesai) {
    return NextResponse.json(
      { error: "petani_id, tanggal_mulai, tanggal_selesai wajib diisi" },
      { status: 400 }
    );
  }
  const mulai = String(body.tanggal_mulai);
  const selesai = String(body.tanggal_selesai);
  if (!TANGGAL_RE.test(mulai) || !TANGGAL_RE.test(selesai)) {
    return NextResponse.json(
      { error: "tanggal tidak valid (YYYY-MM-DD)" },
      { status: 400 }
    );
  }
  if (mulai > selesai) {
    return NextResponse.json(
      { error: "tanggal_mulai tidak boleh setelah tanggal_selesai" },
      { status: 400 }
    );
  }
  const petani = await prisma.petani.findUnique({ where: { id: Number(body.petani_id) } });
  if (!petani) return NextResponse.json({ error: "petani tidak ditemukan" }, { status: 404 });

  const [setoranAgg, potonganAgg, kasbonAgg] = await Promise.all([
    prisma.setoran.aggregate({
      where: {
        petaniId: petani.id,
        status: "tercatat",
        tanggal: { gte: mulai, lte: selesai },
      },
      _sum: { totalRp: true },
    }),
    prisma.ledger.aggregate({
      where: {
        petaniId: petani.id,
        jenis: "potongan",
        tanggal: { gte: mulai, lte: selesai },
      },
      _sum: { nominalRp: true },
    }),
    prisma.ledger.aggregate({
      where: {
        petaniId: petani.id,
        jenis: "kasbon",
        tanggal: { gte: mulai, lte: selesai },
      },
      _sum: { nominalRp: true },
    }),
  ]);

  const totalSetoran = setoranAgg._sum.totalRp ?? 0;
  if (totalSetoran <= 0) {
    return NextResponse.json(
      { error: "tidak ada setoran tercatat pada rentang tanggal tersebut" },
      { status: 400 }
    );
  }

  const created = await prisma.periodeBayar.create({
    data: {
      petaniId: petani.id,
      tanggalMulai: mulai,
      tanggalSelesai: selesai,
      totalSetoranRp: totalSetoran,
      totalPotonganRp: potonganAgg._sum.nominalRp ?? 0,
      totalKasbonRp: kasbonAgg._sum.nominalRp ?? 0,
      status: "draft",
      dibuatPada: nowIso(),
    },
  });
  return NextResponse.json(created, { status: 201 });
}
