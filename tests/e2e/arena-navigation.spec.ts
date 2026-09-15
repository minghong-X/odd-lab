import { test, expect } from "@playwright/test";
import catalog from "../../data/catalog.json" with { type: "json" };
test("Arena selector routes to each experiment and rules translate", async ({
  page,
}) => {
  for (const [slug, title] of [
    ["crocodile", "Crocodile on a motorcycle"],
    ["pelican", "Pelican on a bicycle"],
    ["taobao", "Recreate the Taobao homepage (PC)"],
  ]) {
    await page.goto("/");
    await page
      .getByRole("button", { name: "Choose an Arena experiment" })
      .click();
    await page.getByRole("menuitem", { name: title }).click();
    await expect(page).toHaveURL(new RegExp(`/arena/${slug}$`));
    if (slug !== "taobao") {
      await expect(page.locator(".generation-rules")).toContainText(
        "up to three attempts",
      );
      await expect(page.locator(".comparison-image img")).toHaveCount(2);
    } else
      await expect(page.locator(".comparison-image iframe")).toHaveCount(2);
  }
  await page.goto("/arena/pelican");
  await page.getByRole("button", { name: "中文", exact: true }).click();
  await expect(page.locator(".generation-rules")).toContainText(
    "每个模型最多有三次机会",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("corrected Claude Opus 5 appears only in its proper experiment", async ({
  request,
}) => {
  const corrected = catalog.find(
    (a) => a.model === "claude-opus-5" && a.experiment === "pelican",
  )!;
  expect(corrected.experiment).toBe("pelican");
  for (const slug of ["pelican", "crocodile"]) {
    const result = await (
      await request.get(`/api/leaderboard?experiment=${slug}`)
    ).json();
    expect(
      result.entries.some((a: { id: string }) => a.id === corrected.id),
    ).toBe(slug === "pelican");
    expect(
      result.entries.some(
        (a: { id: string }) => a.id === "ffcf0767c511cda46db4357c",
      ),
    ).toBe(false);
  }
});
