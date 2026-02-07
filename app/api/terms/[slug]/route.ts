import fs from "node:fs/promises";
import { NextResponse } from "next/server";
import { normalizeList, termsPath } from "@/lib/terms";
import { Term } from "@/lib/types";

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

export async function PUT(request: Request, { params }: { params: { slug: string } }) {
  try {
    const adminPassword = process.env.ADMIN_PASSWORD;
    const incomingPassword = request.headers.get("x-admin-password");

    if (!adminPassword || incomingPassword !== adminPassword) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const slug = params.slug;
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

    const filePath = termsPath();
    const raw = await fs.readFile(filePath, "utf8");
    const existingTerms = JSON.parse(raw) as Term[];
    const index = existingTerms.findIndex((entry) => entry.slug === slug);

    if (index === -1) {
      return NextResponse.json({ error: "Term not found." }, { status: 404 });
    }

    const current = existingTerms[index];
    const updated: Term = {
      ...current,
      term,
      definition,
      explanation,
      abbreviations: normalizeList(String(body.abbreviations ?? "")),
      synonyms: normalizeList(String(body.synonyms ?? "")),
      related: normalizeList(String(body.related ?? "")),
      roots: parseRoots(String(body.roots ?? "")),
      references: parseReferences(String(body.references ?? "")),
    };

    const cleaned: Term = {
      ...updated,
      abbreviations: updated.abbreviations?.length ? updated.abbreviations : undefined,
      synonyms: updated.synonyms?.length ? updated.synonyms : undefined,
      related: updated.related?.length ? updated.related : undefined,
    };

    existingTerms[index] = cleaned;
    await fs.writeFile(filePath, `${JSON.stringify(existingTerms, null, 2)}\n`, "utf8");

    return NextResponse.json({ term: cleaned }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: `Failed to update term: ${message}` }, { status: 500 });
  }
}
