import { expect, test } from "@playwright/test";

test.describe("FerrumNote web mode", () => {
  test("shows desktop-only banner and disables desktop actions", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByText("Desktop-only features are disabled in browser mode", {
        exact: false
      })
    ).toBeVisible();

    await expect(page.getByRole("button", { name: "Open" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Save" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Save As" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Export HTML" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Export PDF" })).toBeDisabled();
  });

  test("keeps search and replace available in browser mode", async ({ page }) => {
    await page.goto("/");

    await page.getByPlaceholder("Find").fill("FerrumNote");
    await page.getByPlaceholder("Replace").fill("FerrumNoteX");
    await page.getByRole("button", { name: "Replace All" }).click();

    await expect(page.getByText("Matches:", { exact: false })).toBeVisible();
    await expect(page.locator(".ProseMirror")).toBeVisible();
  });
});
