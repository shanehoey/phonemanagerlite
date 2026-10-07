import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

const dataDir = path.join(process.cwd(), "lib", "data");
const redirectsFile = path.join(dataDir, "redirects.json");

function normalizePath(value: string) {
  return value.replace(/\\/g, "/").replace(/^\.\//, "").replace(/^\//, "");
}

async function collectFirmwareFiles(dir: string, prefix = ""): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile())
    .map((entry) => normalizePath(path.posix.join(prefix, entry.name)))
    .sort((a, b) => a.localeCompare(b));

  const directories = entries.filter((entry) => entry.isDirectory());
  const nested = await Promise.all(
    directories.map(async (entry) => collectFirmwareFiles(path.join(dir, entry.name), path.posix.join(prefix, entry.name)))
  );

  return [...files, ...nested.flat()];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const redirects = await fs.readFile(redirectsFile, "utf8").catch(() => "{}\n");
    const parsed = JSON.parse(redirects) as Record<string, string>;

    if (searchParams.get("list") === "1") {
      const files = (await collectFirmwareFiles(path.join(process.cwd(), "public", "firmwarefiles"))).filter((file) => file !== "redirects.json");
      return NextResponse.json({ redirects: parsed, files });
    }

    return NextResponse.json({ redirects: parsed });
  } catch (error) {
    console.error("Failed to load redirect mappings", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load redirect mappings" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const alias = typeof body?.alias === "string" ? body.alias.trim() : "";
    const target = typeof body?.target === "string" ? body.target.trim() : "";

    if (!alias) {
      return NextResponse.json({ error: "A model alias is required." }, { status: 400 });
    }

    if (!target) {
      return NextResponse.json({ error: "A firmware target is required." }, { status: 400 });
    }

    const existing = await fs.readFile(redirectsFile, "utf8").catch(() => "{}\n");
    const parsed = JSON.parse(existing) as Record<string, string>;

    parsed[alias] = target.startsWith("/") ? target.slice(1) : target;

    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(redirectsFile, `${JSON.stringify(parsed, null, 2)}\n`, "utf8");

    return NextResponse.json({ ok: true, aliases: Object.keys(parsed).sort((a, b) => a.localeCompare(b)) });
  } catch (error) {
    console.error("Failed to save redirect mappings", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save redirect mappings" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const alias = searchParams.get("alias") || "";

    if (!alias) {
      return NextResponse.json({ error: "A model alias is required." }, { status: 400 });
    }

    const existing = await fs.readFile(redirectsFile, "utf8").catch(() => "{}\n");
    const parsed = JSON.parse(existing) as Record<string, string>;

    if (!(alias in parsed)) {
      return NextResponse.json({ error: "That redirect does not exist." }, { status: 404 });
    }

    delete parsed[alias];
    await fs.writeFile(redirectsFile, `${JSON.stringify(parsed, null, 2)}\n`, "utf8");

    return NextResponse.json({ ok: true, alias });
  } catch (error) {
    console.error("Failed to delete redirect mapping", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete redirect mapping" },
      { status: 500 }
    );
  }
}
