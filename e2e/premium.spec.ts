import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ request }) => {
  await request.post("/api/demo/reset");
});

test("launcher teaser, demo pill, follow-ups, and actions", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await expect(page.getByTestId("launcher-teaser")).toBeVisible({ timeout: 8000 });
  await expect(page.getByTestId("engine-pill").first()).toHaveText("Demo mode");
  await expect(page.getByTestId("trust-panel")).toBeVisible();
  await expect(page.getByText("Portfolio demo by Quvantic - fictional brand, not a real business / not client work").first()).toBeVisible();
  await page.getByTestId("try-asking").filter({ hasText: "Annual fee" }).click();
  const chat = page.getByTestId("landing-hero-chat");
  await expect(chat.getByText("$0").first()).toBeVisible();
  await expect(chat.getByTestId("follow-up").first()).toBeVisible();
  await expect(chat.getByRole("button", { name: "Copy" }).first()).toBeVisible();
  await expect(chat.getByRole("button", { name: "Regenerate" }).first()).toBeVisible();
  await expect(chat.getByTestId("citation-chip").first()).toBeVisible();
  await chat.getByTestId("citation-chip").first().focus();
  await expect(chat.getByTestId("citation-preview")).toBeVisible();
});

test("dispute card, slots, lead card, and handoff resume", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await page.getByTestId("launcher-nudge").filter({ hasText: "Dispute a charge" }).click();
  const chat = page.getByTestId("landing-hero-chat");
  await expect(chat.getByRole("button", { name: "Use demo code 000000" })).toBeVisible();
  await chat.getByRole("button", { name: "Use demo code 000000" }).click();
  await expect(chat.getByTestId("card-timeline")).toBeVisible();
  await expect(chat.getByText("LZ-48001").first()).toBeVisible();
  await chat.getByRole("button", { name: "Talk to a person" }).first().click();
  await expect(chat.getByTestId("slot-chip").first()).toBeVisible();
  await expect(chat.getByText("Only times the booking system returned")).toBeVisible();
  await expect(chat.getByTestId("handoff-banner")).toBeVisible();
  await chat.getByRole("button", { name: "Leave contact details for the team" }).click();
  await expect(chat.getByTestId("card-lead")).toBeVisible();
  await page.goto("/admin");
  await page.getByLabel("Password").fill("lumen-demo");
  await page.getByRole("button", { name: "Enter the desk" }).click();
  await expect(page.getByText(/H-\d+/).first()).toBeVisible();
  await page.getByRole("button", { name: "Resume bot" }).click();
  await expect(page.getByText(/handed this chat back/i).first()).toBeVisible();
});

test("embed launcher and mobile fullscreen", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/embed-demo");
  await expect(page.getByTestId("chat-launcher")).toBeVisible();
  await expect(page.getByTestId("launcher-nudge").first()).toBeVisible();
  await page.getByTestId("chat-launcher").click();
  const frame = page.frameLocator('iframe[title="Lumen Card support"]');
  await expect(frame.getByTestId("chat-widget")).toBeVisible();
  await expect(frame.getByTestId("engine-pill")).toHaveText("Demo mode");
  await page.setViewportSize({ width: 375, height: 812 });
  const box = await page.locator("#lumen-support-frame").boundingBox();
  expect(box?.width).toBeGreaterThan(360);
  await expect(frame.getByRole("button", { name: "Close chat" })).toBeVisible();
});

test("dark mode and reduced motion still open", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => localStorage.setItem("theme", "dark"));
  await page.goto("/chat");
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.getByTestId("chat-widget")).toBeVisible();
  const input = page.getByTestId("composer-input");
  await input.fill("What is the annual fee?");
  await page.getByTestId("composer-send").click();
  await expect(page.getByTestId("phase-indicator")).toBeVisible();
  await expect(page.getByText("$0").first()).toBeVisible();
});

test("landing and embed have no serious axe violations", async ({ page }) => {
  await page.goto("/");
  const home = await new AxeBuilder({ page }).disableRules(["color-contrast"]).analyze();
  expect(home.violations.filter((item) => item.impact === "serious" || item.impact === "critical")).toEqual([]);
  await page.goto("/embed-demo");
  const embed = await new AxeBuilder({ page }).disableRules(["color-contrast"]).analyze();
  expect(embed.violations.filter((item) => item.impact === "serious" || item.impact === "critical")).toEqual([]);
});
