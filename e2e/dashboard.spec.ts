import { createHash } from "node:crypto";
import { expect, test } from "@playwright/test";

// A valid 1×1 PNG.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  test("shows KPIs, activity and recent verifications from mock data", async ({ page }) => {
    await expect(page.getByText("Images registered")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Verification activity" })).toBeVisible();
    await expect(page.locator("tbody tr")).toHaveCount(10);
  });

  test("filters the table by verdict", async ({ page }) => {
    await page.getByRole("tab", { name: /tampered/i }).click();
    await expect(page.locator("tbody tr")).toHaveCount(3);
    await page.getByRole("tab", { name: /unregistered/i }).click();
    await expect(page.locator("tbody tr")).toHaveCount(2);
  });

  test("searches the table", async ({ page }) => {
    await page.getByRole("searchbox", { name: /search verifications/i }).fill("passport");
    await expect(page.locator("tbody tr")).toHaveCount(1);
    await expect(page.locator("tbody tr")).toContainText("passport-renewal.png");
  });

  test("verifies a sample image end to end", async ({ page }) => {
    await page.getByRole("button", { name: "Verify sample harbor-dawn.jpg" }).click();
    const result = page.getByTestId("verify-result");
    await expect(result).toBeVisible({ timeout: 15_000 });
    await expect(result).toContainText("Authentic");
    await expect(page.locator("tbody tr")).toHaveCount(11);
  });

  test("fingerprints an uploaded file with a real SHA-256", async ({ page }) => {
    const digest = createHash("sha256").update(PNG).digest("hex");
    await page
      .getByTestId("verify-file-input")
      .setInputFiles({ name: "evidence.png", mimeType: "image/png", buffer: PNG });
    const result = page.getByTestId("verify-result");
    await expect(result).toBeVisible({ timeout: 15_000 });
    await expect(result).toContainText(digest.slice(0, 8));
    await expect(page.locator("tbody tr").first()).toContainText("evidence.png");
  });

  test("rejects non-image uploads", async ({ page }) => {
    await page
      .getByTestId("verify-file-input")
      .setInputFiles({ name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("hi") });
    // (Next's route announcer is also role="alert", so match on the message.)
    await expect(page.getByRole("alert").filter({ hasText: "isn't an image" })).toBeVisible();
  });

  test("opens and closes an integrity report", async ({ page }) => {
    await page.locator("tbody tr").first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("Integrity history");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });
});
