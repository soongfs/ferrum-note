import { marked } from "marked";
import TurndownService from "turndown";

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-"
});

export function markdownToHtml(markdown: string): string {
  return marked.parse(markdown) as string;
}

export function htmlToMarkdown(html: string): string {
  return turndown.turndown(html).trimEnd();
}
