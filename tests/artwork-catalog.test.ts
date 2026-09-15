import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { expect, it } from "vitest";
import catalog from "../data/catalog.json";
import manifest from "../data/artwork-manifest.json";

it("ships exactly the exported artworks with unchanged SVG and HTML bytes", async () => {
  expect(new Set(catalog.map((a) => a.id)).size).toBe(catalog.length);
  expect(catalog.length).toBe(manifest.length);
  for (const row of manifest) {
    const matches = catalog.filter(
      (a) => a.experiment === row.experimentKey && a.model === row.modelName,
    );
    expect(matches).toHaveLength(1);
    const item = matches[0];
    expect(item.mediaType).toBe(row.mediaType);
    const bytes = await readFile(
      `data/media/${"animatedFile" in item ? item.animatedFile : item.file}`,
    );
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(row.sha256);
  }
});
