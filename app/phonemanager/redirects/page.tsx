"use client";

import { useEffect, useMemo, useState } from "react";

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

export default function RedirectsManagerPage() {
  const [files, setFiles] = useState<string[]>([]);
  const [modelAliases, setModelAliases] = useState<string[]>([]);
  const [redirects, setRedirects] = useState<Record<string, string>>({});
  const [alias, setAlias] = useState("405hd.img");
  const [target, setTarget] = useState("sip/405_2.2.16.733.img");
  const [status, setStatus] = useState("Ready to create firmware redirect mappings.");
  const [saving, setSaving] = useState(false);
  const [deletingAlias, setDeletingAlias] = useState<string | null>(null);

  const aliasOptions = useMemo(
    () => Array.from(new Set([...modelAliases, ...Object.keys(redirects)])).sort((a, b) => a.localeCompare(b)),
    [modelAliases, redirects]
  );

  async function loadData() {
    try {
      const response = await fetch("/api/phonemanager/redirects?list=1");
      const data = await parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.error || "Unable to load redirect settings.");
      }

      setRedirects(data.redirects || {});
      setFiles(Array.isArray(data.files) ? data.files : []);

      const modelResponse = await fetch("/api/phonemanager/models");
      const modelData = await parseJsonResponse(modelResponse);

      if (!modelResponse.ok) {
        throw new Error(modelData.error || "Unable to load model aliases.");
      }

      setModelAliases(Array.isArray(modelData.models) ? modelData.models : []);
      setStatus("Redirect mappings loaded.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to load redirect settings.");
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setStatus(`Saving redirect for ${alias}...`);

    try {
      const response = await fetch("/api/phonemanager/redirects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alias, target }),
      });
      const data = await parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.error || "Unable to save redirect mapping.");
      }

      await loadData();
      setStatus(`${alias} now redirects to /${target}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to save redirect mapping.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(model: string) {
    setDeletingAlias(model);
    setStatus(`Deleting redirect for ${model}...`);

    try {
      const response = await fetch(`/api/phonemanager/redirects?alias=${encodeURIComponent(model)}`, {
        method: "DELETE",
      });
      const data = await parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.error || "Unable to delete redirect mapping.");
      }

      await loadData();
      setStatus(`${model} redirect removed.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to delete redirect mapping.");
    } finally {
      setDeletingAlias(null);
    }
  }

  return (
<>
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <form onSubmit={handleSave} className="grid gap-4 md:grid-cols-[1fr_1.2fr_auto] md:items-end">
            <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-200">
              Model alias
              <select
                value={alias}
                onChange={(event) => setAlias(event.target.value)}
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                {aliasOptions.length === 0 ? (
                  <option value="405hd.img">405hd.img</option>
                ) : (
                  aliasOptions.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))
                )}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-200">
              Firmware target
              <select
                value={target}
                onChange={(event) => setTarget(event.target.value)}
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                {files.map((file) => (
                  <option key={file} value={file}>{file}</option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-300"
            >
              {saving ? "Saving..." : "Save redirect"}
            </button>
          </form>

          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">{status}</p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <article className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-xl font-medium">Current redirects</h2>
            {Object.keys(redirects).length === 0 ? (
              <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">No redirect mappings have been saved yet.</p>
            ) : (
              <ul className="mt-4 flex flex-col gap-3">
                {Object.entries(redirects)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([aliasName, targetPath]) => (
                    <li key={aliasName} className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{aliasName}</p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">→ /{targetPath}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleDelete(aliasName)}
                          disabled={deletingAlias === aliasName}
                          className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-500 disabled:cursor-not-allowed disabled:bg-rose-300"
                        >
                          {deletingAlias === aliasName ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </article>

          <article className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-xl font-medium">Available firmware files</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">These are the real download targets you can redirect to.</p>
            <ul className="mt-4 max-h-112 space-y-2 overflow-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
              {files.map((file) => (
                <li key={file} className="rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950">
                  <button
                    type="button"
                    onClick={() => setTarget(file)}
                    className="w-full text-left text-zinc-800 hover:text-zinc-950 dark:text-zinc-100 dark:hover:text-white"
                  >
                    /{file}
                  </button>
                </li>
              ))}
            </ul>
          </article>
        </section>
</>
  );
}
