import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "MedTerms",
  description: "A beginner-friendly etymology-style dictionary for medical terms.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="border-b border-stone-200 bg-white">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
            <Link href="/" className="font-serif text-2xl font-semibold text-stone-900">
              MedTerms
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/browse/a">Browse</Link>
              <Link href="/admin/add">Admin</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
