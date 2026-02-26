import { useEffect, useMemo, useRef, useState } from "react";
import {
  exportHtml,
  exportPdf,
  loadAppConfig,
  openFile,
  saveAsFile,
  saveFile,
  watchFile
} from "./api/bridge";
import { resolveMessages } from "./i18n/messages";
import { MarkdownEditor } from "./editor/MarkdownEditor";
import { countMatches, replaceAll, replaceNext } from "./search/ops";
import {
  DesktopOnlyError,
  detectRuntimeMode,
  getRuntimeCapabilities
} from "./runtime/capabilities";
import type { EditorSyncPayload } from "./types/contracts";

const INITIAL_DOC = `# FerrumNote\n\nStart writing your Markdown notes.`;

function App() {
  const [markdown, setMarkdown] = useState(INITIAL_DOC);
  const [activePath, setActivePath] = useState("");
  const [pathInput, setPathInput] = useState("");
  const [version, setVersion] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [autosaveMs, setAutosaveMs] = useState(1500);
  const [query, setQuery] = useState("");
  const [replacement, setReplacement] = useState("");
  const [uiLanguage, setUiLanguage] = useState("en");
  const [showDebugPanels, setShowDebugPanels] = useState(false);
  const previousMarkdown = useRef(INITIAL_DOC);

  const runtimeMode = useMemo(() => detectRuntimeMode(), []);
  const runtimeCapabilities = useMemo(() => getRuntimeCapabilities(runtimeMode), [runtimeMode]);
  const messages = useMemo(() => resolveMessages(uiLanguage), [uiLanguage]);

  useEffect(() => {
    loadAppConfig()
      .then((cfg) => {
        setAutosaveMs(cfg.autosave_ms || 1500);
        setUiLanguage(cfg.ui_language || "en");
        setShowDebugPanels(Boolean(cfg.show_debug_panels));
      })
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

  function toStatus(errorPrefix: string, error: unknown): string {
    if (error instanceof DesktopOnlyError) {
      return error.message;
    }
    return `${errorPrefix}: ${String(error)}`;
  }

  async function handleOpen() {
    if (!runtimeCapabilities.fileIO) {
      setStatus(messages.app.desktopModeNotice);
      return;
    }

    if (!pathInput.trim()) {
      setStatus(messages.app.enterPathHint);
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
      setStatus(`Opened: ${file.path}`);
      if (runtimeCapabilities.fileWatch) {
        await watchFile(file.path);
      }
    } catch (error) {
      setStatus(toStatus(messages.app.openFailed, error));
    }
  }

  async function handleSave() {
    if (!runtimeCapabilities.fileIO) {
      setStatus(messages.app.desktopModeNotice);
      return;
    }

    if (!activePath) {
      setStatus(messages.app.saveNeedFileHint);
      return;
    }

    try {
      const saved = await saveFile(activePath, markdown, version);
      if (saved.conflict) {
        setStatus(messages.app.saveConflict);
        return;
      }

      setVersion(saved.version);
      setDirty(false);
      previousMarkdown.current = markdown;
      setStatus(`Saved: ${saved.path}`);
    } catch (error) {
      setStatus(toStatus(messages.app.saveFailed, error));
    }
  }

  async function handleSaveAs() {
    if (!runtimeCapabilities.fileIO) {
      setStatus(messages.app.desktopModeNotice);
      return;
    }

    const path = window.prompt(messages.app.saveAs, activePath || pathInput || "");
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
      setStatus(`Saved as: ${saved.path}`);
      if (runtimeCapabilities.fileWatch) {
        await watchFile(saved.path);
      }
    } catch (error) {
      setStatus(toStatus(messages.app.saveAsFailed, error));
    }
  }

  async function handleExportHtml() {
    if (!runtimeCapabilities.export) {
      setStatus(messages.app.desktopModeNotice);
      return;
    }

    const output = window.prompt(messages.app.exportHtml, activePath ? `${activePath}.html` : "");
    if (!output || !output.trim()) {
      return;
    }

    try {
      const exported = await exportHtml(output.trim(), markdown);
      setStatus(`HTML exported: ${exported.output_path}`);
    } catch (error) {
      setStatus(toStatus(messages.app.exportHtmlFailed, error));
    }
  }

  async function handleExportPdf() {
    if (!runtimeCapabilities.export) {
      setStatus(messages.app.desktopModeNotice);
      return;
    }

    const output = window.prompt(messages.app.exportPdf, activePath ? `${activePath}.pdf` : "");
    if (!output || !output.trim()) {
      return;
    }

    try {
      const exported = await exportPdf(output.trim(), markdown);
      setStatus(`PDF export result: ${exported.output_path}`);
    } catch (error) {
      setStatus(toStatus(messages.app.exportPdfFailed, error));
    }
  }

  function handleReplaceNext() {
    if (!query) {
      setStatus(messages.app.noReplaceQuery);
      return;
    }

    const next = replaceNext(markdown, query, replacement);
    if (next === markdown) {
      setStatus(messages.app.noReplaceMatch);
      return;
    }

    updateDocument(next);
    setStatus(messages.app.replacedNext);
  }

  function handleReplaceAll() {
    if (!query) {
      setStatus(messages.app.noReplaceQuery);
      return;
    }

    const next = replaceAll(markdown, query, replacement);
    if (next === markdown) {
      setStatus(messages.app.noReplaceMatch);
      return;
    }

    updateDocument(next);
    setStatus(messages.app.replacedAll);
  }

  useEffect(() => {
    if (!runtimeCapabilities.fileIO || !activePath || !dirty) {
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        const saved = await saveFile(activePath, markdown, version);
        if (saved.conflict) {
          setStatus(messages.app.autosaveConflict);
          return;
        }

        setVersion(saved.version);
        setDirty(false);
        previousMarkdown.current = markdown;
        setStatus(`Autosaved at ${new Date().toLocaleTimeString()}`);
      } catch (error) {
        setStatus(toStatus(messages.app.autosaveFailed, error));
      }
    }, autosaveMs);

    return () => window.clearTimeout(timer);
  }, [
    activePath,
    autosaveMs,
    dirty,
    markdown,
    messages.app.autosaveConflict,
    messages.app.autosaveFailed,
    runtimeCapabilities.fileIO,
    version
  ]);

  return (
    <main className="app-shell">
      <header className="hero-panel">
        <div>
          <p className="hero-eyebrow">Markdown Desktop Workspace</p>
          <h1>{messages.app.title}</h1>
          <p className="hero-subtitle">{messages.app.subtitle}</p>
        </div>
        <div className="hero-status-chip">{dirty ? "Unsaved changes" : messages.app.ready}</div>
      </header>

      {runtimeMode === "web" ? <section className="runtime-banner">{messages.app.desktopModeNotice}</section> : null}

      <section className="control-panel">
        <div className="control-row">
          <input
            className="path-input"
            value={pathInput}
            onChange={(event) => setPathInput(event.target.value)}
            placeholder={messages.app.filePathPlaceholder}
            disabled={!runtimeCapabilities.fileIO}
          />
          <button
            className="action-button"
            type="button"
            onClick={handleOpen}
            disabled={!runtimeCapabilities.fileIO}
          >
            {messages.app.open}
          </button>
          <button
            className="action-button"
            type="button"
            onClick={handleSave}
            disabled={!runtimeCapabilities.fileIO}
          >
            {messages.app.save}
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={handleSaveAs}
            disabled={!runtimeCapabilities.fileIO}
          >
            {messages.app.saveAs}
          </button>
        </div>

        <div className="control-row split-row">
          <div className="split-actions">
            <button
              className="action-button"
              type="button"
              onClick={handleExportHtml}
              disabled={!runtimeCapabilities.export}
            >
              {messages.app.exportHtml}
            </button>
            <button
              className="action-button"
              type="button"
              onClick={handleExportPdf}
              disabled={!runtimeCapabilities.export}
            >
              {messages.app.exportPdf}
            </button>
          </div>
          <div className="split-actions">
            <input
              className="text-input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={messages.app.searchPlaceholder}
            />
            <input
              className="text-input"
              value={replacement}
              onChange={(event) => setReplacement(event.target.value)}
              placeholder={messages.app.replacePlaceholder}
            />
            <button className="secondary-button" type="button" onClick={handleReplaceNext}>
              {messages.app.replaceNext}
            </button>
            <button className="secondary-button" type="button" onClick={handleReplaceAll}>
              {messages.app.replaceAll}
            </button>
            <span className="match-counter">
              {messages.app.matches}: {matchCount}
            </span>
          </div>
        </div>
      </section>

      <section className="editor-panel">
        <MarkdownEditor value={markdown} onChange={updateDocument} labels={messages.editor} />
      </section>

      <section className="status-grid">
        <article className="status-card">
          <h2>{messages.app.status}</h2>
          <p>{status}</p>
        </article>
        <article className="status-card">
          <h2>{messages.app.path}</h2>
          <p>{activePath || messages.app.unopened}</p>
        </article>
        <article className="status-card">
          <h2>{messages.app.version}</h2>
          <p>{version}</p>
        </article>
        <article className="status-card">
          <h2>{messages.app.autosave}</h2>
          <p>{autosaveMs} ms</p>
        </article>
      </section>

      <section className="debug-panel-toggle">
        <button
          className="secondary-button"
          type="button"
          onClick={() => setShowDebugPanels((current) => !current)}
        >
          {messages.app.debugToggle}
        </button>
      </section>

      {showDebugPanels ? (
        <section className="debug-panel">
          <h2>{messages.app.debugPayloadTitle}</h2>
          <pre>{JSON.stringify(syncPayload, null, 2)}</pre>
        </section>
      ) : null}
    </main>
  );
}

export default App;
