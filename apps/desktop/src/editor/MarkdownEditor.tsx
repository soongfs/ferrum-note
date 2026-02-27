import { useEffect, useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { defaultHighlightStyle, syntaxHighlighting } from "@codemirror/language";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
  redo,
  undo
} from "@codemirror/commands";
import { type EditorView, keymap, placeholder } from "@codemirror/view";
import { Prec } from "@codemirror/state";
import { DEFAULT_WRITER_MARKER_POLICY, type EditorMode } from "./types";
import { createWriterMarkerDecorations } from "./markerDecorations";
import { CODE_LANGUAGE_SUPPORTS } from "./codeLanguageSupport";
import {
  applyEnterBehavior,
  applyMarkdownShortcut,
  type MarkdownShortcutCommand
} from "./markdownShortcuts";

type EditorLabels = {
  placeholder: string;
  loading: string;
  shortcutHint: string;
  sourceShortcutHint: string;
};

type MarkdownEditorProps = {
  value: string;
  mode: EditorMode;
  onModeToggle: () => void;
  onChange: (next: string) => void;
  labels: EditorLabels;
};

export function MarkdownEditor({ value, mode, onModeToggle, onChange, labels }: MarkdownEditorProps) {
  useEffect(() => {
    const onToggleMode = (event: KeyboardEvent) => {
      const isToggleKey =
        (event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "m";

      if (!isToggleKey) {
        return;
      }

      event.preventDefault();
      onModeToggle();
    };

    window.addEventListener("keydown", onToggleMode);
    return () => {
      window.removeEventListener("keydown", onToggleMode);
    };
  }, [onModeToggle]);

  const extensions = useMemo(() => {
    const sharedExtensions = [
      markdown({
        codeLanguages: CODE_LANGUAGE_SUPPORTS
      }),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      history(),
      Prec.highest(
        keymap.of([
          {
            key: "Enter",
            run: (view) => {
              const transaction = applyEnterBehavior(view.state);
              if (!transaction) {
                return false;
              }

              view.dispatch(transaction);
              return true;
            }
          },
          {
            key: "Mod-Shift-m",
            run: () => {
              onModeToggle();
              return true;
            }
          },
          {
            key: "Mod-b",
            run: (view) => runShortcut(view, "toggleBold")
          },
          {
            key: "Mod-i",
            run: (view) => runShortcut(view, "toggleItalic")
          },
          {
            key: "Mod-`",
            run: (view) => runShortcut(view, "toggleInlineCode")
          },
          {
            key: "Mod-Alt-2",
            run: (view) => runShortcut(view, "toggleHeading2")
          },
          {
            key: "Mod-Shift-7",
            run: (view) => runShortcut(view, "toggleOrderedList")
          },
          {
            key: "Mod-Shift-8",
            run: (view) => runShortcut(view, "toggleBulletList")
          },
          {
            key: "Mod-Shift-9",
            run: (view) => runShortcut(view, "toggleBlockquote")
          },
          {
            key: "Mod-Alt-c",
            run: (view) => runShortcut(view, "toggleCodeFence")
          },
          {
            key: "Mod-z",
            run: (view) => {
              undo(view);
              return true;
            }
          },
          {
            key: "Mod-Shift-z",
            run: (view) => {
              redo(view);
              return true;
            }
          }
        ])
      ),
      keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab])
    ];

    if (mode === "writer") {
      return [
        ...sharedExtensions,
        createWriterMarkerDecorations(DEFAULT_WRITER_MARKER_POLICY),
        placeholder(labels.placeholder)
      ];
    }

    return [...sharedExtensions, placeholder(labels.placeholder)];
  }, [labels.placeholder, mode, onModeToggle]);

  return (
    <section className="editor-shell" data-testid={`editor-mode-${mode}`}>
      <CodeMirror
        value={value}
        height="520px"
        extensions={extensions}
        onChange={(nextValue) => onChange(nextValue)}
        basicSetup={{
          lineNumbers: mode === "source",
          foldGutter: mode === "source",
          highlightActiveLine: mode === "source",
          highlightActiveLineGutter: mode === "source",
          searchKeymap: true,
          history: false,
          defaultKeymap: false,
          drawSelection: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: false
        }}
        className={`markdown-editor markdown-editor--${mode}`}
      />
      <p className="editor-shortcut-hint">
        {mode === "source" ? labels.sourceShortcutHint : labels.shortcutHint}
      </p>
    </section>
  );
}

function runShortcut(view: EditorView, command: MarkdownShortcutCommand): boolean {
  const transaction = applyMarkdownShortcut(command, view.state);
  if (!transaction) {
    return false;
  }

  view.dispatch(transaction);
  return true;
}
