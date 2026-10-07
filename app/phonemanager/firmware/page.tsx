"use client";

import { useCallback, useEffect, useState } from "react";

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

export default function FirmwareManagerPage() {
  const [files, setFiles] = useState<string[]>([]);
  const [folders, setFolders] = useState<string[]>(["."]);
  const [selectedFolder, setSelectedFolder] = useState(".");
  const [status, setStatus] = useState("Ready to upload firmware files.");
  const [uploading, setUploading] = useState(false);
  const [deletingName, setDeletingName] = useState<string | null>(null);

  const refreshFolders = useCallback(async () => {
    try {
      const response = await fetch("/api/phonemanager/firmware?folders=1");
      const data = await parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.error || "Unable to list folders.");
      }

      const nextFolders = Array.isArray(data.folders) ? data.folders : ["."];
      setFolders(nextFolders);
      return nextFolders;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to list folders.");
      return ["."];
    }
  }, []);

  const refreshFiles = useCallback(async (folder = selectedFolder) => {
    try {
      const response = await fetch(`/api/phonemanager/firmware?folder=${encodeURIComponent(folder)}`);
      const data = await parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.error || "Unable to list firmware files.");
      }

      setFiles(Array.isArray(data.files) ? data.files : []);
      return Array.isArray(data.files) ? data.files : [];
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to list firmware files.");
      return [];
    }
  }, [selectedFolder]);

  useEffect(() => {
    void (async () => {
      const nextFolders = await refreshFolders();

      if (nextFolders.length > 0 && !nextFolders.includes(selectedFolder)) {
        setSelectedFolder(nextFolders[0]);
        await refreshFiles(nextFolders[0]);
        return;
      }

      await refreshFiles(selectedFolder);
    })();
  }, [refreshFiles, refreshFolders, selectedFolder]);

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const input = form.elements.namedItem("firmwareFile") as HTMLInputElement | null;
    const file = input?.files?.[0];

    if (!file) {
      setStatus("Choose a firmware file first.");
      return;
    }

    setUploading(true);
    setStatus(`Uploading ${file.name}...`);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", selectedFolder);

      const response = await fetch("/api/phonemanager/firmware", {
        method: "POST",
        body: formData,
      });
      const data = await parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.error || "Unable to upload the firmware file.");
      }

      await refreshFiles(selectedFolder);
      setStatus(`${file.name} uploaded successfully.`);
      form.reset();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to upload the firmware file.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(fileName: string) {
    setDeletingName(fileName);
    setStatus(`Deleting ${fileName}...`);

    try {
      const response = await fetch(`/api/phonemanager/firmware?file=${encodeURIComponent(fileName)}&folder=${encodeURIComponent(selectedFolder)}`, {
        method: "DELETE",
      });
      const data = await parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.error || "Unable to delete the firmware file.");
      }

      await refreshFiles(selectedFolder);
      setStatus(`${fileName} deleted successfully.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to delete the firmware file.");
    } finally {
      setDeletingName(null);
    }
  }

  return (
   <>        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <form onSubmit={handleUpload} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-200">
              Folder
              <select
                value={selectedFolder}
                onChange={(event) => {
                  const nextFolder = event.target.value;
                  setSelectedFolder(nextFolder);
                  void refreshFiles(nextFolder);
                }}
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                {folders.map((folder) => (
                  <option key={folder} value={folder}>{folder === "." ? "Base folder" : folder}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-1 flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-200">
              Choose file
              <input
                type="file"
                name="firmwareFile"
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </label>
            <button
              type="submit"
              disabled={uploading}
              className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-300"
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </form>

          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">{status}</p>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-xl font-medium">Stored firmware files</h2>
          {files.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">No firmware files have been uploaded yet.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {files.map((fileName) => (
                <li key={fileName} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
                  <span className="font-mono text-sm text-zinc-800 dark:text-zinc-100">{fileName}</span>
                  <button
                    type="button"
                    onClick={() => void handleDelete(fileName)}
                    disabled={deletingName === fileName}
                    className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-500 disabled:cursor-not-allowed disabled:bg-rose-300"
                  >
                    {deletingName === fileName ? "Deleting..." : "Delete"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
    </>
  );
}
