import { expect, test } from "@playwright/test";

test.describe("FerrumNote desktop flows", () => {
  test("open, edit and save flow", async ({ page }) => {
    await page.goto("/");

    await page.getByPlaceholder("输入 .md 文件路径，例如 /home/user/notes/today.md").fill("/tmp/e2e.md");
    await page.getByRole("button", { name: "打开" }).click();

    await page.locator(".ProseMirror").click();
    await page.keyboard.type("e2e-content");

    await page.getByRole("button", { name: "保存" }).click();
    await expect(page.getByText("状态：")).toBeVisible();
  });

  test("find/replace and export flow", async ({ page }) => {
    await page.goto("/");

    await page.getByPlaceholder("查找").fill("FerrumNote");
    await page.getByPlaceholder("替换为").fill("FerrumNoteX");
    await page.getByRole("button", { name: "全部替换" }).click();
    await expect(page.getByText("匹配:")).toBeVisible();

    await page.getByRole("button", { name: "导出 HTML" }).click();
    await page.getByRole("button", { name: "导出 PDF" }).click();
  });
});
