import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { z } from "zod";
import type { Artifact } from "../src/lib/catalog";

// Accept an exported list, never a Java endpoint or database credentials.
const input = process.argv[2];
if (!input) throw new Error("Usage: npm run sync:artworks -- <artworks.json>");
const rows = z
  .array(
    z.object({
      experimentKey: z.enum(["pelican", "crocodile", "taobao"]),
      modelName: z.string().min(1),
      url: z.string().url(),
      mediaType: z.enum(["svg", "html"]),
    }),
  )
  .parse(JSON.parse(await readFile(input, "utf8")));
const keys = rows.map((r) => `${r.experimentKey}/${r.modelName}`);
if (new Set(keys).size !== keys.length || !rows.length)
  throw new Error(
    "Expected a nonempty list with one artwork per experiment/model.",
  );
if (
  ["pelican", "crocodile", "taobao"].some(
    (key) => !rows.some((row) => row.experimentKey === key),
  )
)
  throw new Error(
    "Export all three experiments before replacing the public catalog.",
  );
const old: Artifact[] = JSON.parse(await readFile("data/catalog.json", "utf8"));
const hash = (bytes: string | Buffer) =>
  createHash("sha256").update(bytes).digest("hex");
const normalizeModel = (name: string) => name.replace(/-高$|\.$/g, "");
const result: Artifact[] = [];
const manifest = [];
const changes = [];
for (const row of rows) {
  const url = new URL(row.url);
  if (
    url.hostname !== "xrayandroid.oss-cn-beijing.aliyuncs.com" ||
    url.username ||
    url.password
  )
    throw new Error("Only the artwork OSS host is allowed.");
  url.protocol = "https:";
  const response = await fetch(url, {
    redirect: "error",
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok)
    throw new Error(`${row.modelName}: HTTP ${response.status}`);
  const raw = Buffer.from(await response.arrayBuffer());
  if (raw.length > 5_000_000) throw new Error("Artwork exceeds 5 MB.");
  if (
    !(
      row.mediaType === "svg" ? /<svg[\s>]/i : /<html[\s>]|<!doctype html/i
    ).test(raw.toString())
  )
    throw new Error(`Unexpected ${row.mediaType} content for ${row.modelName}`);
  const sha256 = hash(raw),
    stem = sha256.slice(0, 24);
  const previous = old.find(
    (a) =>
      a.experiment === row.experimentKey &&
      normalizeModel(a.model) === normalizeModel(row.modelName),
  );
  const previousBytes =
    previous &&
    (await readFile(
      `data/media/${previous.animatedFile || previous.file}`,
    ).catch(() => null));
  const same = previousBytes && hash(previousBytes) === sha256;
  const id = same
    ? previous!.id
    : hash(JSON.stringify([row.experimentKey, row.modelName, sha256])).slice(
        0,
        24,
      );
  await writeFile(`data/media/${stem}.${row.mediaType}`, raw);
  let file = `${stem}.html`,
    width = 1600,
    height = 900;
  if (row.mediaType === "svg") {
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
    file = `${stem}.webp`;
    await writeFile(`data/media/${file}`, image.data);
    width = image.info.width;
    height = image.info.height;
  }
  result.push({
    id,
    model: row.modelName,
    title: row.modelName,
    experiment: row.experimentKey,
    file,
    ...(row.mediaType === "html" ? { mediaUrl: url.href } : {}),
    mediaType: row.mediaType,
    ...(row.mediaType === "svg" ? { animatedFile: `${stem}.svg` } : {}),
    width,
    height,
    generationTimeMs: previous?.generationTimeMs ?? null,
    tokenUsage: previous?.tokenUsage ?? null,
  });
  manifest.push({
    experimentKey: row.experimentKey,
    modelName: row.modelName,
    url: url.href,
    mediaType: row.mediaType,
    sha256,
  });
  if (!same || previous?.model !== row.modelName)
    changes.push({
      experiment: row.experimentKey,
      model: row.modelName,
      change: !previous ? "added" : same ? "renamed" : "replaced",
    });
}
// Only publish a new catalog after every download and conversion succeeds.
await writeFile("data/catalog.json", JSON.stringify(result, null, 2) + "\n");
await writeFile(
  "data/artwork-manifest.json",
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log(JSON.stringify({ total: result.length, changes }, null, 2));
