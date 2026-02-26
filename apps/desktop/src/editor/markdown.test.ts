import { describe, expect, it } from "vitest";
import { htmlToMarkdown, markdownToHtml } from "./markdown";

describe("markdown round-trip", () => {
  it("keeps heading and list semantics", () => {
    const markdown = "# Title\n\n- one\n- two";
    const roundTrip = htmlToMarkdown(markdownToHtml(markdown));

    expect(roundTrip).toContain("# Title");
    expect(roundTrip).toMatch(/-\s+one/);
    expect(roundTrip).toMatch(/-\s+two/);
  });

  it("keeps fenced code blocks", () => {
    const markdown = "```rust\nfn main() {\n  println!(\"ok\");\n}\n```";
    const roundTrip = htmlToMarkdown(markdownToHtml(markdown));

    expect(roundTrip).toContain("```");
    expect(roundTrip).toContain("fn main()");
  });

  it("keeps link content", () => {
    const markdown = "[FerrumNote](https://example.com)";
    const roundTrip = htmlToMarkdown(markdownToHtml(markdown));

    expect(roundTrip).toContain("[FerrumNote]");
    expect(roundTrip).toContain("https://example.com");
  });
});
