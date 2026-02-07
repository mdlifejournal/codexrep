import fs from "node:fs/promises";
import { NextResponse } from "next/server";
import { getAllTerms, normalizeList, slugify, termsPath } from "@/lib/terms";
import { Term } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function parseRoots(raw: string): Term["roots"] {
  const items = raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  const roots = items
    .map((item) => {
      const [part, meaning] = item.split(":").map((value) => value?.trim());
      if (!part || !meaning) return null;
      return { part, meaning };
    })
    .filter(Boolean) as { part: string; meaning: string }[];

  return roots.length ? roots : undefined;
}

function parseReferences(raw: string): Term["references"] {
  const refs = raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [source, note] = item.split("|").map((value) => value?.trim());
      if (!source) return null;
      return note ? { source, note } : { source };
    })
    .filter(Boolean) as { source: string; note?: string }[];

  return refs.length ? refs : undefined;
}

export async function GET() {
  try {
    const terms = await getAllTerms();
    return NextResponse.json({ terms }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: `Failed to load terms: ${message}` }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const adminPassword = process.env.ADMIN_PASSWORD;
    const incomingPassword = request.headers.get("x-admin-password");

    if (!adminPassword || incomingPassword !== adminPassword) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const term = String(body.term ?? "").trim();
    const definition = String(body.definition ?? "").trim();
    const explanation = String(body.explanation ?? "").trim();

    if (!term || !definition || !explanation) {
      return NextResponse.json(
        { error: "term, definition, and explanation are required." },
        { status: 400 },
      );
    }

    const slug = slugify(term);
    if (!slug) {
      return NextResponse.json({ error: "Unable to generate a valid slug." }, { status: 400 });
    }

    const filePath = termsPath();
    const raw = await fs.readFile(filePath, "utf8");
    const existingTerms = JSON.parse(raw) as Term[];

    const duplicate = existingTerms.some((existingTerm) => existingTerm.slug === slug);
    if (duplicate) {
      return NextResponse.json({ error: `Term with slug "${slug}" already exists.` }, { status: 409 });
    }

    const newTerm: Term = {
      term,
      slug,
      definition,
      explanation,
      abbreviations: normalizeList(String(body.abbreviations ?? "")),
      synonyms: normalizeList(String(body.synonyms ?? "")),
      related: normalizeList(String(body.related ?? "")),
      roots: parseRoots(String(body.roots ?? "")),
      references: parseReferences(String(body.references ?? "")),
      createdAt: new Date().toISOString(),
    };

    const cleanedTerm: Term = {
      ...newTerm,
      abbreviations: newTerm.abbreviations?.length ? newTerm.abbreviations : undefined,
      synonyms: newTerm.synonyms?.length ? newTerm.synonyms : undefined,
      related: newTerm.related?.length ? newTerm.related : undefined,
    };

    existingTerms.push(cleanedTerm);
    await fs.writeFile(filePath, `${JSON.stringify(existingTerms, null, 2)}\n`, "utf8");

    return NextResponse.json({ term: cleanedTerm }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: `Failed to save term: ${message}` }, { status: 500 });
  }
}
