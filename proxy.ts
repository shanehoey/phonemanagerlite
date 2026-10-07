import { promises as fs } from "fs";
import path from "path";
import { NextResponse, type NextRequest } from "next/server";

const dataDir = path.join(process.cwd(), "lib", "data");
const redirectsFile = path.join(dataDir, "redirects.json");

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const alias = pathname.slice("/firmwarefiles/".length);

  console.log(`[proxy] firmware request: ${pathname} -> alias=${alias}`);

  if (!alias || alias.includes("/")) {
    console.log(`[proxy] skipping proxy for non-alias request: ${pathname}`);
    return NextResponse.next();
  }

  try {
    const raw = await fs.readFile(redirectsFile, "utf8").catch(() => "{}\n");
    const redirects = JSON.parse(raw) as Record<string, string>;
    const target = redirects[alias];

    if (!target) {
      console.log(`[proxy] no redirect mapping for alias=${alias}`);
      return NextResponse.next();
    }

    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = `/firmwarefiles/${target}`;

    console.log(`[proxy] rewriting request: ${alias} -> ${target}`);

    return NextResponse.rewrite(rewriteUrl);
  } catch (error) {
    console.error("Failed to resolve firmware alias in proxy", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: "/firmwarefiles/:path*",
};