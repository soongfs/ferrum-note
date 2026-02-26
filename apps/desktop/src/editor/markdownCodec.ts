import MarkdownIt from "markdown-it";
import { type Mark, type Node as ProseMirrorNode, type Schema } from "@tiptap/pm/model";
import { MarkdownParser, MarkdownSerializer } from "@tiptap/pm/markdown";

export type MarkdownCodec = {
  parseMarkdown(markdown: string): ProseMirrorNode;
  serializeMarkdown(doc: ProseMirrorNode): string;
};

const markdownIt = new MarkdownIt("commonmark", { html: false });

export function createMarkdownCodec(schema: Schema): MarkdownCodec {
  const parser = new MarkdownParser(schema, markdownIt, {
    blockquote: { block: "blockquote" },
    paragraph: { block: "paragraph" },
    list_item: { block: "listItem" },
    bullet_list: { block: "bulletList" },
    ordered_list: {
      block: "orderedList",
      getAttrs: (token) => ({
        order: Number(token.attrGet("start") || 1)
      })
    },
    heading: {
      block: "heading",
      getAttrs: (token) => ({
        level: Number(token.tag.slice(1))
      })
    },
    code_block: { block: "codeBlock", noCloseToken: true },
    fence: {
      block: "codeBlock",
      getAttrs: (token) => ({
        language: token.info?.trim().split(/\s+/)[0] || null
      }),
      noCloseToken: true
    },
    hr: { node: "horizontalRule" },
    hardbreak: { node: "hardBreak" },
    em: { mark: "italic" },
    strong: { mark: "bold" },
    link: {
      mark: "link",
      getAttrs: (token) => ({
        href: token.attrGet("href"),
        title: token.attrGet("title") || null
      })
    },
    code_inline: { mark: "code", noCloseToken: true }
  });

  const serializer = new MarkdownSerializer(
    {
      blockquote(state, node) {
        state.wrapBlock("> ", null, node, () => state.renderContent(node));
      },
      codeBlock(state, node) {
        const backticks = node.textContent.match(/`{3,}/gm);
        const fence = backticks ? `${backticks.sort().slice(-1)[0]}\`` : "```";
        const language = String(node.attrs.language || "").trim();
        state.write(`${fence}${language}\n`);
        state.text(node.textContent, false);
        state.write("\n");
        state.write(fence);
        state.closeBlock(node);
      },
      heading(state, node) {
        state.write(`${state.repeat("#", node.attrs.level)} `);
        state.renderInline(node, false);
        state.closeBlock(node);
      },
      horizontalRule(state, node) {
        state.write("---");
        state.closeBlock(node);
      },
      bulletList(state, node) {
        state.renderList(node, "  ", () => "- ");
      },
      orderedList(state, node) {
        const start = Number(node.attrs.order || 1);
        const maxWidth = String(start + node.childCount - 1).length;
        const spacer = state.repeat(" ", maxWidth + 2);
        state.renderList(node, spacer, (index) => {
          const n = String(start + index);
          return `${state.repeat(" ", maxWidth - n.length)}${n}. `;
        });
      },
      listItem(state, node) {
        state.renderContent(node);
      },
      paragraph(state, node) {
        state.renderInline(node);
        state.closeBlock(node);
      },
      hardBreak(state, _node, parent, index) {
        for (let i = index + 1; i < parent.childCount; i += 1) {
          if (parent.child(i).type.name !== "hardBreak") {
            state.write("\\\n");
            return;
          }
        }
      },
      text(state, node) {
        state.text(node.text || "", false);
      }
    },
    {
      italic: { open: "*", close: "*", mixable: true, expelEnclosingWhitespace: true },
      bold: { open: "**", close: "**", mixable: true, expelEnclosingWhitespace: true },
      link: {
        open(_state, mark, parent, index) {
          return isPlainLink(mark, parent.child(index)) ? "<" : "[";
        },
        close(_state, mark, parent, index) {
          const current = parent.child(index - 1);
          if (isPlainLink(mark, current)) {
            return ">";
          }
          const href = String(mark.attrs.href || "").replace(/[()"]/g, "\\$&");
          const title = mark.attrs.title ? ` "${String(mark.attrs.title).replace(/"/g, '\\"')}"` : "";
          return `](${href}${title})`;
        },
        mixable: true
      },
      code: {
        open: (_state, _mark, parent, index) => inlineTicks(parent.child(index), -1),
        close: (_state, _mark, parent, index) => inlineTicks(parent.child(index - 1), 1),
        escape: false
      }
    }
  );

  return {
    parseMarkdown(markdown: string): ProseMirrorNode {
      return parser.parse(markdown || "");
    },
    serializeMarkdown(doc: ProseMirrorNode): string {
      return serializer.serialize(doc).trimEnd();
    }
  };
}

function inlineTicks(node: ProseMirrorNode, side: -1 | 1): string {
  if (!node?.isText) {
    return "`";
  }

  const ticks = node.text?.match(/`+/g) || [];
  const max = ticks.reduce((acc, token) => Math.max(acc, token.length), 0);
  let marker = max > 0 && side > 0 ? " `" : "`";
  for (let i = 0; i < max; i += 1) {
    marker += "`";
  }
  if (max > 0 && side < 0) {
    marker += " ";
  }
  return marker;
}

function isPlainLink(mark: Mark, content: ProseMirrorNode): boolean {
  if (mark.attrs.title || !/^\w+:/.test(String(mark.attrs.href || ""))) {
    return false;
  }

  return content.isText && content.text === mark.attrs.href;
}
