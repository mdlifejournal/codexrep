import Link from "next/link";
import SearchBox from "@/components/SearchBox";
import { getAllTerms } from "@/lib/terms";

export default async function HomePage() {
  const terms = await getAllTerms();

  return (
    <div className="space-y-10">
      <section className="space-y-5 text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-stone-500">Medical Terms</p>
        <h1 className="font-serif text-5xl font-semibold text-stone-900">Medical Terms</h1>
        <SearchBox terms={terms} />
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-6">
        <h2 className="mb-4 font-serif text-2xl">Browse by letter</h2>
        <div className="flex flex-wrap gap-2">
          {"abcdefghijklmnopqrstuvwxyz".split("").map((letter) => (
            <Link
              key={letter}
              href={`/browse/${letter}`}
              className="rounded-md border border-stone-300 px-3 py-2 uppercase text-stone-700"
            >
              {letter}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
