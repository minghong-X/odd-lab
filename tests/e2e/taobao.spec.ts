import { test, expect } from "@playwright/test";
import catalog from "../../data/catalog.json" with { type: "json" };

test("all Taobao documents are served as HTML and render in blind Arena and zoom", async ({
  page,
  request,
}) => {
  for (const item of catalog.filter((a) => a.experiment === "taobao")) {
    const response = await request.get(`/api/media?id=${item.id}`);
    expect(response.status(), item.model).toBe(200);
    expect(response.headers()["content-type"]).toContain("text/html");
    expect(await response.text()).toMatch(/<html[\s>]/i);
  }
  await page.goto("/arena/taobao");
  await expect(page.locator(".comparison-image iframe")).toHaveCount(2);
  for (const iframe of await page.locator(".comparison-image iframe").all()) {
    await expect(iframe).toHaveAttribute("sandbox", "allow-scripts");
    await expect
      .poll(
        async () =>
          (await iframe.contentFrame().locator("body").innerText()).length,
      )
      .toBeGreaterThan(100);
  }
  await expect(page.getByText("Mystery model", { exact: true })).toHaveCount(2);
  await page.locator(".zoom-button").first().click();
  await expect(page.locator("dialog.html-dialog")).toBeVisible();
  await expect
    .poll(
      async () =>
        (
          await page
            .locator("dialog iframe")
            .contentFrame()
            .locator("body")
            .innerText()
        ).length,
    )
    .toBeGreaterThan(100);
  await page.screenshot({
    path: `test-results/taobao-zoom-${test.info().project.name}.png`,
  });
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Left is better" }).click();
  await expect(page.getByText("Mystery model", { exact: true })).toHaveCount(0);
  await page.goto("/leaderboard/taobao");
  await expect(page.locator("tbody tr")).toHaveCount(
    catalog.filter((item) => item.experiment === "taobao").length,
  );
});
