import { useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { createMarkdownCodec } from "./markdownCodec";

type MarkdownEditorProps = {
  value: string;
  onChange: (next: string) => void;
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

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const applyingExternalUpdate = useRef(false);
  const [codeLanguage, setCodeLanguage] = useState("plaintext");
  const lowlight = useMemo(() => createLowlight(common), []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false
      }),
      CodeBlockLowlight.configure({
        lowlight
      }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "开始输入 Markdown 内容..." })
    ],
    content: "<p></p>",
    onCreate({ editor: instance }) {
      const codec = createMarkdownCodec(instance.schema);
      applyingExternalUpdate.current = true;
      instance.commands.setContent(codec.parseMarkdown(value).toJSON(), false);
      applyingExternalUpdate.current = false;
    },
    onUpdate({ editor: instance }) {
      if (applyingExternalUpdate.current) {
        return;
      }
      const codec = createMarkdownCodec(instance.schema);
      onChange(codec.serializeMarkdown(instance.state.doc));
    }
  });

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
    }
  }, [editor, value]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const syncLanguage = () => {
      const attrs = editor.getAttributes("codeBlock");
      if (attrs.language) {
        setCodeLanguage(attrs.language as string);
      }
    };

    editor.on("selectionUpdate", syncLanguage);
    return () => {
      editor.off("selectionUpdate", syncLanguage);
    };
  }, [editor]);

  if (!editor) {
    return <div className="editor-loading">编辑器加载中...</div>;
  }

  return (
    <section className="editor-shell">
      <div className="editor-toolbar" aria-label="文本工具栏">
        <ToolbarButton
          label="粗体"
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
        />
        <ToolbarButton
          label="斜体"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
        />
        <ToolbarButton
          label="标题"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
        />
        <ToolbarButton
          label="引用"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
        />
        <ToolbarButton
          label="代码块"
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleCodeBlock({
                language: codeLanguage
              })
              .run()
          }
          active={editor.isActive("codeBlock")}
        />
        <label className="code-language-select-label">
          语言
          <select
            className="code-language-select"
            value={codeLanguage}
            onChange={(event) => setCodeLanguage(event.target.value)}
          >
            <option value="plaintext">Plain Text</option>
            <option value="rust">Rust</option>
            <option value="typescript">TypeScript</option>
            <option value="javascript">JavaScript</option>
            <option value="bash">Bash</option>
            <option value="json">JSON</option>
          </select>
        </label>
        <ToolbarButton
          label="无序列表"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
        />
        <ToolbarButton
          label="有序列表"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
        />
        <ToolbarButton
          label="撤销"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        />
        <ToolbarButton
          label="重做"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        />
      </div>
      <EditorContent className="editor-content" editor={editor} />
      <p className="editor-shortcut-hint">快捷键：Ctrl/Cmd+B 粗体，Ctrl/Cmd+I 斜体，Ctrl/Cmd+Z 撤销。</p>
    </section>
  );
}
