import { describe, expect, it } from "vitest";
import { nextUtf8Boundary, previousUtf8Boundary } from "./inputPipeline";

describe("inputPipeline utf8 boundaries", () => {
  it("returns the utf8 document length when moving forward at the end of multibyte text", () => {
    const markdown = "a中";

    expect(nextUtf8Boundary(markdown, 4)).toBe(4);
  });

  it("returns the previous utf8 boundary for multibyte text", () => {
    const markdown = "a中";

    expect(previousUtf8Boundary(markdown, 4)).toBe(1);
  });
});
