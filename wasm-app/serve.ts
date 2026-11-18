// Static host for the WebAssembly build of Mirage describe.
// Deliberately separate from ../index.ts (the native `cactus mirage describe`
// version) so both can be demoed side by side: this one on :3001, that one on
// :3000. Run with:  bun run wasm-app/serve.ts
//
// Beyond serving files it hands the browser mirage.cact. The weights are cached
// under ./models and downloaded from Hugging Face on the first request, so the
// app itself never needs a build step. The /exemples/ folder of the repository
// is served read-only so the editorial previews work locally, exactly like on
// GitHub Pages.

const PORT = Number(process.env.WASM_PORT || 3001);
const ROOT = new URL("./", import.meta.url);
const REPO = new URL("../", import.meta.url);
const MODEL_PATH = new URL("./models/mirage.cact", import.meta.url);
const MODEL_URL =
  "https://huggingface.co/Cactus-Compute/mirage/resolve/main/mirage.cact";

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".wasm": "application/wasm",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".webmanifest": "application/manifest+json",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".ico": "image/x-icon",
};

let modelDownload: Promise<void> | null = null;

async function ensureModel(): Promise<void> {
  if (await Bun.file(MODEL_PATH).exists()) return;
  if (!modelDownload) {
    modelDownload = (async () => {
      console.log(
        "mirage.cact not cached - downloading ~22 MB from Hugging Face.",
      );
      const res = await fetch(MODEL_URL);
      if (!res.ok || !res.body)
        throw new Error(`model download failed: HTTP ${res.status}`);
      await Bun.write(MODEL_PATH, res);
      console.log("mirage.cact cached in wasm-app/models/.");
    })().finally(() => {
      modelDownload = null;
    });
  }
  return modelDownload;
}

function notFound(msg = "Not found"): Response {
  return new Response(msg, { status: 404 });
}

// Only files inside the given base are ever resolved.
function resolveInside(base: URL, rel: string): URL | null {
  const url = new URL(rel, base);
  if (!url.href.startsWith(base.href)) return null;
  return url;
}

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    if (req.method !== "GET" && req.method !== "HEAD") {
      return new Response("Method not allowed", { status: 405 });
    }

    if (url.pathname === "/models/mirage.cact") {
      try {
        await ensureModel();
        return new Response(Bun.file(MODEL_PATH), {
          headers: {
            "content-type": "application/octet-stream",
            // Weights are fixed per release; let the browser keep them.
            "cache-control": "public, max-age=31536000, immutable",
          },
        });
      } catch (err) {
        return Response.json(
          { error: err instanceof Error ? err.message : String(err) },
          { status: 502 },
        );
      }
    }

    const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
    const isExemple = pathname.startsWith("/exemples/");
    const base = isExemple ? REPO : ROOT;
    const rel = isExemple
      ? pathname.slice(1)
      : pathname.replace(/^\//, "");
    const fileUrl = resolveInside(base, rel);
    if (!fileUrl) return notFound();

    const file = Bun.file(fileUrl);
    if (!(await file.exists())) return notFound(`Missing ${pathname}`);
    const ext = pathname.slice(pathname.lastIndexOf("."));
    return new Response(file, {
      headers: {
        "content-type": CONTENT_TYPES[ext] ?? "application/octet-stream",
      },
    });
  },
});

console.log(`Mirage wasm UI -> http://localhost:${PORT}`);
