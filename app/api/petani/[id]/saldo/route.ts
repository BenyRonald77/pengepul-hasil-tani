import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  const petani = await prisma.petani.findUnique({ where: { id } });
  if (!petani) return NextResponse.json({ error: "petani tidak ditemukan" }, { status: 404 });

  const [setoran, potongan, kasbon, pembayaran] = await Promise.all([
    prisma.setoran.aggregate({
      where: { petaniId: id, status: "tercatat" },
      _sum: { totalRp: true },
    }),
    prisma.ledger.aggregate({
      where: { petaniId: id, jenis: "potongan" },
      _sum: { nominalRp: true },
    }),
    prisma.ledger.aggregate({
      where: { petaniId: id, jenis: "kasbon" },
      _sum: { nominalRp: true },
    }),
    prisma.ledger.aggregate({
      where: { petaniId: id, jenis: "pembayaran" },
      _sum: { nominalRp: true },
    }),
  ]);

  const totalSetoran = setoran._sum.totalRp ?? 0;
  const totalPotongan = potongan._sum.nominalRp ?? 0;
  const totalKasbon = kasbon._sum.nominalRp ?? 0;
  const totalPembayaran = pembayaran._sum.nominalRp ?? 0;
  const sisaHak = totalSetoran - totalPotongan - totalKasbon - totalPembayaran;

  return NextResponse.json({
    petani,
    total_setoran: totalSetoran,
    total_potongan: totalPotongan,
    total_kasbon: totalKasbon,
    total_pembayaran: totalPembayaran,
    sisa_hak: sisaHak,
    berhutang: sisaHak < 0,
  });
}
