import Link from "next/link";
import { getTermsByLetter } from "@/lib/terms";

export default async function BrowsePage({ params }: { params: { letter: string } }) {
  const letter = params.letter.slice(0, 1).toLowerCase();
  const terms = await getTermsByLetter(letter);

  return (
    <section className="space-y-6">
      <h1 className="font-serif text-4xl">Terms starting with “{letter.toUpperCase()}”</h1>
      {terms.length === 0 ? <p>No terms found for this letter.</p> : null}
      <ul className="space-y-4">
        {terms.map((term) => (
          <li key={term.slug} className="rounded-lg border border-stone-200 bg-white p-4">
            <Link href={`/term/${term.slug}`} className="text-xl font-semibold">
              {term.term}
            </Link>
            <p className="text-stone-700">{term.definition}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
