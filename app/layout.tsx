import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pengepul Hasil Tani",
  description: "Timbang setoran, harga harian, ledger kasbon, pembayaran periode, laporan margin",
};

const menu = [
  { href: "/", label: "Dashboard" },
  { href: "/setoran", label: "Timbang" },
  { href: "/petani", label: "Petani" },
  { href: "/komoditas", label: "Komoditas" },
  { href: "/harga", label: "Harga Harian" },
  { href: "/periode", label: "Periode Bayar" },
  { href: "/laporan", label: "Laporan" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen text-slate-900">
        <nav className="bg-emerald-800 text-white">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-1 px-4 py-3">
            <Link href="/" className="font-bold text-lg">
              🌾 Pengepul Tani
            </Link>
            {menu.slice(1).map((m) => (
              <Link key={m.href} href={m.href} className="text-sm text-emerald-100 hover:text-white">
                {m.label}
              </Link>
            ))}
          </div>
        </nav>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
