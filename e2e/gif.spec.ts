import { expect, test } from "@playwright/test";

test.use({ video: "on", viewport: { width: 1280, height: 800 } });

test("demo gif: dispute then handoff", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(600);
  await page.getByRole("button", { name: "Dispute a charge" }).click();
  await page.waitForTimeout(700);
  await page.getByRole("button", { name: "Use demo code 000000" }).click();
  await expect(page.getByText("LZ-48001").first()).toBeVisible();
  await page.waitForTimeout(900);
  await page.getByLabel("Message").fill("I want to speak with a person.");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText(/Handoff H-/).first()).toBeVisible();
  await page.waitForTimeout(800);
});
