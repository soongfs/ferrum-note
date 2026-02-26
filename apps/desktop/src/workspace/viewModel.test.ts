import { describe, expect, it } from "vitest";
import { calculateDocumentStats, sortWorkspaceEntriesForView } from "./viewModel";

describe("workspace view model", () => {
  it("calculates markdown stats for words characters and lines", () => {
    const stats = calculateDocumentStats("# Title\n\nHello FerrumNote");
    expect(stats).toEqual({
      words: 4,
      characters: 25,
      lines: 3
    });
  });

  it("sorts explorer entries with directories first", () => {
    const sorted = sortWorkspaceEntriesForView([
      {
        name: "z-note.md",
        relative_path: "z-note.md",
        absolute_path: "/workspace/z-note.md",
        kind: "markdown",
        modified_at: 1
      },
      {
        name: "alpha",
        relative_path: "alpha",
        absolute_path: "/workspace/alpha",
        kind: "directory",
        modified_at: 1
      },
      {
        name: "A-note.md",
        relative_path: "A-note.md",
        absolute_path: "/workspace/A-note.md",
        kind: "markdown",
        modified_at: 1
      }
    ]);

    expect(sorted.map((entry) => entry.name)).toEqual(["alpha", "A-note.md", "z-note.md"]);
  });
});
