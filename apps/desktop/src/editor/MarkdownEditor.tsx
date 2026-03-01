import { useEffect, useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { defaultHighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { keymap, placeholder } from "@codemirror/view";
import { Prec } from "@codemirror/state";
import { CODE_LANGUAGE_SUPPORTS } from "./codeLanguageSupport";
import { applyEnterBehavior } from "./markdownShortcuts";
import type { EditorMode } from "./types";
import { WriterSurface } from "./WriterSurface";
import { useEngine } from "../engine/useEngine";

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
  const engine = useEngine(value, onChange);

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

  const sourceExtensions = useMemo(
    () => [
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
          }
        ])
      ),
      keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
      placeholder(labels.placeholder)
    ],
    [labels.placeholder]
  );

  return (
    <section className="editor-shell" data-testid={`editor-mode-${mode}`}>
      {mode === "source" ? (
        <CodeMirror
          value={value}
          height="520px"
          extensions={sourceExtensions}
          onChange={(nextValue) => onChange(nextValue)}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            highlightActiveLine: true,
            highlightActiveLineGutter: true,
            searchKeymap: true,
            history: false,
            defaultKeymap: false,
            drawSelection: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: false
          }}
          className="markdown-editor markdown-editor--source"
        />
      ) : (
        <WriterSurface
          ready={engine.ready}
          snapshot={engine.snapshot}
          placeholder={labels.placeholder}
          loadingLabel={engine.error || labels.loading}
          onReplaceText={(startUtf8, endUtf8, insert) => {
            engine.replaceText(startUtf8, endUtf8, insert);
          }}
          onSetSelection={(anchorUtf8, headUtf8) => {
            engine.setSelection(anchorUtf8, headUtf8);
          }}
          onApplyCommand={(command) => {
            engine.applyCommand(command);
          }}
          onUndo={() => {
            engine.undo();
          }}
          onRedo={() => {
            engine.redo();
          }}
          onSetMarkdown={(markdownValue) => {
            engine.setMarkdown(markdownValue);
          }}
        />
      )}
      <p className="editor-shortcut-hint">
        {mode === "source" ? labels.sourceShortcutHint : labels.shortcutHint}
      </p>
    </section>
  );
}
