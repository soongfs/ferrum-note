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
