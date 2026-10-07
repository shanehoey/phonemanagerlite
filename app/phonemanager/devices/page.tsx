"use client";

import { useEffect, useState } from "react";

async function parseJsonResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return { error: text.slice(0, 200) };
  }
}

export default function ModelCatalogPage() {
  const [models, setModels] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("Ready to edit the model alias list.");

  async function loadModels() {
    try {
      const response = await fetch("/api/phonemanager/models");
      const data = await parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.error || "Unable to load model aliases.");
      }

      const nextModels = Array.isArray(data.models) ? data.models : [];
      setModels(nextModels);
      setDraft(nextModels.join("\n"));
      setStatus("Model aliases loaded.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to load model aliases.");
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadModels();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setStatus("Saving model aliases...");

    try {
      const nextModels = draft
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));

      const response = await fetch("/api/phonemanager/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ models: nextModels }),
      });
      const data = await parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.error || "Unable to save model aliases.");
      }

      setModels(nextModels);
      setStatus("Model aliases saved successfully.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to save model aliases.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <form onSubmit={handleSave} className="space-y-4">
            <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-200">
              Model aliases (one per line)
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={10}
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </label>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-zinc-600 dark:text-zinc-300">{status}</p>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-300"
              >
                {saving ? "Saving..." : "Save aliases"}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-xl font-medium">Current aliases</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {models.map((model) => (
              <li key={model} className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-sm dark:border-zinc-800 dark:bg-zinc-900">{model}</li>
            ))}
          </ul>
        </section>
</>

  );
}
