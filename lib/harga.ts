import { prisma } from "@/lib/prisma";

/** Harga berlaku = baris terbaru dengan tanggal ≤ tanggal yang diminta. */
export async function hargaBerlaku(komoditasId: number, tanggal: string) {
  return prisma.hargaHarian.findFirst({
    where: { komoditasId, tanggal: { lte: tanggal } },
    orderBy: { tanggal: "desc" },
  });
}
