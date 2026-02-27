import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { EditorView } from "@codemirror/view";

type SourceEditorProps = {
  value: string;
  onChange: (next: string) => void;
};

export function SourceEditor({ value, onChange }: SourceEditorProps) {
  return (
    <section className="source-editor-shell">
      <CodeMirror
        value={value}
        height="520px"
        extensions={[markdown(), EditorView.lineWrapping]}
        onChange={(nextValue) => onChange(nextValue)}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          highlightActiveLine: false,
          highlightActiveLineGutter: false
        }}
        className="source-editor"
      />
    </section>
  );
}
