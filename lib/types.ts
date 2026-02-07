export type Term = {
  term: string;
  slug: string;
  definition: string;
  explanation: string;
  roots?: { part: string; meaning: string }[];
  abbreviations?: string[];
  synonyms?: string[];
  related?: string[];
  references?: { source: string; note?: string }[];
  createdAt: string;
};
