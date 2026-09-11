import { test, expect } from "@playwright/test";
import catalog from "../../data/catalog.json" with { type: "json" };
test("Arena selector routes to each experiment and rules translate", async ({
  page,
}) => {
  await page.goto("/");
  const picker = page.getByRole("combobox", {
    name: "Choose an Arena experiment",
  });
  await expect(picker.locator("option")).toHaveCount(4);
  for (const slug of ["crocodile", "pelican", "starship"]) {
    await picker.selectOption(slug);
    await expect(page).toHaveURL(new RegExp(`/arena/${slug}$`));
    if (slug !== "starship") {
      await expect(page.locator(".generation-rules")).toContainText(
        "up to three attempts",
      );
      await expect(page.locator(".comparison-image img")).toHaveCount(2);
    } else await expect(page.locator(".empty-state")).toBeVisible();
  }
  await picker.selectOption("pelican");
  await page.getByRole("button", { name: "中文", exact: true }).click();
  await expect(page.locator(".generation-rules")).toContainText(
    "每个模型最多有三次机会",
  );
  await expect(
    page.getByRole("combobox", { name: "选择盲测实验" }),
  ).toHaveValue("pelican");
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
    (a) => a.title === "claude-opus-5-pelican-bike",
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
