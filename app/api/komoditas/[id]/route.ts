import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json().catch(() => null);
  if (!body || !body.nama || !String(body.nama).trim()) {
    return NextResponse.json({ error: "nama wajib diisi" }, { status: 400 });
  }
  try {
    const updated = await prisma.komoditas.update({
      where: { id: Number(params.id) },
      data: {
        nama: String(body.nama).trim(),
        satuan: body.satuan ? String(body.satuan) : "kg",
      },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "komoditas tidak ditemukan atau nama sudah dipakai" },
      { status: 409 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.komoditas.delete({ where: { id: Number(params.id) } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "komoditas tidak ditemukan atau masih dipakai setoran" },
      { status: 409 }
    );
  }
}
