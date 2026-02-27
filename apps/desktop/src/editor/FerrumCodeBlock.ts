import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { mergeAttributes, textblockTypeInputRule } from "@tiptap/core";
import { normalizeCodeLanguage } from "./codeLanguage";

const backtickInputRegex = /^```([a-z0-9_+.#-]+)?[\s\n]$/i;
const tildeInputRegex = /^~~~([a-z0-9_+.#-]+)?[\s\n]$/i;

export const FerrumCodeBlock = CodeBlockLowlight.extend({
  renderHTML({ node, HTMLAttributes }) {
    const language = normalizeCodeLanguage(String(node.attrs.language || ""));
    const cssClass =
      language === "plaintext" ? null : `${this.options.languageClassPrefix}${language}`;

    return [
      "pre",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { "data-language": language }),
      ["code", { class: cssClass }, 0]
    ];
  },

  addInputRules() {
    return [
      textblockTypeInputRule({
        find: backtickInputRegex,
        type: this.type,
        getAttributes: (match) => ({
          language: normalizeCodeLanguage(match[1])
        })
      }),
      textblockTypeInputRule({
        find: tildeInputRegex,
        type: this.type,
        getAttributes: (match) => ({
          language: normalizeCodeLanguage(match[1])
        })
      })
    ];
  }
});
