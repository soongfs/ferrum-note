import { describe, expect, it } from "vitest";
import { normalizeCodeLanguage } from "./codeLanguage";

describe("code language normalization", () => {
  it("normalizes common aliases", () => {
    expect(normalizeCodeLanguage("py")).toBe("python");
    expect(normalizeCodeLanguage("ts")).toBe("typescript");
    expect(normalizeCodeLanguage("js")).toBe("javascript");
    expect(normalizeCodeLanguage("c++")).toBe("cpp");
  });

  it("defaults to plaintext for empty input", () => {
    expect(normalizeCodeLanguage("")).toBe("plaintext");
    expect(normalizeCodeLanguage(undefined)).toBe("plaintext");
  });
});
