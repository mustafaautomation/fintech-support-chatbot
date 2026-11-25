import { expect, test } from "@playwright/test";

test("mobile chat keeps the composer on screen", async ({ page }) => {
  await page.goto("/chat");
  await page.getByLabel("Message").fill("What is the annual fee?");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText("$0").first()).toBeVisible();
  await expect(page.getByText(/Verified|Code 000000/)).toBeVisible();
  const box = await page.getByRole("button", { name: "Send" }).boundingBox();
  expect(box).not.toBeNull();
  const viewport = page.viewportSize();
  expect(box!.y).toBeLessThan(viewport!.height);
  await page.screenshot({ path: "docs/screenshots/mobile.png", fullPage: true });
});
