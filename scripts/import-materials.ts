import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { z } from "zod";
const sourceSchema = z.object({
  data: z.array(
    z.object({
      id: z.number(),
      svgKey: z.string(),
      category: z.string(),
      modelName: z.string(),
      title: z.string(),
      svgUrl: z.string().url(),
      generationTimeMs: z.number().nullable(),
      tokenUsage: z.number().nullable(),
    }),
  ),
});
const source = sourceSchema.parse(
  JSON.parse(
    await readFile(process.argv[2] || "data/source-results.json", "utf8"),
  ),
);
await mkdir("data/media", { recursive: true });
const catalog = [],
  failed = [];
for (const entry of source.data) {
  try {
    const url = new URL(entry.svgUrl);
    if (url.hostname !== "xrayandroid.oss-cn-beijing.aliyuncs.com")
      throw new Error("Source host is not on the explicit allowlist");
    url.protocol = "https:";
    const response = await fetch(url, {
      redirect: "error",
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const reader = response.body!.getReader();
    const chunks: Uint8Array[] = [];
    let length = 0;
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > 5_000_000) {
        await reader.cancel();
        throw new Error("Source exceeds 5 MB");
      }
      chunks.push(value);
    }
    const raw = Buffer.concat(chunks),
      text = raw.toString("utf8");
    if (!/<svg[\s>]/i.test(text)) throw new Error("Expected SVG content");
    if (
      /<!DOCTYPE|<!ENTITY|<script|<foreignObject|\son\w+\s*=|@import|(?:href|src)\s*=\s*["']\s*(?:https?:|\/\/|file:|javascript:)|url\(\s*["']?(?:https?:|\/\/|file:|javascript:)/i.test(
        text,
      )
    )
      throw new Error(
        "SVG contains active or external content; manual review required",
      );
    const contentHash = createHash("sha256")
      .update(raw)
      .digest("hex")
      .slice(0, 24);
    // Distinct model runs can emit byte-identical images. Share bytes, never ratings.
    const id = createHash("sha256")
      .update(
        JSON.stringify([
          entry.category,
          entry.modelName,
          entry.svgKey,
          contentHash,
        ]),
      )
      .digest("hex")
      .slice(0, 24);
    const image = await sharp(raw, {
      density: 120,
      limitInputPixels: 40_000_000,
    })
      .resize({
        width: 1400,
        height: 1100,
        fit: "inside",
        withoutEnlargement: true,
      })
      .flatten({ background: "#ffffff" })
      .webp({ quality: 88 })
      .toBuffer({ resolveWithObject: true });
    await writeFile(`data/media/${contentHash}.webp`, image.data);
    // Keep the original SMIL/CSS animation alongside the reduced-motion preview.
    await writeFile(`data/media/${contentHash}.svg`, raw);
    catalog.push({
      id,
      model: entry.modelName,
      title: entry.title,
      experiment: entry.category,
      file: `${contentHash}.webp`,
      animatedFile: `${contentHash}.svg`,
      width: image.info.width,
      height: image.info.height,
      generationTimeMs: entry.generationTimeMs,
      tokenUsage: entry.tokenUsage,
    });
    console.log(
      `Imported ${catalog.length}/${source.data.length}: ${entry.modelName}`,
    );
  } catch (e) {
    failed.push({
      model: entry.modelName,
      reason: e instanceof Error ? e.message : String(e),
    });
    console.error(`Failed ${entry.modelName}: ${failed.at(-1)?.reason}`);
  }
}
await writeFile(
  "data/import-report.json",
  JSON.stringify({ imported: catalog.length, failed }, null, 2),
);
if (catalog.length && !failed.length) {
  await writeFile("data/catalog.next.json", JSON.stringify(catalog, null, 2));
  await rename("data/catalog.next.json", "data/catalog.json");
}
console.log(
  `Imported ${catalog.length}; failed ${failed.length}. No historical scores imported.`,
);
if (failed.length) process.exitCode = 1;
