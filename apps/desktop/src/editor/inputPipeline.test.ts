import { describe, expect, it } from "vitest";
import { nextUtf8Boundary, previousUtf8Boundary, resolveDeleteRange } from "./inputPipeline";

describe("inputPipeline utf8 boundaries", () => {
  it("returns the utf8 document length when moving forward at the end of multibyte text", () => {
    const markdown = "a中";

    expect(nextUtf8Boundary(markdown, 4)).toBe(4);
  });

  it("returns the previous utf8 boundary for multibyte text", () => {
    const markdown = "a中";

    expect(previousUtf8Boundary(markdown, 4)).toBe(1);
  });

  it("returns a multibyte-safe backward delete range", () => {
    const markdown = "a中🙂";

    expect(resolveDeleteRange(markdown, { start_utf8: 8, end_utf8: 8 }, "backward")).toEqual({
      startUtf8: 4,
      endUtf8: 8
    });
  });

  it("returns a multibyte-safe forward delete range", () => {
    const markdown = "a中🙂";

    expect(resolveDeleteRange(markdown, { start_utf8: 1, end_utf8: 1 }, "forward")).toEqual({
      startUtf8: 1,
      endUtf8: 4
    });
  });

  it("returns null for backward delete at the start of the document", () => {
    expect(resolveDeleteRange("中", { start_utf8: 0, end_utf8: 0 }, "backward")).toBeNull();
  });

  it("returns null for forward delete at the end of the document", () => {
    expect(resolveDeleteRange("中", { start_utf8: 3, end_utf8: 3 }, "forward")).toBeNull();
  });

  it("keeps explicit selections as-is for delete operations", () => {
    expect(resolveDeleteRange("hello", { start_utf8: 1, end_utf8: 4 }, "backward")).toEqual({
      startUtf8: 1,
      endUtf8: 4
    });
  });
});
