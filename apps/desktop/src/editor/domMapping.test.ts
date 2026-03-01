import { describe, expect, it } from "vitest";
import { codeUnitOffsetForUtf8, sliceByUtf8Offsets } from "./domMapping";

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
});
