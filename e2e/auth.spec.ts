import { expect, test } from "@playwright/test";

test.describe("Sign in (demo)", () => {
  test("email sign-in opens the dashboard", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByLabel("Email").fill("alex@unmorph.app");
    await page.getByLabel("Password", { exact: true }).fill("correct horse battery staple");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { name: "Image verification", level: 1 })).toBeVisible();
  });

  test("works without any credentials", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("World ID path opens the dashboard", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByRole("button", { name: /continue with world id/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});
