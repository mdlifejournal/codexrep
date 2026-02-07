"use client";

import { FormEvent, useEffect, useState } from "react";

const SESSION_KEY = "medterm-admin-authenticated";
const PASSWORD_KEY = "medterm-admin-password";

export default function AddTermPage() {
  const [passwordInput, setPasswordInput] = useState("");
  const [savedPassword, setSavedPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const cached = localStorage.getItem(SESSION_KEY);
    const cachedPassword = sessionStorage.getItem(PASSWORD_KEY);
    if (cached === "true" && cachedPassword) {
      setSavedPassword(cachedPassword);
      setIsUnlocked(true);
    }
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const payload = {
      term: String(form.get("term") ?? ""),
      definition: String(form.get("definition") ?? ""),
      explanation: String(form.get("explanation") ?? ""),
      abbreviations: String(form.get("abbreviations") ?? ""),
      synonyms: String(form.get("synonyms") ?? ""),
      related: String(form.get("related") ?? ""),
      roots: String(form.get("roots") ?? ""),
      references: String(form.get("references") ?? ""),
    };

    const response = await fetch("/api/terms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": savedPassword,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      setStatus(`Error: ${data.error ?? "Unknown issue"}`);
      return;
    }

    setStatus(`Saved: ${data.term.term}`);
    event.currentTarget.reset();
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
            if (!passwordInput.trim()) {
              setStatus("Enter the admin password first.");
              return;
            }
            setSavedPassword(passwordInput);
            setIsUnlocked(true);
            localStorage.setItem(SESSION_KEY, "true");
            sessionStorage.setItem(PASSWORD_KEY, passwordInput);
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
      <h1 className="mb-6 font-serif text-3xl">Add a Medical Term</h1>
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => {
            setIsUnlocked(false);
            setSavedPassword("");
            localStorage.removeItem(SESSION_KEY);
            sessionStorage.removeItem(PASSWORD_KEY);
          }}
          className="text-sm text-stone-600 underline"
        >
          Lock admin panel
        </button>
      </div>
      <form className="space-y-4" onSubmit={submit}>
        <Input name="term" label="Term" required />
        <Input name="definition" label="Definition" required />
        <TextArea name="explanation" label="Explanation" required />
        <Input name="abbreviations" label="Abbreviations (comma separated)" />
        <Input name="synonyms" label="Synonyms (comma separated)" />
        <Input name="related" label="Related term slugs (comma separated)" />
        <TextArea name="roots" label='Roots as "part:meaning, part:meaning" (optional)' />
        <TextArea name="references" label='References as "source|note, source|note" (optional)' />
        <button className="rounded bg-sky-700 px-4 py-2 text-white">Save term</button>
      </form>
      {status ? <p className="mt-4 text-sm text-stone-700">{status}</p> : null}
    </div>
  );
}

function Input({ label, name, required = false }: { label: string; name: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-stone-700">{label}</span>
      <input name={name} required={required} className="w-full rounded border border-stone-300 px-3 py-2" />
    </label>
  );
}

function TextArea({ label, name, required = false }: { label: string; name: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-stone-700">{label}</span>
      <textarea name={name} required={required} rows={4} className="w-full rounded border border-stone-300 px-3 py-2" />
    </label>
  );
}
