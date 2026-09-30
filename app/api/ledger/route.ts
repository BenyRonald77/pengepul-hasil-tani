import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { today } from "@/lib/format";

const TANGGAL_RE = /^\d{4}-\d{2}-\d{2}$/;
const JENIS_MANUAL = ["potongan", "kasbon"] as const;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const petaniId = searchParams.get("petani_id");
  if (!petaniId) {
    return NextResponse.json({ error: "petani_id wajib diisi" }, { status: 400 });
  }
  const rows = await prisma.ledger.findMany({
    where: { petaniId: Number(petaniId) },
    orderBy: [{ tanggal: "desc" }, { id: "desc" }],
    take: 200,
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || !body.petani_id || !body.jenis || body.nominal == null) {
    return NextResponse.json(
      { error: "petani_id, jenis, nominal wajib diisi" },
      { status: 400 }
    );
  }
  const jenis = String(body.jenis);
  if (!(JENIS_MANUAL as readonly string[]).includes(jenis)) {
    return NextResponse.json(
      { error: 'jenis hanya boleh "potongan" atau "kasbon"' },
      { status: 409 }
    );
  }
  const nominal = Number(body.nominal);
  if (!Number.isFinite(nominal) || nominal <= 0) {
    return NextResponse.json({ error: "nominal harus angka positif" }, { status: 400 });
  }
  const tanggal = body.tanggal ? String(body.tanggal) : today();
  if (!TANGGAL_RE.test(tanggal)) {
    return NextResponse.json({ error: "tanggal tidak valid (YYYY-MM-DD)" }, { status: 400 });
  }
  const petani = await prisma.petani.findUnique({ where: { id: Number(body.petani_id) } });
  if (!petani) return NextResponse.json({ error: "petani tidak ditemukan" }, { status: 404 });

  const created = await prisma.ledger.create({
    data: {
      petaniId: petani.id,
      tanggal,
      jenis,
      keterangan: body.keterangan ? String(body.keterangan) : null,
      nominalRp: Math.round(nominal),
    },
  });
  return NextResponse.json(created, { status: 201 });
}
