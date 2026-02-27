import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, type Editor, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { common, createLowlight } from "lowlight";
import "highlight.js/styles/github.css";
import { FerrumCodeBlock } from "./FerrumCodeBlock";
import { CODE_LANGUAGE_PRESETS, normalizeCodeLanguage } from "./codeLanguage";
import { createMarkdownCodec } from "./markdownCodec";
import { SourceEditor } from "./SourceEditor";
import type { ActiveSyntaxLens, EditorMode } from "./types";

type EditorLabels = {
  placeholder: string;
  loading: string;
  bold: string;
  italic: string;
  heading: string;
  quote: string;
  codeBlock: string;
  bulletList: string;
  orderedList: string;
  undo: string;
  redo: string;
  language: string;
  languagePlaceholder: string;
  shortcutHint: string;
  sourceShortcutHint: string;
  syntaxLens: string;
  syntaxLensError: string;
};

type MarkdownEditorProps = {
  value: string;
  sourceValue: string;
  mode: EditorMode;
  onModeChange: (next: EditorMode) => void;
  onChange: (next: string) => void;
  onSourceChange: (next: string) => void;
  labels: EditorLabels;
};

function ToolbarButton({
  label,
  onClick,
  active,
  disabled
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`toolbar-button${active ? " is-active" : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
}

export function MarkdownEditor({
  value,
  sourceValue,
  mode,
  onModeChange,
  onChange,
  onSourceChange,
  labels
}: MarkdownEditorProps) {
  const applyingExternalUpdate = useRef(false);
  const [codeLanguage, setCodeLanguage] = useState("plaintext");
  const [activeSyntaxLens, setActiveSyntaxLens] = useState<ActiveSyntaxLens | null>(null);
  const [syntaxLensError, setSyntaxLensError] = useState("");
  const activeSyntaxLensRef = useRef<ActiveSyntaxLens | null>(null);
  const lowlight = useMemo(() => createLowlight(common), []);

  const syncEditorUiState = useCallback(
    (instance: Editor) => {
      const attrs = instance.getAttributes("codeBlock");
      const language = normalizeCodeLanguage(String(attrs.language || ""));
      setCodeLanguage(language);

      if (mode !== "writer") {
        setActiveSyntaxLens(null);
        setSyntaxLensError("");
        return;
      }

      const { $from } = instance.state.selection;
      if ($from.depth < 1) {
        setActiveSyntaxLens(null);
        return;
      }

      const topLevelDepth = 1;
      const activeNode = $from.node(topLevelDepth);
      const blockFrom = $from.start(topLevelDepth) - 1;
      const blockTo = blockFrom + activeNode.nodeSize;
      const codec = createMarkdownCodec(instance.schema);
      const markdown = codec.serializeTopLevelNodes([activeNode]);

      setActiveSyntaxLens((current) => {
        if (
          current &&
          current.blockFrom === blockFrom &&
          current.blockTo === blockTo &&
          current.markdown === markdown &&
          current.visible
        ) {
          return current;
        }

        return {
          blockFrom,
          blockTo,
          markdown,
          visible: true
        };
      });
    },
    [mode]
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false
      }),
      FerrumCodeBlock.configure({
        lowlight
      }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: labels.placeholder })
    ],
    content: "<p></p>",
    onCreate({ editor: instance }) {
      const codec = createMarkdownCodec(instance.schema);
      applyingExternalUpdate.current = true;
      instance.commands.setContent(codec.parseMarkdown(value).toJSON(), false);
      applyingExternalUpdate.current = false;
      syncEditorUiState(instance);
    },
    onUpdate({ editor: instance }) {
      if (applyingExternalUpdate.current) {
        return;
      }

      const codec = createMarkdownCodec(instance.schema);
      onChange(codec.serializeMarkdown(instance.state.doc));
      syncEditorUiState(instance);
    }
  });

  useEffect(() => {
    activeSyntaxLensRef.current = activeSyntaxLens;
  }, [activeSyntaxLens]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const codec = createMarkdownCodec(editor.schema);
    const current = codec.serializeMarkdown(editor.state.doc);
    if (current !== value) {
      applyingExternalUpdate.current = true;
      editor.commands.setContent(codec.parseMarkdown(value).toJSON(), false);
      applyingExternalUpdate.current = false;
      syncEditorUiState(editor);
    }
  }, [editor, syncEditorUiState, value]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const handleSelection = () => {
      syncEditorUiState(editor);
    };

    editor.on("selectionUpdate", handleSelection);
    editor.on("focus", handleSelection);

    return () => {
      editor.off("selectionUpdate", handleSelection);
      editor.off("focus", handleSelection);
    };
  }, [editor, syncEditorUiState]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    syncEditorUiState(editor);
  }, [editor, mode, syncEditorUiState]);

  useEffect(() => {
    const onToggleMode = (event: KeyboardEvent) => {
      const isToggleKey =
        (event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "m";
      if (!isToggleKey) {
        return;
      }

      event.preventDefault();
      onModeChange(mode === "writer" ? "source" : "writer");
    };

    window.addEventListener("keydown", onToggleMode);
    return () => {
      window.removeEventListener("keydown", onToggleMode);
    };
  }, [mode, onModeChange]);

  const applySyntaxLensMarkdown = useCallback(
    (nextMarkdown: string) => {
      setActiveSyntaxLens((current) =>
        current
          ? {
              ...current,
              markdown: nextMarkdown
            }
          : current
      );

      if (!editor) {
        return;
      }

      const lens = activeSyntaxLensRef.current;
      if (!lens || mode !== "writer") {
        return;
      }

      const codec = createMarkdownCodec(editor.schema);
      let replacementNodes;

      try {
        replacementNodes = codec.parseMarkdownToTopLevelNodes(nextMarkdown);
      } catch {
        setSyntaxLensError(labels.syntaxLensError);
        return;
      }

      if (replacementNodes.length !== 1) {
        setSyntaxLensError(labels.syntaxLensError);
        return;
      }

      applyingExternalUpdate.current = true;
      const transaction = editor.state.tr.replaceWith(
        lens.blockFrom,
        lens.blockTo,
        replacementNodes[0]
      );
      editor.view.dispatch(transaction);
      applyingExternalUpdate.current = false;

      setSyntaxLensError("");
      onChange(codec.serializeMarkdown(editor.state.doc));
      syncEditorUiState(editor);
    },
    [editor, labels.syntaxLensError, mode, onChange, syncEditorUiState]
  );

  if (!editor) {
    return <div className="editor-loading">{labels.loading}</div>;
  }

  if (mode === "source") {
    return (
      <section className="editor-shell" data-testid="editor-mode-source">
        <SourceEditor value={sourceValue} onChange={onSourceChange} />
        <p className="editor-shortcut-hint">{labels.sourceShortcutHint}</p>
      </section>
    );
  }

  return (
    <section className="editor-shell" data-testid="editor-mode-writer">
      <div className="editor-toolbar" aria-label="Writer toolbar">
        <ToolbarButton
          label={labels.bold}
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
        />
        <ToolbarButton
          label={labels.italic}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
        />
        <ToolbarButton
          label={labels.heading}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
        />
        <ToolbarButton
          label={labels.quote}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
        />
        <ToolbarButton
          label={labels.codeBlock}
          onClick={() => {
            const normalizedLanguage = normalizeCodeLanguage(codeLanguage);
            setCodeLanguage(normalizedLanguage);
            editor
              .chain()
              .focus()
              .toggleCodeBlock({
                language: normalizedLanguage
              })
              .run();
          }}
          active={editor.isActive("codeBlock")}
        />
        <label className="code-language-select-label">
          {labels.language}
          <input
            className="code-language-input"
            value={codeLanguage}
            placeholder={labels.languagePlaceholder}
            onChange={(event) => setCodeLanguage(normalizeCodeLanguage(event.target.value))}
            list="code-language-options"
            data-testid="code-language-input"
          />
          <datalist id="code-language-options">
            {CODE_LANGUAGE_PRESETS.map((language) => (
              <option key={language} value={language} />
            ))}
          </datalist>
        </label>
        <ToolbarButton
          label={labels.bulletList}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
        />
        <ToolbarButton
          label={labels.orderedList}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
        />
        <ToolbarButton
          label={labels.undo}
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        />
        <ToolbarButton
          label={labels.redo}
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        />
      </div>

      <EditorContent className="editor-content" editor={editor} />

      {activeSyntaxLens?.visible ? (
        <section className="syntax-lens" data-testid="syntax-lens-panel">
          <div className="syntax-lens-header">{labels.syntaxLens}</div>
          <textarea
            className="syntax-lens-input"
            value={activeSyntaxLens.markdown}
            onChange={(event) => applySyntaxLensMarkdown(event.target.value)}
            data-testid="syntax-lens-input"
          />
          {syntaxLensError ? <p className="syntax-lens-error">{syntaxLensError}</p> : null}
        </section>
      ) : null}

      <p className="editor-shortcut-hint">{labels.shortcutHint}</p>
    </section>
  );
}
