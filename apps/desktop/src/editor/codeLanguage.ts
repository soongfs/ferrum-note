export const CODE_LANGUAGE_PRESETS = [
  "plaintext",
  "python",
  "c",
  "cpp",
  "rust",
  "typescript",
  "javascript",
  "bash",
  "json",
  "go",
  "java"
] as const;

const LANGUAGE_ALIAS_MAP: Record<string, string> = {
  py: "python",
  python3: "python",
  js: "javascript",
  ts: "typescript",
  "c++": "cpp",
  cxx: "cpp",
  shell: "bash",
  sh: "bash",
  plain: "plaintext",
  text: "plaintext"
};

export function normalizeCodeLanguage(input: string | null | undefined): string {
  const normalized = String(input || "")
    .trim()
    .toLowerCase();

  if (!normalized) {
    return "plaintext";
  }

  return LANGUAGE_ALIAS_MAP[normalized] || normalized;
}
