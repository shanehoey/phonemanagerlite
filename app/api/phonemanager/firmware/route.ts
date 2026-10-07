import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

const firmwareDir = path.join(process.cwd(), "public", "firmwarefiles");

function normalizeFolder(folder: string) {
  return (folder || ".").replace(/\\/g, "/").replace(/^\.\//, "").replace(/^\//, "");
}

function resolveFolderPath(folder: string) {
  const normalized = normalizeFolder(folder);
  const candidate = normalized === "." || normalized === "" ? firmwareDir : path.join(firmwareDir, normalized);

  if (!candidate.startsWith(firmwareDir + path.sep) && candidate !== firmwareDir) {
    throw new Error("Invalid folder path.");
  }

  return candidate;
}

function resolveFilePath(filename: string, folder = ".") {
  const safeName = (filename || "").trim();

  if (!safeName) {
    throw new Error("A filename is required.");
  }

  const targetDir = resolveFolderPath(folder);
  const candidate = path.join(targetDir, path.basename(safeName));

  if (!candidate.startsWith(firmwareDir + path.sep) && candidate !== firmwareDir) {
    throw new Error("Invalid file path.");
  }

  return candidate;
}

async function collectFolders(dir: string, prefix = ""): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const folders = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.posix.join(prefix, entry.name))
    .sort((a, b) => a.localeCompare(b));

  const nested = await Promise.all(
    folders.map(async (folder) => collectFolders(path.join(dir, folder), folder))
  );

  return [...folders, ...nested.flat()];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    if (searchParams.get("folders") === "1") {
      const folders = [".", ...(await collectFolders(firmwareDir))];
      return NextResponse.json({ folders: [...new Set(folders)] });
    }

    const folder = searchParams.get("folder") || ".";
    const targetDir = resolveFolderPath(folder);
    const entries = await fs.readdir(targetDir, { withFileTypes: true });
    const files = entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));

    return NextResponse.json({ folder, files });
  } catch (error) {
    console.error("Failed to list firmware files", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to list firmware files" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const folder = String(formData.get("folder") || ".");

    if (!(file instanceof File) || file.name.length === 0) {
      return NextResponse.json({ error: "Please choose a firmware file to upload." }, { status: 400 });
    }

    const targetDir = resolveFolderPath(folder);
    await fs.mkdir(targetDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    const targetPath = resolveFilePath(file.name, folder);
    await fs.writeFile(targetPath, buffer);

    return NextResponse.json({ ok: true, file: path.basename(targetPath) });
  } catch (error) {
    console.error("Failed to upload firmware file", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to upload firmware file" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const file = searchParams.get("file");
    const folder = searchParams.get("folder") || ".";

    if (!file) {
      return NextResponse.json({ error: "A filename is required." }, { status: 400 });
    }

    const targetPath = resolveFilePath(file, folder);
    await fs.unlink(targetPath);

    return NextResponse.json({ ok: true, file: path.basename(targetPath) });
  } catch (error) {
    console.error("Failed to delete firmware file", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete firmware file" },
      { status: 500 }
    );
  }
}
