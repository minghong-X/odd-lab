import { test, expect } from "@playwright/test";
for (const viewport of [
  { width: 2442, height: 1206 },
  { width: 1440, height: 1000 },
  { width: 390, height: 844 },
]) {
  test(`complete photo frames fit without overlap at ${viewport.width}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(page.locator(".photo-cloud")).toHaveAttribute(
      "data-intro-state",
      "settled",
      { timeout: 12000 },
    );
    const issues = await page.locator(".flying-photo").evaluateAll((photos) => {
      const boxes = photos.map((p) => p.getBoundingClientRect());
      const problems: string[] = [];
      photos.forEach((p, i) => {
        const box = boxes[i];
        const img = p
          .querySelector("img, .artwork-html")!
          .getBoundingClientRect();
        if (
          box.top < 0 ||
          box.bottom > innerHeight ||
          box.left < 0 ||
          box.right > innerWidth
        )
          problems.push(`frame ${i} outside viewport`);
        if (img.bottom > box.bottom + 1 || img.top < box.top - 1)
          problems.push(`image ${i} overflows card`);
        boxes.slice(i + 1).forEach((other, j) => {
          if (
            Math.min(box.right, other.right) - Math.max(box.left, other.left) >
              2 &&
            Math.min(box.bottom, other.bottom) - Math.max(box.top, other.top) >
              2
          )
            problems.push(`frame ${i} overlaps ${i + j + 1}`);
        });
      });
      return problems;
    });
    expect(issues).toEqual([]);
    await page.screenshot({
      path: `test-results/wall-complete-${viewport.width}.png`,
    });
  });
}
