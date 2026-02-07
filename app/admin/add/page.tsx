"use client";

import { ClipboardEvent, FormEvent, useEffect, useState } from "react";
import { Term } from "@/lib/types";

const SESSION_KEY = "medterm-admin-authenticated";
const PASSWORD_KEY = "medterm-admin-password";

type FormState = {
  term: string;
  definition: string;
  explanation: string;
  abbreviations: string;
  synonyms: string;
  related: string;
  roots: string;
  references: string;
};

const emptyForm: FormState = {
  term: "",
  definition: "",
  explanation: "",
  abbreviations: "",
  synonyms: "",
  related: "",
  roots: "",
  references: "",
};

function toFormState(term: Term): FormState {
  return {
    term: term.term,
    definition: term.definition,
    explanation: term.explanation,
    abbreviations: term.abbreviations?.join(", ") ?? "",
    synonyms: term.synonyms?.join(", ") ?? "",
    related: term.related?.join(", ") ?? "",
    roots: term.roots?.map((root) => `${root.part}:${root.meaning}`).join(", ") ?? "",
    references:
      term.references
        ?.map((reference) => `${reference.source}${reference.note ? `|${reference.note}` : ""}`)
        .join(", ") ?? "",
  };
}

export default function AddTermPage() {
  const [passwordInput, setPasswordInput] = useState("");
  const [savedPassword, setSavedPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState<FormState>(emptyForm);

  useEffect(() => {
    const cached = localStorage.getItem(SESSION_KEY);
    const cachedPassword = sessionStorage.getItem(PASSWORD_KEY);
    if (cached === "true" && cachedPassword) {
      setSavedPassword(cachedPassword);
      setPasswordInput(cachedPassword);
      setIsUnlocked(true);
    }
  }, []);

  async function loadTerms() {
    const response = await fetch("/api/terms", { cache: "no-store" });
    const data = await response.json();
    if (response.ok) {
      setTerms(data.terms as Term[]);
      return;
    }
    setStatus(`Error: ${data.error ?? "Could not load terms list."}`);
  }

  useEffect(() => {
    if (!isUnlocked) return;
    loadTerms();
  }, [isUnlocked]);

  function savePassword(password: string) {
    setSavedPassword(password);
    setPasswordInput(password);
    sessionStorage.setItem(PASSWORD_KEY, password);
  }

  async function uploadImage(file: File): Promise<string | null> {
    const payload = new FormData();
    payload.append("image", file);

    const response = await fetch("/api/uploads", {
      method: "POST",
      headers: {
        "x-admin-password": savedPassword.trim(),
      },
      body: payload,
    });

    const data = await response.json();
    if (!response.ok) {
      setStatus(`Error: ${data.error ?? "Image upload failed."}`);
      return null;
    }

    return String(data.url);
  }

  async function handleExplanationPaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    const imageItem = Array.from(event.clipboardData.items).find((item) => item.type.startsWith("image/"));
    if (!imageItem) return;

    event.preventDefault();
    const imageFile = imageItem.getAsFile();
    if (!imageFile) return;

    setStatus("Uploading pasted image...");
    const imageUrl = await uploadImage(imageFile);
    if (!imageUrl) return;

    const textarea = event.currentTarget;
    const selectionStart = textarea.selectionStart ?? formState.explanation.length;
    const selectionEnd = textarea.selectionEnd ?? selectionStart;
    const before = formState.explanation.slice(0, selectionStart);
    const after = formState.explanation.slice(selectionEnd);
    const markdown = `\n![Pasted medical image](${imageUrl})\n`;

    setFormState((prev) => ({
      ...prev,
      explanation: `${before}${markdown}${after}`,
    }));

    setStatus("Image uploaded and inserted into explanation.");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const endpoint = isEditing && selectedSlug ? `/api/terms/${selectedSlug}` : "/api/terms";
    const method = isEditing ? "PUT" : "POST";

    const response = await fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": savedPassword.trim(),
      },
      body: JSON.stringify(formState),
    });

    const data = await response.json();
    if (!response.ok) {
      if (response.status === 401) {
        setStatus(
          "Error: Unauthorized. Make sure ADMIN_PASSWORD in .env.local matches the password entered here, then restart npm run dev.",
        );
        return;
      }
      setStatus(`Error: ${data.error ?? "Unknown issue"}`);
      return;
    }

    setStatus(isEditing ? `Updated: ${data.term.term}` : `Saved: ${data.term.term}`);

    await loadTerms();

    if (!isEditing) {
      setFormState(emptyForm);
      setSelectedSlug("");
    }
  }

  if (!isUnlocked) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-stone-200 bg-white p-6">
        <h1 className="mb-4 font-serif text-3xl">Admin Access</h1>
        <p className="mb-3 text-stone-700">Enter the admin password to continue.</p>
        <input
          type="password"
          value={passwordInput}
          onChange={(event) => setPasswordInput(event.target.value)}
          className="mb-4 w-full rounded border border-stone-300 px-3 py-2"
        />
        <button
          onClick={() => {
            const trimmed = passwordInput.trim();
            if (!trimmed) {
              setStatus("Enter the admin password first.");
              return;
            }
            savePassword(trimmed);
            setIsUnlocked(true);
            localStorage.setItem(SESSION_KEY, "true");
            setStatus(null);
          }}
          className="rounded bg-stone-900 px-4 py-2 text-white"
        >
          Unlock
        </button>
        {status ? <p className="mt-3 text-sm text-rose-700">{status}</p> : null}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl rounded-xl border border-stone-200 bg-white p-6">
      <h1 className="mb-6 font-serif text-3xl">Add or Edit a Medical Term</h1>
      <label className="mb-4 block">
        <span className="mb-1 block text-sm font-semibold text-stone-700">Admin password</span>
        <input
          type="password"
          value={passwordInput}
          onChange={(event) => {
            const value = event.target.value;
            setPasswordInput(value);
            savePassword(value);
          }}
          className="w-full rounded border border-stone-300 px-3 py-2"
        />
      </label>

      <div className="mb-4 rounded-md border border-stone-200 bg-stone-50 p-3">
        <p className="mb-2 text-sm font-semibold text-stone-700">Edit existing term</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={selectedSlug}
            onChange={(event) => setSelectedSlug(event.target.value)}
            className="w-full rounded border border-stone-300 bg-white px-3 py-2"
          >
            <option value="">Select a term to edit...</option>
            {terms.map((term) => (
              <option key={term.slug} value={term.slug}>
                {term.term}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              if (!selectedSlug) return;
              const selected = terms.find((term) => term.slug === selectedSlug);
              if (!selected) return;
              setFormState(toFormState(selected));
              setIsEditing(true);
              setStatus(`Editing: ${selected.term}`);
            }}
            className="rounded bg-stone-900 px-4 py-2 text-white"
          >
            Load
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedSlug("");
              setIsEditing(false);
              setFormState(emptyForm);
              setStatus("Switched to add mode.");
            }}
            className="rounded border border-stone-300 bg-white px-4 py-2"
          >
            New
          </button>
        </div>
      </div>

      <div className="mb-3 text-sm text-stone-600">Mode: {isEditing ? "Edit existing term" : "Add new term"}</div>

      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => {
            setIsUnlocked(false);
            setSavedPassword("");
            setPasswordInput("");
            setStatus(null);
            localStorage.removeItem(SESSION_KEY);
            sessionStorage.removeItem(PASSWORD_KEY);
          }}
          className="text-sm text-stone-600 underline"
        >
          Lock admin panel
        </button>
      </div>

      <form className="space-y-4" onSubmit={submit}>
        <Input
          name="term"
          label="Term"
          required
          value={formState.term}
          onChange={(value) => setFormState((prev) => ({ ...prev, term: value }))}
        />
        <Input
          name="definition"
          label="Definition"
          required
          value={formState.definition}
          onChange={(value) => setFormState((prev) => ({ ...prev, definition: value }))}
        />
        <TextArea
          name="explanation"
          label="Explanation"
          required
          value={formState.explanation}
          onPaste={handleExplanationPaste}
          hint="Tip: paste an image directly here. It will be uploaded and inserted as markdown."
          onChange={(value) => setFormState((prev) => ({ ...prev, explanation: value }))}
        />
        <Input
          name="abbreviations"
          label="Abbreviations (comma separated)"
          value={formState.abbreviations}
          onChange={(value) => setFormState((prev) => ({ ...prev, abbreviations: value }))}
        />
        <Input
          name="synonyms"
          label="Synonyms (comma separated)"
          value={formState.synonyms}
          onChange={(value) => setFormState((prev) => ({ ...prev, synonyms: value }))}
        />
        <Input
          name="related"
          label="Related term slugs (comma separated)"
          value={formState.related}
          onChange={(value) => setFormState((prev) => ({ ...prev, related: value }))}
        />
        <TextArea
          name="roots"
          label='Roots as "part:meaning, part:meaning" (optional)'
          value={formState.roots}
          onChange={(value) => setFormState((prev) => ({ ...prev, roots: value }))}
        />
        <TextArea
          name="references"
          label='References as "source|note, source|note" (optional)'
          value={formState.references}
          onChange={(value) => setFormState((prev) => ({ ...prev, references: value }))}
        />
        <button className="rounded bg-sky-700 px-4 py-2 text-white">{isEditing ? "Update term" : "Save term"}</button>
      </form>
      {status ? <p className="mt-4 text-sm text-stone-700">{status}</p> : null}
    </div>
  );
}

function Input({
  label,
  name,
  required = false,
  value,
  onChange,
}: {
  label: string;
  name: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-stone-700">{label}</span>
      <input
        name={name}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded border border-stone-300 px-3 py-2"
      />
    </label>
  );
}

function TextArea({
  label,
  name,
  required = false,
  value,
  onChange,
  hint,
  onPaste,
}: {
  label: string;
  name: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  onPaste?: (event: ClipboardEvent<HTMLTextAreaElement>) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-stone-700">{label}</span>
      <textarea
        name={name}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onPaste={onPaste}
        rows={4}
        className="w-full rounded border border-stone-300 px-3 py-2"
      />
      {hint ? <span className="mt-1 block text-xs text-stone-500">{hint}</span> : null}
    </label>
  );
}
