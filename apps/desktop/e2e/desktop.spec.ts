import { expect, test, type Page } from "@playwright/test";

async function setSourceMarkdown(page: Page, markdown: string) {
  await page.getByTestId("mode-source-toggle-button").click();
  await expect(page.getByTestId("editor-mode-source")).toBeVisible();

  const source = page.locator(".cm-content");
  await source.click();
  await page.keyboard.press("Control+A");
  await page.keyboard.type(markdown);

  await page.getByTestId("mode-source-toggle-button").click();
  await expect(page.getByTestId("editor-mode-writer")).toBeVisible();
  await expect(page.getByTestId("writer-surface")).toBeVisible();
}

async function placeCaretAtEndOfWriter(page: Page) {
  const lastLeaf = page.locator(".writer-block .writer-leaf").last();
  const box = await lastLeaf.boundingBox();
  if (!box) {
    throw new Error("Last writer leaf is not visible");
  }

  await lastLeaf.click({
    position: {
      x: Math.max(box.width - 2, 1),
      y: Math.max(box.height / 2, 1)
    }
  });
  await page.keyboard.press("End");
  await page.waitForTimeout(50);
}

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
    await expect(page.getByTestId("writer-surface")).toBeVisible();
  });

  test("toggles source mode for the entire editor and keeps content", async ({ page }) => {
    await page.goto("/");

    await setSourceMarkdown(page, "# Heading\n\nText with **bold** and `code`.");

    const firstBlock = page.getByTestId("writer-block-0");
    await expect(firstBlock).toContainText("# Heading");
    await expect(page.locator(".writer-block--heading-1", { hasText: "# Heading" })).toBeVisible();
  });

  test("applies heading hierarchy rendering classes in writer mode", async ({ page }) => {
    await page.goto("/");

    await setSourceMarkdown(page, "# Heading 1\n\n## Heading 2\n\nParagraph");

    await expect(page.locator(".writer-block--heading-1", { hasText: "# Heading 1" })).toBeVisible();
    await expect(page.locator(".writer-block--heading-2", { hasText: "## Heading 2" })).toBeVisible();
  });

  test("renders markdown markers inside the engine-controlled writer surface", async ({ page }) => {
    await page.goto("/");

    await setSourceMarkdown(page, "Text **bold** and `code`");

    await expect(page.getByTestId("writer-block-0")).toContainText("**bold**");
    await expect(page.getByTestId("writer-block-0")).toContainText("`code`");
  });

  test("keeps inline code stable after pressing Enter", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByTestId("writer-surface")).toBeVisible();
    await placeCaretAtEndOfWriter(page);
    await page.keyboard.press("Enter");
    await page.keyboard.type("`test`");
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("writer-surface")).toContainText("`test`");

    await page.getByTestId("mode-source-toggle-button").click();
    await expect(page.getByTestId("editor-mode-source")).toBeVisible();

    const sourceText = await page.locator(".cm-content").innerText();
    expect(sourceText).toContain("`test`");
    expect(sourceText).not.toContain("``` est` ``");
  });

  test("auto-closes fenced code blocks and shows a language badge", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByTestId("writer-surface")).toBeVisible();
    await placeCaretAtEndOfWriter(page);
    await page.keyboard.press("Enter");
    await page.keyboard.type("```py");
    await page.keyboard.press("Enter");
    await page.keyboard.type("print(1)");

    await page.getByTestId("mode-source-toggle-button").click();
    const sourceText = await page.locator(".cm-content").innerText();
    expect(sourceText).toContain("```python\nprint(1)\n```");

    await page.getByTestId("mode-source-toggle-button").click();
    await expect(page.locator(".writer-block--fenced_code")).toBeVisible();
    await expect(page.getByText("python", { exact: true })).toBeVisible();
  });
});
