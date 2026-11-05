import { expect, test } from "@playwright/test";

test.describe("Landing page", () => {
  test("renders the hero and brand", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/UnMorph/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Prevent morphing.");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Prove authenticity.");
    await expect(page.getByTestId("dynamic-island")).toBeVisible();
  });

  test("dynamic island Sign in leads to the sign-in page", async ({ page }) => {
    await page.goto("/");
    await page
      .getByTestId("dynamic-island")
      .getByRole("link", { name: /sign in/i })
      .click();
    await expect(page).toHaveURL(/\/sign-in$/);
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });

  test("island collapses into a compact pill while scrolling down (desktop)", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "desktop-only behaviour");
    await page.goto("/");
    const island = page.getByTestId("dynamic-island");
    await expect(island).toHaveAttribute("data-mode", "expanded");
    await page.mouse.move(10, 600);
    for (let i = 0; i < 8; i++) await page.mouse.wheel(0, 400);
    await expect(island).toHaveAttribute("data-mode", "compact");
  });

  test("section links glide to their section", async ({ page, isMobile }) => {
    await page.goto("/");
    const island = page.getByTestId("dynamic-island");
    if (isMobile) await island.getByRole("button", { name: /open menu/i }).click();
    await island.getByRole("link", { name: "Detection" }).click();
    await expect(page.locator("#detection")).toBeInViewport();
    await expect(page).toHaveURL(/\/$/);
  });

  test("tamper comparison slider is keyboard operable", async ({ page }) => {
    await page.goto("/");
    const slider = page.getByRole("slider", { name: "Comparison divider position" });
    await slider.focus();
    await page.keyboard.press("Home");
    await expect(slider).toHaveValue("2");
    await page.keyboard.press("End");
    await expect(slider).toHaveValue("98");
  });
});
