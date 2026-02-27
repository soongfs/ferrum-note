import { describe, expect, it } from "vitest";
import { calculateDocumentStats } from "./viewModel";

describe("workspace view model", () => {
  it("calculates markdown stats for words characters and lines", () => {
    const stats = calculateDocumentStats("# Title\n\nHello FerrumNote");
    expect(stats).toEqual({
      words: 4,
      characters: 25,
      lines: 3
    });
  });
});
