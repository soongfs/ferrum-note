import { EditorState } from "@codemirror/state";
import { markdown } from "@codemirror/lang-markdown";
import { describe, expect, it } from "vitest";
import {
  buildWriterPresentationDecorations
} from "./writerPresentationDecorations";
import { DEFAULT_WRITER_RENDER_POLICY } from "./types";

type DecorationInfo = {
  from: number;
  to: number;
  className: string;
};

function collectDecorations(doc: string): DecorationInfo[] {
  const state = EditorState.create({
    doc,
    extensions: [markdown()]
  });

  const decorationSet = buildWriterPresentationDecorations(state, DEFAULT_WRITER_RENDER_POLICY);
  const collected: DecorationInfo[] = [];

  decorationSet.between(0, state.doc.length, (from, to, value) => {
    const className =
      (value.spec.attributes?.class as string | undefined) ||
      (value.spec.class as string | undefined) ||
      "";

    collected.push({
      from,
      to,
      className
    });
  });

  return collected;
}

describe("writer presentation decorations", () => {
  it("adds heading classes for heading levels", () => {
    const doc = "# Title\n\n## Subtitle";
    const decorations = collectDecorations(doc);

    expect(decorations.some((entry) => entry.className.includes("cm-fn-heading-1"))).toBe(true);
    expect(decorations.some((entry) => entry.className.includes("cm-fn-heading-2"))).toBe(true);
  });

  it("decorates fenced code lines and range", () => {
    const doc = "```python\nprint(1)\n```";
    const decorations = collectDecorations(doc);

    expect(decorations.some((entry) => entry.className.includes("cm-fn-fenced-open"))).toBe(true);
    expect(decorations.some((entry) => entry.className.includes("cm-fn-fenced-body"))).toBe(true);
    expect(decorations.some((entry) => entry.className.includes("cm-fn-fenced-close"))).toBe(true);
  });

  it("adds a stable code info badge class", () => {
    const doc = "```python\nprint(1)\n```";
    const decorations = collectDecorations(doc);

    expect(decorations.some((entry) => entry.className.includes("cm-fn-code-info"))).toBe(true);
  });
});
