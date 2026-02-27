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
    await expect(page.locator(".cm-editor")).toBeVisible();
  });

  test("toggles source mode for the entire editor and keeps content", async ({ page }) => {
    await page.goto("/");

    await setSourceMarkdown(page, "# Heading\n\nText with **bold** and `code`.");

    const firstLine = page.locator(".markdown-editor--writer .cm-line").first();
    await expect(firstLine).toContainText("Heading");
    await expect(firstLine).not.toContainText("# Heading");

    await page.getByText("Heading").first().click();
    await expect(firstLine).toContainText("# Heading");
  });

  test("applies heading hierarchy rendering classes in writer mode", async ({ page }) => {
    await page.goto("/");

    await setSourceMarkdown(page, "# Heading 1\n\n## Heading 2\n\nParagraph");

    await expect(
      page.locator(".markdown-editor--writer .cm-line.cm-fn-heading-1", { hasText: "Heading 1" })
    ).toBeVisible();
    await expect(
      page.locator(".markdown-editor--writer .cm-line.cm-fn-heading-2", { hasText: "Heading 2" })
    ).toBeVisible();
  });

  test("reveals bold and inline-code markers when cursor enters range", async ({ page }) => {
    await page.goto("/");

    await setSourceMarkdown(page, "Text **bold** and `code`");

    const line = page.locator(".markdown-editor--writer .cm-line", {
      hasText: "Text"
    });

    await expect(line).not.toContainText("**bold**");
    await page.getByText("bold").first().click();
    await expect(line).toContainText("**bold**");

    await page.getByText("code").first().click();
    await page.keyboard.press("ArrowLeft");
    await expect(line).toContainText("`code`");
  });

  test("keeps inline code stable after pressing Enter", async ({ page }) => {
    await page.goto("/");

    const editor = page.locator(".markdown-editor--writer .cm-content");
    await editor.click();
    await page.keyboard.press("Control+End");
    await page.keyboard.press("Enter");
    await page.keyboard.type("`test`");
    await page.keyboard.press("Enter");

    await page.getByTestId("mode-source-toggle-button").click();
    await expect(page.getByTestId("editor-mode-source")).toBeVisible();

    const sourceText = await page.locator(".cm-content").innerText();
    expect(sourceText).toContain("`test`");
    expect(sourceText).not.toContain("``` est` ``");
  });

  test("auto-closes fenced code and preserves language highlighting", async ({ page }) => {
    await page.goto("/");

    const editor = page.locator(".markdown-editor--writer .cm-content");
    await editor.click();
    await page.keyboard.press("Control+End");
    await page.keyboard.press("Enter");
    await page.keyboard.type("```py");
    await page.keyboard.press("Enter");
    await page.keyboard.type("print(1)");

    await page.getByTestId("mode-source-toggle-button").click();
    const sourceText = await page.locator(".cm-content").innerText();
    expect(sourceText).toContain("```python\nprint(1)\n```");

    await page.getByTestId("mode-source-toggle-button").click();
    const tokenSpan = page
      .locator(".markdown-editor--writer .cm-line", { hasText: "print(1)" })
      .locator("span[class]")
      .first();
    await expect(tokenSpan).toBeVisible();
    expect(await tokenSpan.getAttribute("class")).toBeTruthy();
  });
});
