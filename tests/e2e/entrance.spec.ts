import { test, expect } from "@playwright/test";
test("crocodile face remains visible while entering the road scene", async ({
  page,
}, info) => {
  await page.goto("/");
  await page.addStyleTag({ content: ".boarding-scene {pointer-events:auto;}" });
  await page.waitForTimeout(600);
  let visibleSamples = 0;
  for (const progress of [0.06, 0.09, 0.12, 0.2]) {
    await page.evaluate((progress) => {
      document.documentElement.style.scrollBehavior = "auto";
      const story = document.querySelector(".journey") as HTMLElement;
      window.scrollTo(
        0,
        story.offsetTop + (story.offsetHeight - innerHeight) * progress,
      );
    }, progress);
    await page.waitForTimeout(1000);
    const face = await page
      .locator(".crocodile-seat .rider")
      .evaluate((rider) => {
        const matrix = (rider as SVGGraphicsElement).getScreenCTM()!;
        const point = new DOMPoint(450, 90).matrixTransform(matrix);
        return {
          inViewport:
            point.x > 0 &&
            point.x < innerWidth &&
            point.y > 0 &&
            point.y < innerHeight,
          visible: rider.contains(document.elementFromPoint(point.x, point.y)),
        };
      });
    await page.screenshot({
      path: `test-results/entrance-${info.project.name}-${progress}.png`,
    });
    if (face.inViewport) {
      visibleSamples++;
      expect(
        face.visible,
        `The snout is inside the screen but masked out at ${progress}`,
      ).toBe(true);
    }
  }
  expect(visibleSamples).toBeGreaterThan(0);
});
test("both travelers arrive from the left and move right", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(600);
  const positions: number[][] = [];
  for (const progress of [0, 0.04, 0.08, 0.18]) {
    await page.evaluate((p) => {
      document.documentElement.style.scrollBehavior = "auto";
      const s = document.querySelector(".journey") as HTMLElement;
      scrollTo(0, s.offsetTop + (s.offsetHeight - innerHeight) * p);
    }, progress);
    await page.waitForTimeout(950);
    positions.push(
      await page
        .locator(".boarding-passenger")
        .evaluateAll((es) => es.map((e) => e.getBoundingClientRect().left)),
    );
  }
  expect(positions[0].every((left) => left < 0)).toBe(true);
  for (let i = 1; i < positions.length; i++)
    for (let actor = 0; actor < 2; actor++)
      expect(positions[i][actor]).toBeGreaterThan(positions[i - 1][actor]);
});
