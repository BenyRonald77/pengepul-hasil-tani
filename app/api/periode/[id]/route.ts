import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const row = await prisma.periodeBayar.findUnique({
    where: { id: Number(params.id) },
    include: { petani: true },
  });
  if (!row) return NextResponse.json({ error: "periode tidak ditemukan" }, { status: 404 });

  const setoran = await prisma.setoran.findMany({
    where: {
      petaniId: row.petaniId,
      tanggal: { gte: row.tanggalMulai, lte: row.tanggalSelesai },
    },
    include: { komoditas: true },
    orderBy: { tanggal: "asc" },
  });

  return NextResponse.json({ periode: row, setoran });
}
