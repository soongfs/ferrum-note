import { expect, test, type Page } from "@playwright/test";

async function createFencedCodeBlock(page: Page, language: string, bodyLines: string[]) {
  const proseMirror = page.locator(".ProseMirror");
  await proseMirror.click();
  await page.keyboard.press("Control+End");
  await page.keyboard.press("Enter");
  await page.keyboard.type(`\`\`\`${language}`);
  await page.keyboard.press("Enter");

  for (const line of bodyLines) {
    await page.keyboard.type(line);
    await page.keyboard.press("Enter");
  }
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
    await expect(page.locator(".ProseMirror")).toBeVisible();
  });

  test("switches writer/source modes and keeps markdown synchronized", async ({ page }) => {
    await page.goto("/");

    await page.getByTestId("mode-source-button").click();
    await expect(page.getByTestId("editor-mode-source")).toBeVisible();

    await page.locator(".cm-content").click();
    await page.keyboard.press("Control+A");
    await page.keyboard.type("# Mode Sync\\n\\n**bold** and `code`");

    await page.getByTestId("mode-writer-button").click();
    await expect(page.getByTestId("editor-mode-writer")).toBeVisible();

    await expect(page.locator(".ProseMirror h1")).toContainText("Mode Sync");
    await page.getByText("bold").first().click();
    await expect(page.getByTestId("syntax-lens-panel")).toBeVisible();
    await expect(page.getByTestId("syntax-lens-input")).toHaveValue(/\*\*bold\*\*/);

    await page.getByTestId("syntax-lens-input").fill("**bolder** and `code`");
    await expect(page.getByText("bolder").first()).toBeVisible();
  });

  test("captures python fenced language and renders highlighted tokens", async ({ page }) => {
    await page.goto("/");
    await createFencedCodeBlock(page, "python", ["def add(x, y):", "    return x + y"]);

    await expect(page.locator("pre[data-language='python']")).toBeVisible();
    await expect(
      page.locator("pre[data-language='python'] span[class^='hljs']").first()
    ).toBeVisible();
  });

  test("captures c fenced language and renders highlighted tokens", async ({ page }) => {
    await page.goto("/");
    await createFencedCodeBlock(page, "c", ["int main() {", "  return 0;", "}"]);

    await expect(page.locator("pre[data-language='c']")).toBeVisible();
    await expect(page.locator("pre[data-language='c'] span[class^='hljs']").first()).toBeVisible();
  });
});
