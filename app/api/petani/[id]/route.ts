import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const row = await prisma.petani.findUnique({
    where: { id: Number(params.id) },
  });
  if (!row) return NextResponse.json({ error: "petani tidak ditemukan" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json().catch(() => null);
  if (!body || !body.nama || !String(body.nama).trim()) {
    return NextResponse.json({ error: "nama wajib diisi" }, { status: 400 });
  }
  try {
    const updated = await prisma.petani.update({
      where: { id: Number(params.id) },
      data: {
        nama: String(body.nama).trim(),
        noHp: body.no_hp ? String(body.no_hp) : null,
        alamat: body.alamat ? String(body.alamat) : null,
      },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "petani tidak ditemukan" }, { status: 404 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.petani.delete({ where: { id: Number(params.id) } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "petani tidak ditemukan" }, { status: 404 });
  }
}
