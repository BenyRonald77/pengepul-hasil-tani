import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json().catch(() => null);
  if (!body || body.dibayar_rp == null) {
    return NextResponse.json({ error: "dibayar_rp wajib diisi" }, { status: 400 });
  }
  const dibayar = Number(body.dibayar_rp);
  if (!Number.isFinite(dibayar) || dibayar <= 0) {
    return NextResponse.json({ error: "dibayar_rp harus angka positif" }, { status: 400 });
  }

  const periode = await prisma.periodeBayar.findUnique({
    where: { id: Number(params.id) },
  });
  if (!periode) return NextResponse.json({ error: "periode tidak ditemukan" }, { status: 404 });
  if (periode.status === "lunas") {
    return NextResponse.json({ error: "periode sudah lunas" }, { status: 409 });
  }

  await prisma.$transaction([
    prisma.setoran.updateMany({
      where: {
        petaniId: periode.petaniId,
        status: "tercatat",
        tanggal: { gte: periode.tanggalMulai, lte: periode.tanggalSelesai },
      },
      data: { status: "dibayar" },
    }),
    prisma.ledger.create({
      data: {
        petaniId: periode.petaniId,
        tanggal: periode.tanggalSelesai,
        jenis: "pembayaran",
        keterangan: `Pembayaran periode ${periode.tanggalMulai} s/d ${periode.tanggalSelesai}`,
        nominalRp: Math.round(dibayar),
      },
    }),
    prisma.periodeBayar.update({
      where: { id: periode.id },
      data: { status: "lunas", dibayarRp: Math.round(dibayar) },
    }),
  ]);

  const updated = await prisma.periodeBayar.findUnique({
    where: { id: periode.id },
    include: { petani: true },
  });
  return NextResponse.json(updated);
}
