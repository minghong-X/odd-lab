import { test, expect } from "@playwright/test";
test("ground, cabin and liftoff shots remain clear and reverse correctly", async ({
  page,
}, info) => {
  await page.goto("/");
  await page.waitForTimeout(600);
  let groundedShipTop = 0;
  for (const progress of [0.4, 0.52, 0.6, 0.66, 0.86, 0.4]) {
    await page.evaluate((p) => {
      document.documentElement.style.scrollBehavior = "auto";
      const s = document.querySelector(".journey") as HTMLElement;
      scrollTo(0, s.offsetTop + (s.offsetHeight - innerHeight) * p);
    }, progress);
    await page.waitForTimeout(1000);
    const ground = page.locator(".ground-passengers"),
      cabin = page.locator(".boarding-scene .ship-passengers");
    if (progress === 0.4) {
      await expect(ground).toHaveCSS("opacity", "1");
      await expect(cabin).toHaveCSS("opacity", "0");
      const actors = await page
        .locator(".boarding-passenger")
        .evaluateAll((es) =>
          es.map((e) => {
            const b = e.getBoundingClientRect();
            return {
              left: b.left,
              right: b.right,
              top: b.top,
              bottom: b.bottom,
              inViewport:
                b.left >= 0 &&
                b.right <= innerWidth &&
                b.top >= 0 &&
                b.bottom <= innerHeight,
            };
          }),
        );
      expect(actors.every((a) => a.inViewport)).toBe(true);
      expect(
        actors[0].right <= actors[1].left || actors[1].right <= actors[0].left,
      ).toBe(true);
      groundedShipTop = (await page.locator(".launch-rig").boundingBox())!.y;
    }
    if (progress === 0.6 || progress === 0.66) {
      await expect(ground).toHaveCSS("opacity", "0");
      await expect(cabin).toHaveCSS("opacity", "1");
    }
    if (progress === 0.66)
      await expect(page.locator(".boarding-scene .hatch-door")).toHaveAttribute(
        "width",
        "90",
      );
    if (progress === 0.86) {
      await expect(page.locator(".boarding-scene .ship-flame")).toHaveCSS(
        "opacity",
        "1",
      );
      expect((await page.locator(".launch-rig").boundingBox())!.y).toBeLessThan(
        groundedShipTop - 50,
      );
    }
    await page.screenshot({
      path: `test-results/story-shots-${info.project.name}-${progress}.png`,
    });
  }
});
