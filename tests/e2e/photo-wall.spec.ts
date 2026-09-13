import { test, expect } from "@playwright/test";
test("photo arrival plays again after a previous visit", async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem("odd-intro-seen", "1");
    // Observe from page startup, even if loading 30 SVGs delays the test driver.
    let before: string[] = [];
    const state = window as typeof window & { photoArrivalMoved?: boolean };
    const observe = () => {
      const photos = [...document.querySelectorAll(".flying-photo")];
      const transforms = photos.map((p) => getComputedStyle(p).transform);
      if (
        document
          .querySelector(".photo-cloud")
          ?.getAttribute("data-intro-state") === "flying" &&
        before.length === transforms.length &&
        transforms.some((t, i) => t !== before[i])
      ) {
        state.photoArrivalMoved = true;
      }
      before = transforms;
      if (!state.photoArrivalMoved) requestAnimationFrame(observe);
    };
    requestAnimationFrame(observe);
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as typeof window & { photoArrivalMoved?: boolean })
            .photoArrivalMoved,
      ),
    )
    .toBe(true);
});
test("many photos settle into a wall and replay on demand", async ({
  page,
}, info) => {
  await page.goto("/");
  await expect(page.locator(".photo-cloud")).toHaveAttribute(
    "data-intro-state",
    "settled",
    { timeout: 12000 },
  );
  expect(await page.locator(".flying-photo:visible").count()).toBe(30);
  const grid = await page.locator(".flying-photo").evaluateAll((es) => ({
    columns: new Set(es.map((e) => Math.round((e as HTMLElement).offsetLeft)))
      .size,
    rows: new Set(es.map((e) => Math.round((e as HTMLElement).offsetTop))).size,
  }));
  expect(grid.columns).toBeGreaterThanOrEqual(5);
  expect(grid.rows).toBeGreaterThanOrEqual(5);
  const before = await page
    .locator(".flying-photo")
    .evaluateAll((es) => es.map((e) => getComputedStyle(e).transform));
  await page.waitForTimeout(250);
  expect(
    await page
      .locator(".flying-photo")
      .evaluateAll((es) => es.map((e) => getComputedStyle(e).transform)),
  ).toEqual(before);
  await page.screenshot({
    path: `test-results/photo-wall-${info.project.name}.png`,
  });
  await page.getByRole("button", { name: "Replay intro" }).click();
  await expect(page.locator(".photo-cloud")).toHaveAttribute(
    "data-intro-state",
    "flying",
  );
  await page.waitForTimeout(800);
  await page.screenshot({
    path: `test-results/photo-arrival-${info.project.name}.png`,
  });
  await expect(page.locator(".photo-cloud")).toHaveAttribute(
    "data-intro-state",
    "settled",
    { timeout: 8000 },
  );
  await page.reload();
  await expect(page.locator(".photo-cloud")).toHaveAttribute(
    "data-intro-state",
    "flying",
  );
});
test("reduced motion displays a complete static photo wall", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".photo-cloud")).toHaveAttribute(
    "data-intro-state",
    "settled",
  );
  expect(await page.locator(".flying-photo:visible").count()).toBe(30);
  await expect(page.getByRole("button", { name: "Replay intro" })).toHaveCount(
    0,
  );
});
