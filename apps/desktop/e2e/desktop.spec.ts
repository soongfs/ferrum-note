import { expect, test } from "@playwright/test";

test.describe("FerrumNote web mode", () => {
  test("shows desktop-only banner and disables desktop actions", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByText("Desktop-only features are disabled in browser mode", {
        exact: false
      })
    ).toBeVisible();

    await expect(page.getByTestId("open-folder-button")).toBeDisabled();
    await expect(page.getByTestId("save-button")).toBeDisabled();
    await expect(page.getByTestId("save-as-button")).toBeDisabled();
    await expect(page.getByTestId("export-html-button")).toBeDisabled();
    await expect(page.getByTestId("export-pdf-button")).toBeDisabled();
  });

  test("keeps search and replace available in browser mode", async ({ page }) => {
    await page.goto("/");

    await page.getByPlaceholder("Find").fill("FerrumNote");
    await page.getByPlaceholder("Replace").fill("FerrumNoteX");
    await page.getByTestId("replace-all-button").click();

    await expect(page.getByText("Matches:", { exact: false })).toBeVisible();
    await expect(page.locator(".ProseMirror")).toBeVisible();
  });
});
