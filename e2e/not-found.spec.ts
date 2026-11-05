import { expect, test } from "@playwright/test";

test.describe("404", () => {
  test("unknown routes return a branded 404", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: /didn.t pass verification/i })).toBeVisible();
    await expect(page.getByText("/this-page-does-not-exist")).toBeVisible();
    await expect(page.getByTestId("dynamic-island")).toBeVisible();
  });

  test("links back home", async ({ page }) => {
    await page.goto("/missing");
    await page.getByRole("link", { name: "Back to home" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Prevent morphing.");
  });
});
