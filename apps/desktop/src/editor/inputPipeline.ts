import type { EngineCommandString, WriterInputIntent } from "../engine/types";

const encoder = new TextEncoder();

export function resolveWriterIntent(inputType: string): WriterInputIntent | null {
  switch (inputType) {
    case "insertText":
    case "insertCompositionText":
      return "insert_text";
    case "deleteContentBackward":
      return "delete_backward";
    case "deleteContentForward":
      return "delete_forward";
    case "insertParagraph":
    case "insertLineBreak":
      return "insert_paragraph";
    case "insertFromPaste":
      return "insert_from_paste";
    case "historyUndo":
      return "history_undo";
    case "historyRedo":
      return "history_redo";
    default:
      return null;
  }
}

export function resolveWriterShortcut(event: KeyboardEvent): EngineCommandString | null {
  const mod = event.ctrlKey || event.metaKey;
  if (!mod) {
    return null;
  }

  const key = event.key.toLowerCase();

  if (key === "b") {
    return "toggle_strong";
  }

  if (key === "i") {
    return "toggle_emphasis";
  }

  if (key === "`") {
    return "toggle_inline_code";
  }

  if (key === "z" && event.shiftKey) {
    return "redo";
  }

  if (key === "z") {
    return "undo";
  }

  if (key === "7" && event.shiftKey) {
    return "toggle_ordered_list";
  }

  if (key === "8" && event.shiftKey) {
    return "toggle_bullet_list";
  }

  if (key === "9" && event.shiftKey) {
    return "toggle_blockquote";
  }

  if (key === "2" && event.altKey) {
    return "toggle_heading:2";
  }

  if (key === "c" && event.altKey) {
    return "insert_fence";
  }

  return null;
}

export function previousUtf8Boundary(markdown: string, utf8Offset: number): number {
  let boundary = 0;
  for (const character of markdown) {
    const nextBoundary = boundary + encoder.encode(character).length;
    if (nextBoundary >= utf8Offset) {
      return boundary;
    }
    boundary = nextBoundary;
  }
  return boundary;
}

export function nextUtf8Boundary(markdown: string, utf8Offset: number): number {
  let boundary = 0;
  for (const character of markdown) {
    boundary += encoder.encode(character).length;
    if (boundary > utf8Offset) {
      return boundary;
    }
  }
  return boundary;
}
