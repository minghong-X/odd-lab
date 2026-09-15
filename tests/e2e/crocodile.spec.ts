import { test, expect } from "@playwright/test";
import catalog from "../../data/catalog.json" with { type: "json" };

const crocodiles = catalog.filter((a) => a.experiment === "crocodile");
test("home mixes experiments and keeps Arena accessible", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Choose an Arena experiment" }),
  ).toBeVisible();
  await expect(page.locator(".scroll-invite")).toHaveCount(0);
  await expect(page.locator(".photo-cloud")).toHaveAttribute(
    "data-intro-state",
    "settled",
    { timeout: 12000 },
  );
  const urls = await page
    .locator(".flying-photo img")
    .evaluateAll((imgs) =>
      imgs.map((img) => (img as HTMLImageElement).currentSrc),
    );
  const ids = urls.map((url) => new URL(url).searchParams.get("id"));
  expect(ids.filter((id) => crocodiles.some((a) => a.id === id))).toHaveLength(
    10,
  );
  expect(
    ids.filter((id) =>
      catalog.some((a) => a.id === id && a.experiment === "pelican"),
    ),
  ).toHaveLength(10);
});

test("crocodile gallery, blind voting and rankings work in both languages without Elo display", async ({
  page,
}) => {
  await page.goto("/experiments/crocodile");
  await expect(page.locator(".art-gallery article")).toHaveCount(
    crocodiles.length,
  );
  await expect(page.locator(".art-gallery img").first()).toHaveAttribute(
    "src",
    /motion=1/,
  );
  await page.locator('.hero-actions a[href="/arena/crocodile"]').click();
  await expect(page.getByText("Mystery model", { exact: true })).toHaveCount(2);
  await expect(
    page.getByRole("button", { name: "Left is better" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Left is better" }).click();
  await expect(page.getByText("Mystery model", { exact: true })).toHaveCount(0);
  await page.goto("/leaderboard/crocodile");
  await expect(page.locator("tbody tr")).toHaveCount(crocodiles.length);
  await expect(page.locator("thead th")).toHaveCount(5);
  await expect(page.locator("main")).not.toContainText(/Elo|1,500|1500|K=32/);
  await page.getByRole("button", { name: "中文", exact: true }).click();
  await expect(
    page.getByRole("columnheader", { name: "对战", exact: true }),
  ).toBeVisible();
  await expect(page.locator("main")).not.toContainText(/Elo|1500|K=32/);
  await page.screenshot({
    path: `test-results/crocodile-rank-${test.info().project.name}.png`,
    fullPage: true,
  });
});
