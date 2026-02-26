import { useState } from "react";
import { MarkdownEditor } from "./editor/MarkdownEditor";

const INITIAL_DOC = `# FerrumNote\n\n这是一个 Typora 风格编辑器 MVP。\n\n- 支持实时编辑\n- 支持列表与代码块\n\n\`\`\`rust\nfn main() {\n    println!(\"hello\");\n}\n\`\`\``;

function App() {
  const [markdown, setMarkdown] = useState(INITIAL_DOC);

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>FerrumNote</h1>
        <p>Rust + Tauri + TipTap Markdown Editor</p>
      </header>
      <MarkdownEditor value={markdown} onChange={setMarkdown} />
      <section className="markdown-preview-panel">
        <h2>Markdown Snapshot</h2>
        <pre>{markdown}</pre>
      </section>
    </main>
  );
}

export default App;
