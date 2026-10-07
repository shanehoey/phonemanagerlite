import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

const ippDir = path.join(process.cwd(), "public", "ipp");

function resolveFilePath(filename: string) {
  const safeName = (filename || "dhcpoption160.cfg").trim();

  if (!safeName) {
    throw new Error("A filename is required.");
  }

  const candidate = path.join(ippDir, path.basename(safeName));

  if (!candidate.startsWith(ippDir + path.sep) && candidate !== ippDir) {
    throw new Error("Invalid file path.");
  }

  return candidate;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    if (searchParams.get("list") === "1") {
      const entries = await fs.readdir(ippDir);
      const files = entries
        .filter((entry) => entry.toLowerCase().endsWith(".cfg"))
        .sort((a, b) => a.localeCompare(b));

      return NextResponse.json({ files });
    }

    const requestedFile = searchParams.get("file") || "dhcpoption160.cfg";
    const filePath = resolveFilePath(requestedFile);
    const content = await fs.readFile(filePath, "utf8");

    return NextResponse.json({ file: path.basename(filePath), content });
  } catch (error) {
    console.error("Failed to read IPP config file", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to read IPP config file" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { action, content, file } = await request.json();

    if (action === "create") {
      const targetName = typeof file === "string" && file.trim() ? file.trim() : "new.cfg";
      const targetPath = resolveFilePath(targetName);
      const templatePath = resolveFilePath("dhcpoption160.cfg");
      const templateContent = await fs.readFile(templatePath, "utf8");
      await fs.writeFile(targetPath, content || templateContent, "utf8");
      return NextResponse.json({ ok: true, file: path.basename(targetPath) });
    }

    if (typeof content !== "string") {
      return NextResponse.json(
        { error: "Content must be a string." },
        { status: 400 }
      );
    }

    const targetPath = resolveFilePath(typeof file === "string" && file.trim() ? file : "dhcpoption160.cfg");
    await fs.writeFile(targetPath, content, "utf8");

    return NextResponse.json({ ok: true, file: path.basename(targetPath) });
  } catch (error) {
    console.error("Failed to save IPP config file", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save IPP config file" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const file = searchParams.get("file") || "dhcpoption160.cfg";
    const targetPath = resolveFilePath(file);

    if (path.basename(targetPath) === "dhcpoption160.cfg") {
      return NextResponse.json(
        { error: "dhcpoption160.cfg cannot be deleted." },
        { status: 400 }
      );
    }

    await fs.unlink(targetPath);
    return NextResponse.json({ ok: true, file: path.basename(targetPath) });
  } catch (error) {
    console.error("Failed to delete IPP config file", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete IPP config file" },
      { status: 500 }
    );
  }
}
