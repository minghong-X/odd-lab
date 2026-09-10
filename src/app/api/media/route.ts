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
    const file = await readFile(
      path.join(process.cwd(), "data/media", path.basename(item.file)),
    );
    return new Response(file, {
      headers: {
        "Content-Type": "image/webp",
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
