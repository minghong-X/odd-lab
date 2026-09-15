import { describe, expect, it } from "vitest";
import { getPhotoWall, type Artifact } from "../src/lib/catalog";

const artworks = ["pelican", "crocodile", "taobao"].flatMap((experiment) =>
  Array.from(
    { length: 20 },
    (_, i) => ({ id: `${experiment}-${i}`, experiment }) as Artifact,
  ),
);
function seeded(seed: number) {
  return () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
}
describe("photo wall", () => {
  it("samples each experiment and mixes desktop and mobile columns", () => {
    const wall = getPhotoWall(30, artworks, seeded(42));
    expect(wall).toHaveLength(30);
    expect(new Set(wall.map((a) => a.id)).size).toBe(30);
    for (const experiment of ["pelican", "crocodile", "taobao"]) {
      expect(wall.filter((a) => a.experiment === experiment)).toHaveLength(10);
    }
    for (const width of [5, 6])
      for (let column = 0; column < width; column++) {
        expect(
          new Set(
            wall
              .filter((_, i) => i % width === column)
              .map((a) => a.experiment),
          ).size,
        ).toBeGreaterThan(1);
      }
  });
  it("changes both selected models and layout across visits without mutating inputs", () => {
    const before = artworks.map((a) => a.id);
    const first = getPhotoWall(30, artworks, seeded(42)).map((a) => a.id);
    const second = getPhotoWall(30, artworks, seeded(24)).map((a) => a.id);
    expect(first).not.toEqual(second);
    expect([...first].sort()).not.toEqual([...second].sort());
    expect(artworks.map((a) => a.id)).toEqual(before);
  });
  it("handles empty, short, and single-experiment collections", () => {
    expect(getPhotoWall(30, [])).toEqual([]);
    expect(getPhotoWall(0, artworks)).toEqual([]);
    expect(getPhotoWall(30, artworks.slice(0, 4), seeded(42))).toHaveLength(4);
  });
});
