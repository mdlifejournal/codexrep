"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Term } from "@/lib/types";

type SearchBoxProps = {
  terms: Term[];
};

export default function SearchBox({ terms }: SearchBoxProps) {
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const matches = useMemo(() => {
    if (!query.trim()) return [];
    const lower = query.toLowerCase();
    return terms
      .filter((term) => {
        const inTerm = term.term.toLowerCase().includes(lower);
        const inAbbr = term.abbreviations?.some((abbr) => abbr.toLowerCase().includes(lower));
        const inSynonym = term.synonyms?.some((syn) => syn.toLowerCase().includes(lower));
        return inTerm || inAbbr || inSynonym;
      })
      .slice(0, 8);
  }, [query, terms]);

  function moveHighlight(next: number) {
    if (matches.length === 0) return;
    const wrapped = (next + matches.length) % matches.length;
    setHighlightedIndex(wrapped);
  }

  return (
    <div className="relative mx-auto max-w-3xl">
      <input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setHighlightedIndex(0);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            moveHighlight(highlightedIndex + 1);
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            moveHighlight(highlightedIndex - 1);
          }
          if (event.key === "Enter" && matches[highlightedIndex]) {
            window.location.href = `/term/${matches[highlightedIndex].slug}`;
          }
        }}
        placeholder="Search medical terms, abbreviations, synonyms..."
        className="w-full rounded-xl border border-stone-300 bg-white px-4 py-4 text-lg shadow-sm focus:border-sky-600 focus:outline-none"
      />

      {query && matches.length > 0 ? (
        <ul className="absolute z-20 mt-2 w-full rounded-xl border border-stone-200 bg-white shadow-lg">
          {matches.map((term, index) => (
            <li key={term.slug} className={index === highlightedIndex ? "bg-sky-50" : undefined}>
              <Link
                href={`/term/${term.slug}`}
                className="block px-4 py-3"
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <span className="font-semibold text-stone-900">{term.term}</span>
                <span className="ml-2 text-sm text-stone-600">{term.definition}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
