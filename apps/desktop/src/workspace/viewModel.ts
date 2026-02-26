import type { WorkspaceEntry } from "../types/contracts";

export type DocumentStats = {
  words: number;
  characters: number;
  lines: number;
};

export function calculateDocumentStats(markdown: string): DocumentStats {
  const trimmed = markdown.trim();
  const words = trimmed ? trimmed.split(/\s+/u).filter(Boolean).length : 0;
  const characters = markdown.length;
  const lines = markdown === "" ? 1 : markdown.split(/\r?\n/u).length;

  return {
    words,
    characters,
    lines
  };
}

export function sortWorkspaceEntriesForView(entries: WorkspaceEntry[]): WorkspaceEntry[] {
  return [...entries].sort((left, right) => {
    const leftRank = left.kind === "directory" ? 0 : 1;
    const rightRank = right.kind === "directory" ? 0 : 1;

    return (
      leftRank - rightRank ||
      left.name.toLowerCase().localeCompare(right.name.toLowerCase()) ||
      left.name.localeCompare(right.name)
    );
  });
}
