import { useEffect, useMemo, useRef, useState } from "react";
import { loadAppConfig, openFile, saveAsFile, saveFile, watchFile } from "./api/bridge";
import { MarkdownEditor } from "./editor/MarkdownEditor";
import { countMatches, replaceAll, replaceNext } from "./search/ops";
import type { EditorSyncPayload } from "./types/contracts";

const INITIAL_DOC = `# FerrumNote\n\n开始编辑你的 Markdown 文档。`;

function App() {
  const [markdown, setMarkdown] = useState(INITIAL_DOC);
  const [activePath, setActivePath] = useState("");
  const [pathInput, setPathInput] = useState("");
  const [version, setVersion] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState("就绪");
  const [autosaveMs, setAutosaveMs] = useState(1500);
  const [query, setQuery] = useState("");
  const [replacement, setReplacement] = useState("");
  const previousMarkdown = useRef(INITIAL_DOC);

  useEffect(() => {
    loadAppConfig()
      .then((cfg) => setAutosaveMs(cfg.autosave_ms || 1500))
      .catch(() => {
        setAutosaveMs(1500);
      });
  }, []);

  const changedBlocks = useMemo(() => {
    const prev = previousMarkdown.current.split("\n\n");
    const next = markdown.split("\n\n");
    const size = Math.max(prev.length, next.length);
    const changed: string[] = [];

    for (let i = 0; i < size; i += 1) {
      if ((prev[i] || "") !== (next[i] || "")) {
        changed.push(`block-${i + 1}`);
      }
    }

    return changed;
  }, [markdown]);

  const matchCount = useMemo(() => countMatches(markdown, query), [markdown, query]);

  const syncPayload: EditorSyncPayload = {
    doc_id: activePath || "untitled",
    markdown,
    version,
    dirty,
    changed_blocks: changedBlocks
  };

  function updateDocument(next: string) {
    setMarkdown(next);
    setDirty(true);
  }

  async function handleOpen() {
    if (!pathInput.trim()) {
      setStatus("请输入文件路径后再打开");
      return;
    }

    try {
      const file = await openFile(pathInput.trim());
      setMarkdown(file.content);
      previousMarkdown.current = file.content;
      setActivePath(file.path);
      setPathInput(file.path);
      setVersion(file.version);
      setDirty(false);
      setStatus(`已打开: ${file.path}`);
      await watchFile(file.path);
    } catch (error) {
      setStatus(`打开失败: ${String(error)}`);
    }
  }

  async function handleSave() {
    if (!activePath) {
      setStatus("请先打开文档或使用另存为");
      return;
    }

    try {
      const saved = await saveFile(activePath, markdown, version);
      if (saved.conflict) {
        setStatus("保存冲突：文件已被外部修改，请重新加载");
        return;
      }

      setVersion(saved.version);
      setDirty(false);
      previousMarkdown.current = markdown;
      setStatus(`已保存: ${saved.path}`);
    } catch (error) {
      setStatus(`保存失败: ${String(error)}`);
    }
  }

  async function handleSaveAs() {
    const path = window.prompt("请输入另存为路径", activePath || pathInput || "");
    if (!path || !path.trim()) {
      return;
    }

    try {
      const saved = await saveAsFile(path.trim(), markdown);
      setActivePath(saved.path);
      setPathInput(saved.path);
      setVersion(saved.version);
      setDirty(false);
      previousMarkdown.current = markdown;
      setStatus(`已另存为: ${saved.path}`);
      await watchFile(saved.path);
    } catch (error) {
      setStatus(`另存为失败: ${String(error)}`);
    }
  }

  function handleReplaceNext() {
    if (!query) {
      setStatus("请输入查找内容");
      return;
    }

    const next = replaceNext(markdown, query, replacement);
    if (next === markdown) {
      setStatus("没有可替换内容");
      return;
    }

    updateDocument(next);
    setStatus("已替换下一个匹配项");
  }

  function handleReplaceAll() {
    if (!query) {
      setStatus("请输入查找内容");
      return;
    }

    const next = replaceAll(markdown, query, replacement);
    if (next === markdown) {
      setStatus("没有可替换内容");
      return;
    }

    updateDocument(next);
    setStatus("已执行全部替换");
  }

  useEffect(() => {
    if (!activePath || !dirty) {
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        const saved = await saveFile(activePath, markdown, version);
        if (saved.conflict) {
          setStatus("自动保存冲突：文件被外部修改");
          return;
        }

        setVersion(saved.version);
        setDirty(false);
        previousMarkdown.current = markdown;
        setStatus(`自动保存成功 (${new Date().toLocaleTimeString()})`);
      } catch (error) {
        setStatus(`自动保存失败: ${String(error)}`);
      }
    }, autosaveMs);

    return () => window.clearTimeout(timer);
  }, [activePath, autosaveMs, dirty, markdown, version]);

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>FerrumNote</h1>
        <p>Rust + Tauri + TipTap Markdown Editor</p>
      </header>

      <section className="file-bar">
        <input
          className="path-input"
          value={pathInput}
          onChange={(event) => setPathInput(event.target.value)}
          placeholder="输入 .md 文件路径，例如 /home/user/notes/today.md"
        />
        <button type="button" onClick={handleOpen}>
          打开
        </button>
        <button type="button" onClick={handleSave}>
          保存
        </button>
        <button type="button" onClick={handleSaveAs}>
          另存为
        </button>
      </section>

      <section className="search-bar">
        <input
          className="search-input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="查找"
        />
        <input
          className="search-input"
          value={replacement}
          onChange={(event) => setReplacement(event.target.value)}
          placeholder="替换为"
        />
        <button type="button" onClick={handleReplaceNext}>
          替换下一个
        </button>
        <button type="button" onClick={handleReplaceAll}>
          全部替换
        </button>
        <span className="search-meta">匹配: {matchCount}</span>
      </section>

      <MarkdownEditor value={markdown} onChange={updateDocument} />

      <section className="status-panel">
        <p>
          <strong>状态：</strong>
          {status}
        </p>
        <p>
          <strong>路径：</strong>
          {activePath || "未打开"}
        </p>
        <p>
          <strong>版本：</strong>
          {version}
        </p>
        <p>
          <strong>自动保存：</strong>
          {autosaveMs}ms
        </p>
      </section>

      <section className="markdown-preview-panel">
        <h2>EditorSyncPayload</h2>
        <pre>{JSON.stringify(syncPayload, null, 2)}</pre>
      </section>
    </main>
  );
}

export default App;
