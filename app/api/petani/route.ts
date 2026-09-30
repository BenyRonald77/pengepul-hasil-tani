import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nowIso } from "@/lib/format";

export async function GET() {
  const rows = await prisma.petani.findMany({ orderBy: { nama: "asc" } });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || !body.nama || !String(body.nama).trim()) {
    return NextResponse.json({ error: "nama wajib diisi" }, { status: 400 });
  }
  const created = await prisma.petani.create({
    data: {
      nama: String(body.nama).trim(),
      noHp: body.no_hp ? String(body.no_hp) : null,
      alamat: body.alamat ? String(body.alamat) : null,
      dibuatPada: nowIso(),
    },
  });
  return NextResponse.json(created, { status: 201 });
}
