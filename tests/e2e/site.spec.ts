import { test, expect } from "@playwright/test";
test.beforeEach(async ({ context }) => {
  await context.addCookies([
    { name: "odd-lab-lang", value: "zh", url: "http://127.0.0.1:3101" },
  ]);
});
test("original story renders, stays within viewport and offers direct Arena access", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /让想象力，\s*出个小差。/ }),
  ).toBeVisible();
  await expect(page.locator(".flying-photo img").first()).toBeVisible();
  await page.waitForTimeout(2300);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `test-results/hero-${testInfo.project.name}.png`,
  });
  await page.locator("#journey").scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  const wheelsInside = await page
    .locator(".traveler-pelican .bike-wheel")
    .evaluateAll((wheels) =>
      wheels.every((wheel) => {
        const box = wheel.getBoundingClientRect();
        const svg = wheel.closest("svg")!.getBoundingClientRect();
        return (
          box.width > 0 &&
          box.left >= svg.left - 2 &&
          box.right <= svg.right + 2 &&
          box.top >= svg.top - 2 &&
          box.bottom <= svg.bottom + 2
        );
      }),
    );
  expect(wheelsInside).toBe(true);
  await page.screenshot({
    path: `test-results/journey-${testInfo.project.name}.png`,
  });
  await page.locator(".mars-finale").scrollIntoViewIfNeeded();
  await page.screenshot({
    path: `test-results/mars-${testInfo.project.name}.png`,
  });
  await page.locator("#experiments").scrollIntoViewIfNeeded();
  await expect(
    page.getByRole("heading", { name: "下一站，哪个实验？" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("anyone can load, enlarge, vote and see revealed models and a ranking", async ({
  page,
}, testInfo) => {
  await page.goto("/arena/pelican");
  await expect(page.getByRole("button", { name: "左边更好" })).toBeEnabled({
    timeout: 45000,
  });
  await expect(page.getByText("神秘模型")).toHaveCount(2);
  await page
    .getByRole("button", { name: "放大作品 A", exact: true })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.screenshot({
    path: `test-results/arena-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "左边更好" }).click();
  await expect(page.getByText("模型已揭晓")).toBeVisible();
  await expect(page.getByText("本次已投 1 票")).toBeVisible();
  await expect(page.getByText("神秘模型")).toHaveCount(0);
  await page.getByRole("link", { name: "看看排行榜" }).click();
  await expect(page.locator("tbody tr")).toHaveCount(29);
  await expect(page.getByRole("columnheader", { name: "Elo" })).toBeVisible();
});
test("reduced motion and unavailable experiments remain usable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".story")).toHaveClass(/reduced/);
  await page.goto("/experiments/crocodile");
  await expect(page.getByText("模型作品准备中", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "去鹈鹕盲测" }).click();
  await expect(page).toHaveURL(/arena\/pelican/);
});
