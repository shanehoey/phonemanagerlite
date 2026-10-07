import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

const dataDir = path.join(process.cwd(), "lib", "data");
const modelsFile = path.join(dataDir, "models.json");

function normalizeModels(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}

export async function GET() {
  try {
    const raw = await fs.readFile(modelsFile, "utf8").catch(() => "[]\n");
    return NextResponse.json({ models: normalizeModels(JSON.parse(raw)) });
  } catch (error) {
    console.error("Failed to load model aliases", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load model aliases" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const models = normalizeModels(body?.models);

    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(modelsFile, `${JSON.stringify(models, null, 2)}\n`, "utf8");

    return NextResponse.json({ ok: true, models });
  } catch (error) {
    console.error("Failed to save hardware models", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save hardware aliases" },
      { status: 500 }
    );
  }
}
