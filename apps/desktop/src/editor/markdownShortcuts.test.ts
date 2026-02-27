import { EditorState } from "@codemirror/state";
import { describe, expect, it } from "vitest";
import { applyEnterBehavior, applyMarkdownShortcut } from "./markdownShortcuts";

describe("markdown shortcut commands", () => {
  it("wraps selected text with bold markers", () => {
    const state = EditorState.create({
      doc: "hello world",
      selection: { anchor: 6, head: 11 }
    });

    const transaction = applyMarkdownShortcut("toggleBold", state);
    expect(transaction).toBeTruthy();
    expect(transaction?.newDoc.toString()).toBe("hello **world**");
  });

  it("toggles heading prefix on current line", () => {
    const state = EditorState.create({
      doc: "Title",
      selection: { anchor: 2 }
    });

    const transaction = applyMarkdownShortcut("toggleHeading2", state);
    expect(transaction?.newDoc.toString()).toBe("## Title");
  });

  it("normalizes fenced language alias on enter", () => {
    const state = EditorState.create({
      doc: "```py",
      selection: { anchor: 5 }
    });

    const transaction = applyEnterBehavior(state);
    expect(transaction).toBeTruthy();
    expect(transaction?.newDoc.toString()).toBe("```python\n\n```");
    expect(transaction?.newSelection.main.anchor).toBe(10);
  });

  it("does not transform inline code on enter", () => {
    const state = EditorState.create({
      doc: "`test`",
      selection: { anchor: 6 }
    });

    const transaction = applyEnterBehavior(state);
    expect(transaction).toBeNull();
  });

  it("does not insert an extra closing fence when one already exists", () => {
    const state = EditorState.create({
      doc: "```python\nprint(1)\n```",
      selection: { anchor: 9 }
    });

    const transaction = applyEnterBehavior(state);
    expect(transaction).toBeNull();
  });

  it("keeps scanning when fenced content contains triple-backtick-prefixed text", () => {
    const state = EditorState.create({
      doc: "```python\n```javascript\nprint(1)\n```",
      selection: { anchor: 9 }
    });

    const transaction = applyEnterBehavior(state);
    expect(transaction).toBeNull();
  });
});
