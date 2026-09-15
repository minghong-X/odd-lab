import { test, expect } from "@playwright/test";
import sharp from "sharp";
import catalog from "../../data/catalog.json" with { type: "json" };

// Pin one SMIL and one CSS submission while exercising the real media route
// and Arena's fetch -> Blob -> img rendering, including the zoom dialog.
async function fixedSubmissions(page: import("@playwright/test").Page) {
  const ids = ["qwen3.8-max", "gpt-5.6-sol"].map(
    (model) => catalog.find((item) => item.model === model)!.id,
  );
  await page.route("**/api/media?battle=**", async (route) => {
    const url = new URL(route.request().url());
    const side = url.searchParams.get("side") === "A" ? 0 : 1;
    const response = await route.fetch({
      url: `${url.origin}/api/media?id=${ids[side]}&motion=${url.searchParams.get("motion") ?? "1"}`,
    });
    await route.fulfill({ response });
  });
}

async function changedPixels(first: Buffer, second: Buffer) {
  const a = await sharp(first).removeAlpha().raw().toBuffer();
  const b = await sharp(second).removeAlpha().raw().toBuffer();
  expect(a.length).toBe(b.length);
  let changed = 0;
  for (let i = 0; i < a.length; i += 3)
    if (
      Math.abs(a[i] - b[i]) +
        Math.abs(a[i + 1] - b[i + 1]) +
        Math.abs(a[i + 2] - b[i + 2]) >
      30
    )
      changed++;
  return changed;
}

test("leaderboard thumbnails and enlarged artwork preserve SVG animation", async ({
  page,
  request,
}) => {
  await page.goto("/leaderboard/pelican");
  // Exercise both SVG animation mechanisms through the real public catalog.
  for (const model of ["qwen3.8-max", "gpt-5.6-sol"]) {
    const preview = page.locator(".rank-preview").filter({
      has: page.getByRole("img", { name: model, exact: true }),
    });
    const thumbnail = preview.locator("img");
    await expect(thumbnail).toBeVisible();
    const src = await thumbnail.getAttribute("src");
    const response = await request.get(src!);
    expect(response.headers()["content-type"]).toContain("image/svg+xml");
    await expect
      .poll(() =>
        thumbnail.evaluate(
          (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
        ),
      )
      .toBe(true);
    const before = await thumbnail.screenshot();
    await page.waitForTimeout(370);
    expect(
      await changedPixels(before, await thumbnail.screenshot()),
    ).toBeGreaterThan(100);

    await preview.click();
    const enlarged = page.locator("dialog img");
    await expect(enlarged).toBeVisible();
    const zoomBefore = await enlarged.screenshot();
    await page.waitForTimeout(370);
    expect(
      await changedPixels(zoomBefore, await enlarged.screenshot()),
    ).toBeGreaterThan(100);
    await page.locator("dialog .dialog-close").click();
  }
});

test("Arena preserves original SMIL and CSS animation, also when enlarged", async ({
  page,
}) => {
  await fixedSubmissions(page);
  await page.goto("/arena/pelican");
  const pictures = page.locator(".comparison-image img");
  await expect(pictures).toHaveCount(2);
  await expect
    .poll(() =>
      pictures.evaluateAll((imgs) =>
        imgs.every(
          (img) =>
            (img as HTMLImageElement).complete &&
            (img as HTMLImageElement).naturalWidth > 0,
        ),
      ),
    )
    .toBe(true);
  for (const img of await pictures.all()) {
    expect(await img.getAttribute("src")).toMatch(/^blob:/);
    const before = await img.screenshot();
    await page.waitForTimeout(370);
    const after = await img.screenshot();
    expect(
      await changedPixels(before, after),
      "original submission must move, not just its card",
    ).toBeGreaterThan(100);
  }
  await page.locator(".zoom-button").last().click();
  const zoom = page.locator("dialog img");
  await expect(zoom).toBeVisible();
  const before = await zoom.screenshot();
  await page.waitForTimeout(370);
  expect(await changedPixels(before, await zoom.screenshot())).toBeGreaterThan(
    100,
  );
});

test("real blind media uses SVG while reduced motion keeps static previews", async ({
  page,
  request,
}) => {
  const pair = await (
    await request.post("/api/arena", {
      data: { action: "pair", experiment: "pelican" },
    })
  ).json();
  const media = await request.get(`/api/media?battle=${pair.id}&side=A`, {
    headers: { Authorization: `Bearer ${pair.token}` },
  });
  expect(media.status()).toBe(200);
  expect(media.headers()["content-type"]).toContain("image/svg+xml");
  expect(media.headers()["cache-control"]).toContain("no-store");
  expect(await media.text()).toMatch(/<animate|@keyframes/);
  const denied = await request.get(`/api/media?battle=${pair.id}&side=A`);
  expect(denied.status()).not.toBe(200);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const mediaTypes: string[] = [];
  page.on("response", (res) => {
    if (res.url().includes("/api/media?battle="))
      mediaTypes.push(res.headers()["content-type"]);
  });
  await page.goto("/arena/pelican");
  await expect(page.locator(".comparison-image img")).toHaveCount(2);
  expect(mediaTypes).toEqual(["image/webp", "image/webp"]);
});

test("photo wall keeps the original artwork moving after arrival settles", async ({
  page,
}) => {
  await page.goto("/");
  const wall = page.locator(".photo-cloud");
  await expect(wall).toHaveAttribute("data-intro-state", "settled", {
    timeout: 12000,
  });
  const pictures = page.locator(".flying-photo img");
  await expect(pictures).toHaveCount(20);
  await expect
    .poll(() =>
      pictures.evaluateAll((imgs) =>
        imgs.every((img) => {
          const image = img as HTMLImageElement;
          return (
            image.complete &&
            image.naturalWidth > 0 &&
            image.currentSrc.includes("motion=1")
          );
        }),
      ),
    )
    .toBe(true);
  const transforms = () =>
    page
      .locator(".flying-photo")
      .evaluateAll((photos) =>
        photos.map((p) => getComputedStyle(p).transform),
      );
  const settled = await transforms();
  const before = await page.screenshot();
  await page.waitForTimeout(370);
  expect(await transforms()).toEqual(settled);
  expect(
    await changedPixels(before, await page.screenshot()),
    "the artwork continues moving inside settled photo cards",
  ).toBeGreaterThan(100);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect
    .poll(() =>
      pictures.evaluateAll((imgs) =>
        imgs.every((img) => {
          const image = img as HTMLImageElement;
          return (
            image.complete &&
            image.naturalWidth > 0 &&
            !image.currentSrc.includes("motion=1")
          );
        }),
      ),
    )
    .toBe(true);
});
