import { useEffect, useLayoutEffect, useRef } from "react";
import type { EngineCommandString, EngineSnapshot, RenderBlockVM } from "../engine/types";
import { readDomSelection, serializeWriterMarkdown } from "./domMapping";
import {
  nextUtf8Boundary,
  previousUtf8Boundary,
  resolveWriterIntent,
  resolveWriterShortcut
} from "./inputPipeline";
import { restoreDomSelection } from "./selectionMapping";

const encoder = new TextEncoder();

type WriterSurfaceProps = {
  ready: boolean;
  snapshot: EngineSnapshot | null;
  placeholder: string;
  loadingLabel: string;
  onReplaceText: (startUtf8: number, endUtf8: number, insert: string) => void;
  onSetSelection: (anchorUtf8: number, headUtf8: number) => void;
  onApplyCommand: (command: EngineCommandString) => void;
  onUndo: () => void;
  onRedo: () => void;
  onSetMarkdown: (markdown: string) => void;
};

export function WriterSurface({
  ready,
  snapshot,
  placeholder,
  loadingLabel,
  onReplaceText,
  onSetSelection,
  onApplyCommand,
  onUndo,
  onRedo,
  onSetMarkdown
}: WriterSurfaceProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const isComposing = useRef(false);

  useLayoutEffect(() => {
    if (!rootRef.current || !snapshot) {
      return;
    }

    const selection = window.getSelection();
    if (document.activeElement === rootRef.current || rootRef.current.contains(selection?.anchorNode ?? null)) {
      restoreDomSelection(rootRef.current, snapshot.selection);
    }
  }, [snapshot]);

  useEffect(() => {
    const onSelectionChange = () => {
      if (!rootRef.current || !snapshot) {
        return;
      }

      const offsets = readDomSelection(rootRef.current);
      if (!offsets || !hasSelectionChanged(offsets, snapshot.selection)) {
        return;
      }

      onSetSelection(offsets.anchor_utf8, offsets.head_utf8);
    };

    document.addEventListener("selectionchange", onSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", onSelectionChange);
    };
  }, [onSetSelection, snapshot]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !snapshot) {
      return;
    }

    const onBeforeInput = (event: InputEvent) => {
      if (isComposing.current) {
        return;
      }

      const intent = resolveWriterIntent(event.inputType);
      if (!intent) {
        return;
      }

      const offsets = readDomSelection(root);
      if (!offsets) {
        return;
      }

      switch (intent) {
        case "insert_text": {
          event.preventDefault();
          onReplaceText(offsets.start_utf8, offsets.end_utf8, event.data ?? "");
          return;
        }
        case "delete_backward": {
          event.preventDefault();
          const start =
            offsets.start_utf8 === offsets.end_utf8
              ? previousUtf8Boundary(snapshot.markdown, offsets.start_utf8)
              : offsets.start_utf8;
          onReplaceText(start, offsets.end_utf8, "");
          return;
        }
        case "delete_forward": {
          event.preventDefault();
          const end =
            offsets.start_utf8 === offsets.end_utf8
              ? nextUtf8Boundary(snapshot.markdown, offsets.end_utf8)
              : offsets.end_utf8;
          onReplaceText(offsets.start_utf8, end, "");
          return;
        }
        case "history_undo":
          event.preventDefault();
          onUndo();
          return;
        case "history_redo":
          event.preventDefault();
          onRedo();
          return;
        case "insert_paragraph": {
          event.preventDefault();
          onReplaceText(offsets.start_utf8, offsets.end_utf8, "\n");
          return;
        }
        case "insert_from_paste":
        default:
          return;
      }
    };

    const onInput = () => {
      if (!isComposing.current) {
        return;
      }

      const nextMarkdown = serializeWriterMarkdown(root, snapshot.markdown);
      if (nextMarkdown !== snapshot.markdown) {
        onSetMarkdown(nextMarkdown);
      }

      const offsets = readDomSelection(root);
      if (offsets && hasSelectionChanged(offsets, snapshot.selection)) {
        onSetSelection(offsets.anchor_utf8, offsets.head_utf8);
      }
    };

    const onPaste = (event: ClipboardEvent) => {
      const text = event.clipboardData?.getData("text/plain");
      const offsets = readDomSelection(root);
      if (!text || !offsets) {
        return;
      }

      event.preventDefault();
      onReplaceText(offsets.start_utf8, offsets.end_utf8, text);
    };

    const onCompositionStart = () => {
      isComposing.current = true;
    };

    const onCompositionEnd = () => {
      const nextMarkdown = serializeWriterMarkdown(root, snapshot.markdown);
      const offsets = readDomSelection(root);
      isComposing.current = false;

      if (nextMarkdown !== snapshot.markdown) {
        onSetMarkdown(nextMarkdown);
      }

      if (offsets && hasSelectionChanged(offsets, snapshot.selection)) {
        onSetSelection(offsets.anchor_utf8, offsets.head_utf8);
      }
    };

    root.addEventListener("beforeinput", onBeforeInput);
    root.addEventListener("input", onInput);
    root.addEventListener("paste", onPaste);
    root.addEventListener("compositionstart", onCompositionStart);
    root.addEventListener("compositionend", onCompositionEnd);

    return () => {
      root.removeEventListener("beforeinput", onBeforeInput);
      root.removeEventListener("input", onInput);
      root.removeEventListener("paste", onPaste);
      root.removeEventListener("compositionstart", onCompositionStart);
      root.removeEventListener("compositionend", onCompositionEnd);
    };
  }, [onRedo, onReplaceText, onSetMarkdown, onSetSelection, onUndo, snapshot]);

  if (!ready || !snapshot) {
    return <div className="writer-loading">{loadingLabel}</div>;
  }

  const blocks = snapshot.blocks.length ? snapshot.blocks : [createPlaceholderBlock(placeholder)];

  return (
    <div className="writer-surface-shell">
      <div
        ref={rootRef}
        className="writer-surface"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        tabIndex={0}
        data-testid="writer-surface"
        data-doc-end={encoder.encode(snapshot.markdown).length}
        onKeyDown={(event) => {
          const command = resolveWriterShortcut(event.nativeEvent);
          if (!command) {
            return;
          }

          event.preventDefault();
          if (command === "undo") {
            onUndo();
            return;
          }
          if (command === "redo") {
            onRedo();
            return;
          }
          onApplyCommand(command);
        }}
      >
        {blocks.map((block, index) => renderBlock(block, index))}
      </div>
    </div>
  );
}

