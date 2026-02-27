import { getSchema } from "@tiptap/core";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Link from "@tiptap/extension-link";
import StarterKit from "@tiptap/starter-kit";
import { common, createLowlight } from "lowlight";
import { describe, expect, it } from "vitest";
import { normalizeCodeLanguage } from "./codeLanguage";
import { createMarkdownCodec } from "./markdownCodec";

const lowlight = createLowlight(common);
const schema = getSchema([
  StarterKit.configure({
    codeBlock: false
  }),
  CodeBlockLowlight.configure({
    lowlight
  }),
  Link
]);
const codec = createMarkdownCodec(schema);

describe("markdown codec round-trip", () => {
  it("keeps heading, quote, and list semantics", () => {
    const markdown = "# Title\n\n> quoted\n\n- one\n- two";
    const roundTrip = codec.serializeMarkdown(codec.parseMarkdown(markdown));

    expect(roundTrip).toContain("# Title");
    expect(roundTrip).toContain("> quoted");
    expect(roundTrip).toMatch(/-\s+one/);
    expect(roundTrip).toMatch(/-\s+two/);
  });

  it("keeps fenced code block language", () => {
    const markdown = '```rust\nfn main() {\n  println!("ok");\n}\n```';
    const roundTrip = codec.serializeMarkdown(codec.parseMarkdown(markdown));

    expect(roundTrip).toContain("```rust");
    expect(roundTrip).toContain("fn main()");
    expect(roundTrip).toContain("println!");
  });

  it("keeps link structure", () => {
    const markdown = "[FerrumNote](https://example.com)";
    const roundTrip = codec.serializeMarkdown(codec.parseMarkdown(markdown));

    expect(roundTrip).toContain("[FerrumNote]");
    expect(roundTrip).toContain("https://example.com");
  });

  it("supports top-level block parse and serialize", () => {
    const markdown = "## Part A\n\n- one\n- two\n\n```python\nprint('ok')\n```";
    const nodes = codec.parseMarkdownToTopLevelNodes(markdown);
    const serialized = codec.serializeTopLevelNodes(nodes);

    expect(nodes.length).toBeGreaterThan(2);
    expect(serialized).toContain("## Part A");
    expect(serialized).toContain("```python");
  });

  it("normalizes language aliases", () => {
    expect(normalizeCodeLanguage("py")).toBe("python");
    expect(normalizeCodeLanguage("c++")).toBe("cpp");
    expect(normalizeCodeLanguage("ts")).toBe("typescript");
    expect(normalizeCodeLanguage("")).toBe("plaintext");
  });
});
