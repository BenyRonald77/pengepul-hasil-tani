import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hargaBerlaku } from "@/lib/harga";
import { today } from "@/lib/format";

const TANGGAL_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dari = searchParams.get("from") || today();
  const sampai = searchParams.get("to") || today();
  if (!TANGGAL_RE.test(dari) || !TANGGAL_RE.test(sampai)) {
    return NextResponse.json(
      { error: "from/to tidak valid (YYYY-MM-DD)" },
      { status: 400 }
    );
  }

  const komoditas = await prisma.komoditas.findMany({ orderBy: { nama: "asc" } });
  const perKomoditas = [];

  for (const k of komoditas) {
    const agg = await prisma.setoran.aggregate({
      where: {
        komoditasId: k.id,
        tanggal: { gte: dari, lte: sampai },
      },
      _sum: { beratKg: true, totalRp: true },
    });
    const totalBerat = agg._sum.beratKg ?? 0;
    const nilaiBeli = agg._sum.totalRp ?? 0;
    let hargaJualTerakhir: number | null = null;
    if (totalBerat > 0) {
      const harga = await hargaBerlaku(k.id, sampai);
      if (harga) hargaJualTerakhir = harga.hargaJualPerSatuan;
    }
    const estimasiJual =
      hargaJualTerakhir != null ? Math.round(totalBerat * hargaJualTerakhir) : null;
    perKomoditas.push({
      komoditas_id: k.id,
      nama: k.nama,
      satuan: k.satuan,
      total_berat: totalBerat,
      nilai_beli: nilaiBeli,
      harga_jual_terakhir: hargaJualTerakhir,
      estimasi_nilai_jual: estimasiJual,
      margin_kotor: estimasiJual != null ? estimasiJual - nilaiBeli : null,
    });
  }

  const totalBerat = perKomoditas.reduce((a, r) => a + r.total_berat, 0);
  const totalBeli = perKomoditas.reduce((a, r) => a + r.nilai_beli, 0);
  const totalJual = perKomoditas.reduce((a, r) => a + (r.estimasi_nilai_jual ?? 0), 0);

  return NextResponse.json({
    dari,
    sampai,
    per_komoditas: perKomoditas,
    ringkasan: {
      total_berat: totalBerat,
      total_nilai_beli: totalBeli,
      total_estimasi_nilai_jual: totalJual,
      total_margin_kotor: totalJual - totalBeli,
    },
  });
}
