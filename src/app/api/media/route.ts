import { readFile } from "node:fs/promises";
import path from "node:path";
import { artifacts } from "@/lib/catalog";
import { service, failure, privateHeaders } from "@/lib/server";
import { ArenaError } from "@/lib/arena";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const id = params.get("id");
    const item = id
      ? artifacts.find((a) => a.id === id)
      : await (
          await service()
        ).media(
          params.get("battle") || "",
          request.headers.get("authorization")?.replace(/^Bearer /, "") || "",
          params.get("side") || "",
        );
    if (!item) throw new ArenaError(404, "notFound");
    // Public preview URLs stay static for existing caches; motion opts into the original.
    const animated =
      Boolean(item.animatedFile) &&
      (id ? params.get("motion") === "1" : params.get("motion") !== "0");
    let file = await readFile(
      path.join(
        process.cwd(),
        "data/media",
        path.basename(animated ? item.animatedFile! : item.file),
      ),
    );
    const html = item.mediaType === "html";
    if (html && item.mediaUrl) {
      // A blind preview is loaded as a blob; retain the original document's base
      // so relative styles/images resolve just as they do in the shared viewer.
      const source = file.toString("utf8");
      if (!/<base\s[^>]*href\s*=/i.test(source)) {
        const base = item.mediaUrl
          .replace(/&/g, "&amp;")
          .replace(/"/g, "&quot;")
          .replace(/</g, "&lt;");
        const tag = `<base href="${base}">`;
        file = Buffer.from(
          /<head(?:\s[^>]*)?>/i.test(source)
            ? source.replace(/<head(?:\s[^>]*)?>/i, `$&${tag}`)
            : tag + source,
        );
      }
    }
    return new Response(file, {
      headers: {
        "Content-Type": html
          ? "text/html; charset=utf-8"
          : animated
            ? "image/svg+xml"
            : "image/webp",
        // SVGs are rendered only as images, never inserted into the page DOM.
        "Content-Security-Policy":
          "sandbox; default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'",
        "X-Content-Type-Options": "nosniff",
        ...(id
          ? { "Cache-Control": "public, max-age=86400, immutable" }
          : privateHeaders),
      },
    });
  } catch (e) {
    return failure(e, request);
  }
}
