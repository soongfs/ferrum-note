import { EditorState } from "@codemirror/state";
import { markdown } from "@codemirror/lang-markdown";
import { describe, expect, it } from "vitest";
import { buildMarkdownMarkerDecorations } from "./markerDecorations";
import { DEFAULT_WRITER_MARKER_POLICY } from "./types";

function hiddenRangesFor(doc: string, cursor: number): Array<[number, number]> {
  const state = EditorState.create({
    doc,
    selection: { anchor: cursor },
    extensions: [markdown()]
  });

  const decorationSet = buildMarkdownMarkerDecorations(state, DEFAULT_WRITER_MARKER_POLICY);
  const ranges: Array<[number, number]> = [];

  decorationSet.between(0, doc.length, (from, to) => {
    ranges.push([from, to]);
  });

  return ranges;
}

describe("writer marker decorations", () => {
  it("hides heading marker when cursor is outside heading", () => {
    const doc = "# Title\n\nParagraph";
    const ranges = hiddenRangesFor(doc, doc.length);

    expect(ranges).toContainEqual([0, 2]);
  });

  it("shows heading marker when cursor is inside heading", () => {
    const doc = "# Title\n\nParagraph";
    const ranges = hiddenRangesFor(doc, 3);

    expect(ranges).not.toContainEqual([0, 2]);
  });

  it("shows bold markers only when cursor enters bold range", () => {
    const doc = "Text **bold** end";
    const outside = hiddenRangesFor(doc, 0);
    const inside = hiddenRangesFor(doc, doc.indexOf("bold") + 1);

    expect(outside.some(([from, to]) => doc.slice(from, to) === "**")).toBe(true);
    expect(inside.some(([from, to]) => doc.slice(from, to) === "**")).toBe(false);
  });

  it("hides inline code markers when cursor is outside inline code", () => {
    const doc = "prefix `code` suffix";
    const ranges = hiddenRangesFor(doc, 0);

    expect(ranges.some(([from, to]) => doc.slice(from, to) === "`")).toBe(true);
  });
});
