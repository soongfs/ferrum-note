import { describe, expect, it } from "vitest";
import { mapUtf8SelectionToDomTargets } from "./selectionMapping";

describe("selectionMapping dom target resolution", () => {
  it("maps the start of the document to the first leaf", () => {
    const targets = mapUtf8SelectionToDomTargets(
      [
        {
          startUtf8: 0,
          endUtf8: 3,
          text: "中",
          empty: false
        }
      ],
      {
        anchor_utf8: 0,
        head_utf8: 0
      },
      1,
      3
    );

    expect(targets).toEqual({
      anchor: {
        kind: "leaf",
        leafIndex: 0,
        offset: 0
      },
      focus: {
        kind: "leaf",
        leafIndex: 0,
        offset: 0
      }
    });
  });

  it("maps document-end offsets to the root boundary when trailing newlines extend past the last leaf", () => {
    const targets = mapUtf8SelectionToDomTargets(
      [
        {
          startUtf8: 0,
          endUtf8: 3,
          text: "中",
          empty: false
        }
      ],
      {
        anchor_utf8: 4,
        head_utf8: 4
      },
      2,
      4
    );

    expect(targets).toEqual({
      anchor: {
        kind: "root",
        offset: 2
      },
      focus: {
        kind: "root",
        offset: 2
      }
    });
  });

  it("preserves backward selections across multiple leaves", () => {
    const targets = mapUtf8SelectionToDomTargets(
      [
        {
          startUtf8: 0,
          endUtf8: 1,
          text: "a",
          empty: false
        },
        {
          startUtf8: 2,
          endUtf8: 5,
          text: "中",
          empty: false
        }
      ],
      {
        anchor_utf8: 5,
        head_utf8: 0
      },
      2,
      6
    );

    expect(targets).toEqual({
      anchor: {
        kind: "leaf",
        leafIndex: 1,
        offset: 1
      },
      focus: {
        kind: "leaf",
        leafIndex: 0,
        offset: 0
      }
    });
  });

  it("maps empty placeholder leaves to offset zero", () => {
    const targets = mapUtf8SelectionToDomTargets(
      [
        {
          startUtf8: 4,
          endUtf8: 4,
          text: "",
          empty: true
        }
      ],
      {
        anchor_utf8: 4,
        head_utf8: 4
      },
      1,
      5
    );

    expect(targets).toEqual({
      anchor: {
        kind: "leaf",
        leafIndex: 0,
        offset: 0
      },
      focus: {
        kind: "leaf",
        leafIndex: 0,
        offset: 0
      }
    });
  });
});
