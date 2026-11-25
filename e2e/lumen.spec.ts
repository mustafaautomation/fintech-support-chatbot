import { expect, test } from "@playwright/test";

test("widget opens and a help question is cited", async ({ page }) => {
  await page.goto("/embed-demo");
  await page.getByRole("button", { name: "Open Lumen support chat" }).click();
  const frame = page.frameLocator('iframe[title="Lumen Card support"]');
  await frame.getByLabel("Message").fill("What is the annual fee?");
  await frame.getByRole("button", { name: "Send" }).click();
  await expect(frame.getByText("$0").first()).toBeVisible();
  await expect(frame.getByText(/Source:/).first()).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/widget.png", fullPage: true });
});

test("dispute flow returns a case id and a person can reply", async ({ page }) => {
  await page.goto("/");
  await page.screenshot({ path: "docs/screenshots/landing.png", fullPage: true });
  await page.getByRole("button", { name: "Dispute a charge" }).click();
  await expect(page.getByText("000000").first()).toBeVisible();
  await page.getByRole("button", { name: "Use demo code 000000" }).click();
  await expect(page.getByText("LZ-48001").first()).toBeVisible();
  await expect(page.getByText("Night Market Electronics").first()).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/dispute.png", fullPage: true });
  await page.getByLabel("Message").fill("I want to speak with a person.");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText(/Handoff H-/).first()).toBeVisible();
  await page.goto("/admin");
  await page.getByLabel("Password").fill("lumen-demo");
  await page.getByRole("button", { name: "Enter the desk" }).click();
  await expect(page.getByText(/H-\d+/).first()).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/admin.png", fullPage: true });
});
