import { expect, test } from "@playwright/test";

test.use({ video: "on", viewport: { width: 1280, height: 800 } });

test("demo gif: teaser, chips, card, handoff", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("launcher-teaser")).toBeVisible({ timeout: 8000 });
  await page.waitForTimeout(500);
  await page.getByTestId("launcher-nudge").filter({ hasText: "Dispute a charge" }).click();
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: "Use demo code 000000" }).click();
  await expect(page.getByTestId("card-timeline")).toBeVisible();
  await page.waitForTimeout(700);
  await page.getByRole("button", { name: "Talk to a person" }).first().click();
  await expect(page.getByTestId("handoff-banner")).toBeVisible();
  await page.waitForTimeout(900);
});
