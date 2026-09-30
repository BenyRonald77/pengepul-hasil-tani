import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const dayStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

async function main() {
  const n = await prisma.petani.count();
  if (n > 0) {
    console.log("seed dilewati (sudah ada data)");
    return;
  }
  const now = new Date().toISOString();

  const petani = await prisma.$transaction(
    [
      { nama: "H. Slamet", noHp: "081234567801", alamat: "Dusun Krajan RT 02" },
      { nama: "Bu Sari", noHp: "081234567802", alamat: "Dusun Kebon RT 05" },
      { nama: "Pak Jono", noHp: "081234567803", alamat: "Dusun Sawah RT 01" },
      { nama: "Bu Tini", noHp: "081234567804", alamat: "Dusun Nglebak RT 03" },
    ].map((p) => prisma.petani.create({ data: { ...p, dibuatPada: now } }))
  );

  const gabah = await prisma.komoditas.create({
    data: { nama: "Gabah", satuan: "kg" },
  });
  const jagung = await prisma.komoditas.create({
    data: { nama: "Jagung", satuan: "kg" },
  });
  const cabai = await prisma.komoditas.create({
    data: { nama: "Cabai", satuan: "kg" },
  });

  // Harga harian 7 hari terakhir
  const hargaBeli: Record<string, number> = { Gabah: 6500, Jagung: 5200, Cabai: 32000 };
  const hargaJual: Record<string, number> = { Gabah: 7200, Jagung: 5800, Cabai: 38000 };
  for (const k of [gabah, jagung, cabai]) {
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      await prisma.hargaHarian.create({
        data: {
          komoditasId: k.id,
          tanggal: dayStr(d),
          hargaBeliPerSatuan: hargaBeli[k.nama],
          hargaJualPerSatuan: hargaJual[k.nama],
        },
      });
    }
  }

  // Contoh setoran
  const setor = async (
    pIdx: number,
    k: typeof gabah,
    hariLalu: number,
    berat: number
  ) => {
    const d = new Date();
    d.setDate(d.getDate() - hariLalu);
    const tgl = dayStr(d);
    const harga = await prisma.hargaHarian.findFirst({
      where: { komoditasId: k.id, tanggal: { lte: tgl } },
      orderBy: { tanggal: "desc" },
    });
    if (!harga) throw new Error("harga tidak ada");
    await prisma.setoran.create({
      data: {
        petaniId: petani[pIdx].id,
        komoditasId: k.id,
        tanggal: tgl,
        beratKg: berat,
        hargaBeliSaatSetor: harga.hargaBeliPerSatuan,
        totalRp: Math.round(berat * harga.hargaBeliPerSatuan),
        status: "tercatat",
      },
    });
  };
  await setor(0, gabah, 1, 520);
  await setor(0, jagung, 2, 310);
  await setor(1, gabah, 1, 430);
  await setor(1, cabai, 0, 45);
  await setor(2, jagung, 3, 280);
  await setor(3, cabai, 0, 38);

  // Contoh kasbon + potongan
  const tglHariIni = dayStr(new Date());
  await prisma.ledger.create({
    data: {
      petaniId: petani[0].id,
      tanggal: tglHariIni,
      jenis: "kasbon",
      keterangan: "Kasbon modal pupuk",
      nominalRp: 500000,
    },
  });
  await prisma.ledger.create({
    data: {
      petaniId: petani[1].id,
      tanggal: tglHariIni,
      jenis: "potongan",
      keterangan: "Potongan karung",
      nominalRp: 15000,
    },
  });

  console.log("seed selesai");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
