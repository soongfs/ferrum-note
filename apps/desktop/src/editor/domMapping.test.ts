import { describe, expect, it } from "vitest";
import {
  codeUnitOffsetForUtf8,
  serializeWriterMarkdownFromBlocks,
  sliceByUtf8Offsets
} from "./domMapping";

const encoder = new TextEncoder();

describe("domMapping utf8 helpers", () => {
  it("converts utf8 offsets to utf16 slice ranges", () => {
    const markdown = "中a段落";

    expect(codeUnitOffsetForUtf8(markdown, 3)).toBe(1);
    expect(codeUnitOffsetForUtf8(markdown, 4)).toBe(2);
  });

  it("slices markdown using utf8 offsets without corrupting multibyte content", () => {
    const markdown = "前缀\n中a段落\n尾部";

    expect(sliceByUtf8Offsets(markdown, 7, 14)).toBe("中a段");
  });

  it("rebuilds markdown from block slices while preserving untouched separators", () => {
    const markdown = "第一段\n\n第二段\n\n尾部";
    const blocks = [
      {
        startUtf8: 0,
        endUtf8: encoder.encode("第一段").length,
        text: "第一段"
      },
      {
        startUtf8: encoder.encode("第一段\n\n").length,
        endUtf8: encoder.encode("第一段\n\n第二段").length,
        text: "第二🙂段"
      }
    ];

    expect(serializeWriterMarkdownFromBlocks(markdown, blocks)).toBe("第一段\n\n第二🙂段\n\n尾部");
  });

  it("supports empty writer blocks without corrupting multibyte offsets", () => {
    const markdown = "标题\n\n内容";
    const blocks = [
      {
        startUtf8: 0,
        endUtf8: encoder.encode("标题").length,
        text: "标题"
      },
      {
        startUtf8: encoder.encode("标题\n\n").length,
        endUtf8: encoder.encode("标题\n\n内容").length,
        text: ""
      }
    ];

    expect(serializeWriterMarkdownFromBlocks(markdown, blocks)).toBe("标题\n\n");
  });
});
