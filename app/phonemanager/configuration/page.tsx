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

export default function DhcpConfigEditorPage() {
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState("dhcpoption160.cfg");
  const [saveAsFile, setSaveAsFile] = useState("dhcpoption160.cfg");
  const [content, setContent] = useState("Loading...");
  const [status, setStatus] = useState("Ready to edit a config file.");
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<{ type: "create" | "delete"; fileName: string } | null>(null);
  const [pendingSaveName, setPendingSaveName] = useState("");

  async function loadFile(filename: string) {
    try {
      const response = await fetch(`/api/phonemanager/config?file=${encodeURIComponent(filename)}`);
      const data = await parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.error || "Unable to load the selected file.");
      }

      setContent(data.content || "");
      setStatus(`Loaded ${data.file || filename}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to load the selected file.");
    }
  }

  useEffect(() => {
    let mounted = true;

    async function loadFiles() {
      try {
        const response = await fetch("/api/phonemanager/config?list=1");
        const data = await parseJsonResponse(response);

        if (!mounted) return;

        if (!response.ok) {
          throw new Error(data.error || "Unable to list config files.");
        }

        const nextFiles = Array.isArray(data.files) ? data.files : [];
        setFiles(nextFiles);

        if (!nextFiles.includes(selectedFile) && nextFiles.length > 0) {
          setSelectedFile(nextFiles[0]);
          setSaveAsFile(nextFiles[0]);
        }
      } catch (error) {
        if (!mounted) return;
        setStatus(error instanceof Error ? error.message : "Failed to list config files.");
      }
    }

    loadFiles();
    const timer = window.setTimeout(() => {
      void loadFile(selectedFile);
    }, 0);

    return () => {
      mounted = false;
      window.clearTimeout(timer);
    };
  }, [selectedFile]);

  async function refreshFiles() {
    try {
      const response = await fetch("/api/phonemanager/config?list=1");
      const data = await parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.error || "Unable to refresh config files.");
      }

      const nextFiles = Array.isArray(data.files) ? data.files : [];
      setFiles(nextFiles);
      return nextFiles;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to refresh config files.");
      return [];
    }
  }

  async function handleCreateNewFile() {
    setPendingSaveName("new.cfg");
    setModal({ type: "create", fileName: "new.cfg" });
  }

  async function confirmCreate() {
    const safeTarget = pendingSaveName.trim() || "new.cfg";

    if (!safeTarget) {
      setStatus("A filename is required.");
      setModal(null);
      return;
    }

    if (files.includes(safeTarget)) {
      setStatus(`File "${safeTarget}" already exists.`);
      setModal(null);
      return;
    }

    setSaving(true);
    setStatus(`Creating ${safeTarget}...`);

    try {
      const response = await fetch("/api/phonemanager/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", file: safeTarget, content: "" }),
      });

      const data = await parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.error || "Unable to create the file.");
      }

      const nextFiles = await refreshFiles();
      setSelectedFile(safeTarget);
      setSaveAsFile(safeTarget);
      await loadFile(safeTarget);
      setStatus(`${safeTarget} created successfully.`);
      if (!nextFiles.includes(safeTarget)) {
        setFiles((prev) => [...prev, safeTarget].sort((a, b) => a.localeCompare(b)));
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to create the file.");
    } finally {
      setSaving(false);
      setModal(null);
      setPendingSaveName("");
    }
  }

  async function handleDeleteFile() {
    if (selectedFile === "dhcpoption160.cfg") {
      setStatus("dhcpoption160.cfg cannot be deleted.");
      return;
    }

    setModal({ type: "delete", fileName: selectedFile });
  }

  async function confirmDelete() {
    if (!modal) return;

    setSaving(true);
    setStatus(`Deleting ${selectedFile}...`);

    try {
      const response = await fetch(`/api/phonemanager/config?file=${encodeURIComponent(modal.fileName)}`, {
        method: "DELETE",
      });

      const data = await parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.error || "Unable to delete the file.");
      }

      const nextFiles = await refreshFiles();
      const fallback = nextFiles[0] || "dhcpoption160.cfg";
      setSelectedFile(fallback);
      setSaveAsFile(fallback);
      setContent("");
      setStatus(`${modal.fileName} deleted successfully.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to delete the file.");
    } finally {
      setSaving(false);
      setModal(null);
    }
  }

  async function handleSave() {
    const destination = selectedFile || saveAsFile || "dhcpoption160.cfg";
    await performSave(destination);
  }

  async function performSave(destination: string) {
    setSaving(true);
    setStatus(`Saving ${destination}...`);

    try {
      const response = await fetch("/api/phonemanager/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, file: destination }),
      });

      const data = await parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.error || "Unable to save the selected file.");
      }

      setSelectedFile(destination);
      setSaveAsFile(destination);
      setStatus(`${destination} saved successfully.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to save the selected file.");
    } finally {
      setSaving(false);
      setModal(null);
      setPendingSaveName("");
    }
  }

  return (
     
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-xl font-medium">Configuration editor</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{status}</p>
            </div>

            <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
              <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                Open file
                <select
                  value={selectedFile}
                  onChange={(event) => setSelectedFile(event.target.value)}
                  className="min-w-40 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                >
                  {files.map((file) => (
                    <option key={file} value={file}>{file}</option>
                  ))}
                </select>
              </label>

              <div className="flex items-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCreateNewFile}
                  disabled={saving}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
                >
                  {saving ? "Working..." : "Create"}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteFile}
                  disabled={saving || selectedFile === "dhcpoption160.cfg"}
                  className="rounded-xl bg-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 dark:disabled:bg-zinc-900 dark:disabled:text-zinc-600"
                >
                  {saving ? "Working..." : "Delete"}
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-300"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>

          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            spellCheck={false}
            className="min-h-96 w-full rounded-xl border border-zinc-200 bg-zinc-950 p-4 font-mono text-sm text-zinc-100 shadow-inner outline-none transition focus:border-zinc-400 dark:border-zinc-700 dark:bg-black"
          />

          {modal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {modal.type === "create" ? "Create file" : "Delete file"}
                </h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                  {modal.type === "create"
                    ? "Choose a new filename for the config template."
                    : `Delete "${modal.fileName}" permanently?`}
                </p>
                {modal.type === "create" && (
                  <input
                    type="text"
                    value={pendingSaveName}
                    onChange={(event) => setPendingSaveName(event.target.value)}
                    className="mt-4 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                )}
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModal(null)}
                    className="rounded-xl bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={modal.type === "create" ? confirmCreate : confirmDelete}
                    className={modal.type === "create"
                      ? "rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-300"
                      : "rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500"}
                  >
                    {modal.type === "create" ? "Create" : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

  );
}
