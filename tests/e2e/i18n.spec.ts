import { test, expect } from "@playwright/test";
test("language persists across reloads and translates all page families", async ({
  page,
}, info) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { name: /One prompt/ })).toBeVisible();
  await page.waitForTimeout(2100);
  await page.screenshot({
    path: `test-results/hero-en-${info.project.name}.png`,
  });
  await page.getByRole("button", { name: "中文", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: /一句话试遍所有模型/ }),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  await expect(page).toHaveTitle(/让想象力/);
  await page.getByRole("button", { name: "English", exact: true }).click();
  for (const route of [
    "/experiments",
    "/experiments/pelican",
    "/experiments/crocodile",
    "/experiments/taobao",
    "/leaderboard/pelican",
    "/arena/crocodile",
    "/does-not-exist",
  ]) {
    await page.goto(route);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    // The Taobao illustration intentionally contains its Chinese brand mark.
    // Check interface copy without treating text drawn inside SVG art as UI copy.
    const interfaceText = await page.locator("main").evaluate((main) => {
      const copy = main.cloneNode(true) as HTMLElement;
      copy.querySelectorAll("svg").forEach((art) => art.remove());
      return copy.textContent || "";
    });
    expect(interfaceText).not.toMatch(/[\u4e00-\u9fff]/);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.goto("/leaderboard/pelican");
  await expect(page.locator("tbody tr")).toHaveCount(33);
  await page.screenshot({
    path: `test-results/rank-en-${info.project.name}.png`,
    fullPage: true,
  });
});
test("switching language preserves the current blind pair and revealed vote", async ({
  page,
}, info) => {
  let pairRequests = 0;
  page.on("request", (request) => {
    if (
      request.url().endsWith("/api/arena") &&
      request.postDataJSON()?.action === "pair"
    )
      pairRequests++;
  });
  await page.goto("/arena/pelican");
  await expect(
    page.getByRole("button", { name: "Left is better" }),
  ).toBeEnabled({ timeout: 45000 });
  // React development mode can abort an initial mount request before retrying.
  // Once the pair is ready, language changes must add no further pair requests.
  const initialPairRequests = pairRequests;
  const before = await page
    .locator(".comparison-image img")
    .evaluateAll((images) =>
      images.map((img) => (img as HTMLImageElement).src),
    );
  await page.getByRole("button", { name: "中文", exact: true }).click();
  await expect(page.getByRole("button", { name: "左边更好" })).toBeEnabled();
  await expect(page.getByRole("heading", { name: /先别看名字/ })).toBeVisible();
  expect(
    await page
      .locator(".comparison-image img")
      .evaluateAll((images) =>
        images.map((img) => (img as HTMLImageElement).src),
      ),
  ).toEqual(before);
  await page.getByRole("button", { name: "左边更好" }).click();
  await expect(page.getByText("本次已投 1 票")).toBeVisible();
  await page.getByRole("button", { name: "English", exact: true }).click();
  await expect(page.getByText("Models revealed")).toBeVisible();
  await expect(page.getByText("Votes this visit: 1")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Forget the names/ }),
  ).toBeVisible();
  expect(pairRequests).toBe(initialPairRequests);
  await page.screenshot({
    path: `test-results/arena-en-${info.project.name}.png`,
    fullPage: true,
  });
});
test("API errors and existing client errors follow selected language", async ({
  page,
}) => {
  await page.route("**/api/arena", (route) =>
    route.fulfill({
      status: 429,
      json: { code: "rateLimited", error: "Operation limited" },
    }),
  );
  await page.goto("/arena/pelican");
  await expect(page.locator(".vote-feedback").getByRole("alert")).toContainText(
    "minute",
  );
  await page.getByRole("button", { name: "中文", exact: true }).click();
  await expect(page.locator(".vote-feedback").getByRole("alert")).toContainText(
    "请稍等一分钟",
  );
  const zh = await page.request.post("/api/arena", { data: "invalid json" });
  expect((await zh.json()).error).toBe("请求格式无效。");
  expect(
    (await page.request.get("/api/leaderboard?experiment=unknown")).status(),
  ).toBe(404);
  await page.getByRole("button", { name: "English", exact: true }).click();
  const en = await page.request.post("/api/arena", { data: "invalid json" });
  expect((await en.json()).error).toBe("The request format is invalid.");
});
