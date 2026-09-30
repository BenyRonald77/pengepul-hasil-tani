import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const rows = await prisma.komoditas.findMany({ orderBy: { nama: "asc" } });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || !body.nama || !String(body.nama).trim()) {
    return NextResponse.json({ error: "nama wajib diisi" }, { status: 400 });
  }
  try {
    const created = await prisma.komoditas.create({
      data: {
        nama: String(body.nama).trim(),
        satuan: body.satuan ? String(body.satuan) : "kg",
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: "nama komoditas sudah ada" }, { status: 409 });
  }
}