function renderBlock(block: RenderBlockVM, index: number) {
  const rawMarkdown = block.attrs.raw_markdown ?? block.children.map((child) => child.text ?? "").join("");
  const isEmpty = rawMarkdown.length === 0;
  const leafText = isEmpty ? "\u200b" : rawMarkdown;
  const headingLevelClass =
    block.kind === "heading" && block.attrs.heading_level
      ? ` writer-block--heading-${block.attrs.heading_level}`
      : "";

  return (
    <div
      key={`${block.node_id}-${index}`}
      className={`writer-block writer-block--${block.kind}${headingLevelClass}`}
      data-block="true"
      data-kind={block.kind}
      data-node-id={block.node_id}
      data-start={block.attrs.start_utf8 ?? 0}
      data-end={block.attrs.end_utf8 ?? block.attrs.start_utf8 ?? 0}
      data-testid={`writer-block-${index}`}
    >
      {block.kind === "fenced_code" && block.attrs.language ? (
        <div className="writer-block-badge">{block.attrs.language}</div>
      ) : null}
      <span
        className="writer-leaf"
        data-leaf="true"
        data-start={block.attrs.start_utf8 ?? 0}
        data-end={block.attrs.end_utf8 ?? block.attrs.start_utf8 ?? 0}
        data-empty={isEmpty ? "true" : "false"}
      >
        {leafText}
      </span>
    </div>
  );
}

function createPlaceholderBlock(placeholder: string): RenderBlockVM {
  return {
    node_id: 0,
    kind: "paragraph",
    children: [],
    attrs: {
      start_utf8: 0,
      end_utf8: 0,
      raw_markdown: placeholder
    }
  };
}

function hasSelectionChanged(
  nextSelection: { anchor_utf8: number; head_utf8: number },
  currentSelection: EngineSnapshot["selection"]
) {
  return (
    nextSelection.anchor_utf8 !== currentSelection.anchor_utf8 ||
    nextSelection.head_utf8 !== currentSelection.head_utf8
  );
}
