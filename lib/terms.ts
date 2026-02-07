import fs from "node:fs/promises";
import path from "node:path";
import { Term } from "@/lib/types";

const termsFilePath = path.join(process.cwd(), "data", "terms.json");

export async function getAllTerms(): Promise<Term[]> {
  const raw = await fs.readFile(termsFilePath, "utf8");
  const parsed = JSON.parse(raw) as Term[];
  return parsed.sort((a, b) => a.term.localeCompare(b.term));
}

export async function getTermBySlug(slug: string): Promise<Term | undefined> {
  const terms = await getAllTerms();
  return terms.find((term) => term.slug === slug);
}

export async function getTermsByLetter(letter: string): Promise<Term[]> {
  const terms = await getAllTerms();
  const lower = letter.toLowerCase();
  return terms.filter((term) => term.term.toLowerCase().startsWith(lower));
}

export function slugify(term: string): string {
  return term
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function normalizeList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function termsPath(): string {
  return termsFilePath;
}
