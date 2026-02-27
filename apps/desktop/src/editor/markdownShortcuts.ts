import { type EditorState, type Transaction } from "@codemirror/state";
import { normalizeCodeLanguage } from "./codeLanguage";

export type MarkdownShortcutCommand =
  | "toggleBold"
  | "toggleItalic"
  | "toggleInlineCode"
  | "toggleHeading2"
  | "toggleBlockquote"
  | "toggleBulletList"
  | "toggleOrderedList"
  | "toggleCodeFence";

export function applyMarkdownShortcut(
  command: MarkdownShortcutCommand,
  state: EditorState
): Transaction | null {
  switch (command) {
    case "toggleBold":
      return toggleWrap(state, "**", "**");
    case "toggleItalic":
      return toggleWrap(state, "*", "*");
    case "toggleInlineCode":
      return toggleWrap(state, "`", "`");
    case "toggleHeading2":
      return toggleLinePrefix(state, "## ");
    case "toggleBlockquote":
      return toggleLinePrefix(state, "> ");
    case "toggleBulletList":
      return toggleLinePrefix(state, "- ");
    case "toggleOrderedList":
      return toggleLinePrefix(state, "1. ");
    case "toggleCodeFence":
      return toggleCodeFence(state);
    default:
      return null;
  }
}

export function applyEnterBehavior(state: EditorState): Transaction | null {
  const selection = state.selection.main;
  if (!selection.empty) {
    return null;
  }

  const line = state.doc.lineAt(selection.head);
  if (selection.head !== line.to) {
    return null;
  }

  const trimmedLine = line.text.trim();
  if (/^`[^`\n]+`$/u.test(trimmedLine)) {
    return null;
  }

  if (line.text.startsWith("````")) {
    return null;
  }

  const backtickFenceMatch = line.text.match(/^```([a-z0-9_+.#-]+)?$/i);
  if (backtickFenceMatch) {
    const normalized = normalizeCodeLanguage(backtickFenceMatch[1]);
    const language = normalized === "plaintext" ? "" : normalized;
    const replacement = `\`\`\`${language}`;
    const hasExistingClosingFence = hasClosingFenceBelow(state, line.number);

    if (hasExistingClosingFence) {
      return null;
    }

    return state.update({
      changes: {
        from: line.from,
        to: line.to,
        insert: `${replacement}\n\n\`\`\``
      },
      selection: {
        anchor: line.from + replacement.length + 1
      },
      userEvent: "input"
    });
  }

  return null;
}

function hasClosingFenceBelow(state: EditorState, lineNumber: number): boolean {
  for (let index = lineNumber + 1; index <= state.doc.lines; index += 1) {
    const text = state.doc.line(index).text.trim();
    if (!text) {
      continue;
    }

    if (text === "```") {
      return true;
    }
  }

  return false;
}

function toggleWrap(state: EditorState, open: string, close: string): Transaction {
  const selection = state.selection.main;
  let { from, to } = selection;

  if (selection.empty) {
    const word = wordRangeAt(state, from);
    if (word) {
      from = word.from;
      to = word.to;
    }
  }

  const beforeFrom = from - open.length;
  const afterTo = to + close.length;
  const hasBefore = beforeFrom >= 0;
  const hasAfter = afterTo <= state.doc.length;
  const hasWrapper =
    hasBefore &&
    hasAfter &&
    state.doc.sliceString(beforeFrom, from) === open &&
    state.doc.sliceString(to, afterTo) === close;

  if (hasWrapper) {
    return state.update({
      changes: [
        { from: beforeFrom, to: from, insert: "" },
        { from: to, to: afterTo, insert: "" }
      ],
      selection: {
        anchor: from - open.length,
        head: to - open.length
      },
      userEvent: "input"
    });
  }

  if (from === to) {
    return state.update({
      changes: { from, to, insert: `${open}${close}` },
      selection: { anchor: from + open.length },
      userEvent: "input"
    });
  }

  return state.update({
    changes: [
      { from, to: from, insert: open },
      { from: to, to, insert: close }
    ],
    selection: {
      anchor: from + open.length,
      head: to + open.length
    },
    userEvent: "input"
  });
}

function toggleLinePrefix(state: EditorState, prefix: string): Transaction {
  const selection = state.selection.main;
  const line = state.doc.lineAt(selection.head);

  if (line.text.startsWith(prefix)) {
    return state.update({
      changes: {
        from: line.from,
        to: line.from + prefix.length,
        insert: ""
      },
      selection: {
        anchor: Math.max(line.from, selection.head - prefix.length)
      },
      userEvent: "input"
    });
  }

  if (prefix === "## ") {
    const normalized = line.text.replace(/^#{1,6}\s+/u, "");
    return state.update({
      changes: {
        from: line.from,
        to: line.to,
        insert: `${prefix}${normalized}`
      },
      selection: {
        anchor: selection.head + prefix.length
      },
      userEvent: "input"
    });
  }

  return state.update({
    changes: {
      from: line.from,
      to: line.from,
      insert: prefix
    },
    selection: {
      anchor: selection.head + prefix.length
    },
    userEvent: "input"
  });
}

function toggleCodeFence(state: EditorState): Transaction {
  const selection = state.selection.main;
  const { from, to } = selection;
  const selectedText = state.doc.sliceString(from, to);

  if (selectedText.startsWith("```") && selectedText.endsWith("```")) {
    const stripped = selectedText.replace(/^```[a-z0-9_+.#-]*\n?/iu, "").replace(/\n?```$/u, "");
    return state.update({
      changes: {
        from,
        to,
        insert: stripped
      },
      selection: {
        anchor: from,
        head: from + stripped.length
      },
      userEvent: "input"
    });
  }

  return state.update({
    changes: {
      from,
      to,
      insert: `\`\`\`\n${selectedText}\n\`\`\``
    },
    selection: {
      anchor: from + 4,
      head: from + 4 + selectedText.length
    },
    userEvent: "input"
  });
}

function wordRangeAt(state: EditorState, position: number): { from: number; to: number } | null {
  const line = state.doc.lineAt(position);
  const offset = position - line.from;
  const wordChars = /[A-Za-z0-9_]/u;

  let start = offset;
  let end = offset;

  while (start > 0 && wordChars.test(line.text[start - 1])) {
    start -= 1;
  }

  while (end < line.text.length && wordChars.test(line.text[end])) {
    end += 1;
  }

  if (start === end) {
    return null;
  }

  return {
    from: line.from + start,
    to: line.from + end
  };
}
