import { test, expect } from "@playwright/test";
test.beforeEach(async ({ context }) => {
  await context.addCookies([
    { name: "odd-lab-lang", value: "zh", url: "http://127.0.0.1:3101" },
  ]);
});
test("home stays on the first screen and offers Arena access", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /一句话试遍所有模型/ }),
  ).toBeVisible();
  await expect(page.locator(".photo-cloud")).toHaveAttribute(
    "data-intro-state",
    "settled",
    { timeout: 12000 },
  );
  await expect(
    page.locator("#journey, .mars-finale, #experiments, .scroll-invite"),
  ).toHaveCount(0);
  await expect(page.locator(".site-footer")).not.toBeVisible();
  expect(
    await page.evaluate(() => ({
      horizontal: document.documentElement.scrollWidth <= innerWidth,
      vertical: document.documentElement.scrollHeight <= innerHeight + 1,
    })),
  ).toEqual({ horizontal: true, vertical: true });
  await expect(
    page.getByRole("button", { name: "选择盲测实验" }),
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
  await expect(page.locator("tbody tr")).toHaveCount(33);
  await expect(page.getByRole("columnheader", { name: "Elo" })).toHaveCount(0);
});
test("reduced motion and the Taobao experiment remain usable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".photo-cloud")).toHaveAttribute(
    "data-intro-state",
    "settled",
  );
  await page.goto("/experiments/taobao");
  await expect(page.locator(".art-gallery article")).toHaveCount(24);
  await expect(page.getByText("模型作品准备中", { exact: true })).toHaveCount(
    0,
  );
});
