import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllTerms, getTermBySlug } from "@/lib/terms";

export async function generateStaticParams() {
  const terms = await getAllTerms();
  return terms.map((term) => ({ slug: term.slug }));
}

type ExplanationBlock =
  | { type: "text"; value: string }
  | { type: "image"; alt: string; src: string };

function parseExplanation(explanation: string): ExplanationBlock[] {
  return explanation
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (!match) {
        return { type: "text", value: line } as ExplanationBlock;
      }

      const [, alt, src] = match;
      return { type: "image", alt: alt || "Explanation image", src } as ExplanationBlock;
    });
}

function renderTextWithLinks(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
  const matches = [...text.matchAll(urlRegex)];

  if (matches.length === 0) {
    return text;
  }

  const parts: React.ReactNode[] = [];
  let cursor = 0;

  matches.forEach((match, index) => {
    const rawUrl = match[0];
    const start = match.index ?? 0;

    let cleanUrl = rawUrl;
    while (/[),.;!?]$/.test(cleanUrl)) {
      cleanUrl = cleanUrl.slice(0, -1);
    }

    const trailing = rawUrl.slice(cleanUrl.length);

    if (start > cursor) {
      parts.push(text.slice(cursor, start));
    }

    const href = cleanUrl.startsWith("www.") ? `https://${cleanUrl}` : cleanUrl;

    parts.push(
      <a
        key={`${href}-${index}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all font-medium text-sky-700 underline decoration-sky-600 hover:text-sky-600"
      >
        {cleanUrl}
      </a>,
    );

    if (trailing) {
      parts.push(trailing);
    }

    cursor = start + rawUrl.length;
  });

  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }

  return parts;
}

export default async function TermPage({ params }: { params: { slug: string } }) {
  const term = await getTermBySlug(params.slug);
  if (!term) notFound();

  const explanationBlocks = parseExplanation(term.explanation);

  return (
    <article className="mx-auto max-w-3xl space-y-6 rounded-xl border border-stone-200 bg-white p-8">
      <header className="space-y-1 border-b border-stone-200 pb-4">
        <h1 className="font-serif text-4xl">{term.term}</h1>
        <p className="text-lg text-stone-700">{term.definition}</p>
      </header>

      <section>
        <h2 className="mb-2 font-semibold uppercase tracking-widest text-stone-500">Explanation</h2>
        <div className="space-y-4">
          {explanationBlocks.map((block, index) =>
            block.type === "image" ? (
              <img
                key={`${block.src}-${index}`}
                src={block.src}
                alt={block.alt}
                className="max-h-96 w-full rounded-lg border border-stone-200 object-contain"
              />
            ) : (
              <p key={`${block.value}-${index}`} className="leading-7 text-stone-800">
                {renderTextWithLinks(block.value)}
              </p>
            ),
          )}
        </div>
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
