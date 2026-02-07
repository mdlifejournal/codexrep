import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllTerms, getTermBySlug } from "@/lib/terms";

export async function generateStaticParams() {
  const terms = await getAllTerms();
  return terms.map((term) => ({ slug: term.slug }));
}

export default async function TermPage({ params }: { params: { slug: string } }) {
  const term = await getTermBySlug(params.slug);
  if (!term) notFound();

  return (
    <article className="mx-auto max-w-3xl space-y-6 rounded-xl border border-stone-200 bg-white p-8">
      <header className="space-y-1 border-b border-stone-200 pb-4">
        <h1 className="font-serif text-4xl">{term.term}</h1>
        <p className="text-lg text-stone-700">{term.definition}</p>
      </header>

      <section>
        <h2 className="mb-2 font-semibold uppercase tracking-widest text-stone-500">Explanation</h2>
        <p className="leading-7 text-stone-800">{term.explanation}</p>
      </section>

      {term.roots?.length ? (
        <section>
          <h2 className="mb-2 font-semibold uppercase tracking-widest text-stone-500">Roots</h2>
          <ul className="list-disc space-y-2 pl-6">
            {term.roots.map((root) => (
              <li key={`${root.part}-${root.meaning}`}>
                <strong>{root.part}</strong>: {root.meaning}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {term.abbreviations?.length ? (
        <p>
          <strong>Abbreviations:</strong> {term.abbreviations.join(", ")}
        </p>
      ) : null}

      {term.synonyms?.length ? (
        <p>
          <strong>Synonyms:</strong> {term.synonyms.join(", ")}
        </p>
      ) : null}

      {term.references?.length ? (
        <section>
          <h2 className="mb-2 font-semibold uppercase tracking-widest text-stone-500">References</h2>
          <ul className="list-disc space-y-2 pl-6">
            {term.references.map((reference) => (
              <li key={`${reference.source}-${reference.note ?? ""}`}>
                {reference.source}
                {reference.note ? ` — ${reference.note}` : ""}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {term.related?.length ? (
        <section>
          <h2 className="mb-2 font-semibold uppercase tracking-widest text-stone-500">Related terms</h2>
          <div className="flex flex-wrap gap-3">
            {term.related.map((relatedSlug) => (
              <Link key={relatedSlug} href={`/term/${relatedSlug}`} className="rounded bg-sky-50 px-3 py-2 text-sky-800">
                {relatedSlug.replace(/-/g, " ")}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
