import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  exportHtml,
  exportPdf,
  listWorkspaceEntries,
  loadAppConfig,
  openFile,
  pickWorkspaceDirectory,
  saveAsFile,
  saveFile,
  setWorkspaceRoot,
  watchFile
} from "./api/bridge";
import { MarkdownEditor } from "./editor/MarkdownEditor";
import { resolveMessages } from "./i18n/messages";
import {
  DesktopOnlyError,
  detectRuntimeMode,
  getRuntimeCapabilities
} from "./runtime/capabilities";
import { countMatches, replaceAll, replaceNext } from "./search/ops";
import type { EditorSyncPayload, WorkspaceEntry } from "./types/contracts";
import { calculateDocumentStats } from "./workspace/viewModel";

const INITIAL_DOC = `# FerrumNote\n\nStart writing your Markdown notes.`;

type SaveState = "saved" | "unsaved" | "saving" | "autosaving" | "conflict" | "error";

function App() {
  const [markdown, setMarkdown] = useState(INITIAL_DOC);
  const [activePath, setActivePath] = useState("");
  const [version, setVersion] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [autosaveMs, setAutosaveMs] = useState(1500);
  const [query, setQuery] = useState("");
  const [replacement, setReplacement] = useState("");
  const [uiLanguage, setUiLanguage] = useState("en");
  const [showDebugPanels, setShowDebugPanels] = useState(false);
  const [workspaceRootPath, setWorkspaceRootPath] = useState("");
  const [directoryEntries, setDirectoryEntries] = useState<Record<string, WorkspaceEntry[]>>({});
  const [expandedDirectories, setExpandedDirectories] = useState<string[]>([]);
  const [loadingDirectories, setLoadingDirectories] = useState<string[]>([]);
  const [selectedEntryPath, setSelectedEntryPath] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const previousMarkdown = useRef(INITIAL_DOC);

  const runtimeMode = useMemo(() => detectRuntimeMode(), []);
  const runtimeCapabilities = useMemo(() => getRuntimeCapabilities(runtimeMode), [runtimeMode]);
  const messages = useMemo(() => resolveMessages(uiLanguage), [uiLanguage]);
  const expandedDirectorySet = useMemo(() => new Set(expandedDirectories), [expandedDirectories]);
  const loadingDirectorySet = useMemo(() => new Set(loadingDirectories), [loadingDirectories]);

  useEffect(() => {
    loadAppConfig()
      .then((cfg) => {
        setAutosaveMs(cfg.autosave_ms || 1500);
        setUiLanguage(cfg.ui_language || "en");
        setShowDebugPanels(Boolean(cfg.show_debug_panels));
        setWorkspaceRootPath(cfg.workspace_root || "");
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
  const documentStats = useMemo(() => calculateDocumentStats(markdown), [markdown]);

  const syncPayload: EditorSyncPayload = {
    doc_id: activePath || "untitled",
    markdown,
    version,
    dirty,
    changed_blocks: changedBlocks
  };

  const saveStateLabel = useMemo(() => {
    switch (saveState) {
      case "saved":
        return messages.app.saveStateSaved;
      case "unsaved":
        return messages.app.saveStateUnsaved;
      case "saving":
        return messages.app.saveStateSaving;
      case "autosaving":
        return messages.app.saveStateAutosaving;
      case "conflict":
        return messages.app.saveStateConflict;
      case "error":
        return messages.app.saveStateError;
      default:
        return messages.app.saveStateSaved;
    }
  }, [
    messages.app.saveStateAutosaving,
    messages.app.saveStateConflict,
    messages.app.saveStateError,
    messages.app.saveStateSaving,
    messages.app.saveStateSaved,
    messages.app.saveStateUnsaved,
    saveState
  ]);

  const runtimeModeLabel = runtimeMode === "tauri" ? messages.app.modeTauri : messages.app.modeWeb;

  const loadDirectory = useCallback(
    async (relativePath?: string): Promise<boolean> => {
      if (!runtimeCapabilities.workspaceExplorer || !workspaceRootPath) {
        return false;
      }

      const target = (relativePath || "").trim();
      setLoadingDirectories((current) =>
        current.includes(target) ? current : [...current, target]
      );

      try {
        const listed = await listWorkspaceEntries(target || undefined);
        const currentRelative = listed.current_relative_path || "";

        setDirectoryEntries((current) => ({
          ...current,
          [currentRelative]: listed.entries
        }));
        return true;
      } catch (error) {
        setStatus(toStatus(messages.app.explorerLoadFailed, error));
        return false;
      } finally {
        setLoadingDirectories((current) => current.filter((item) => item !== target));
      }
    },
    [
      messages.app.explorerLoadFailed,
      runtimeCapabilities.workspaceExplorer,
      workspaceRootPath
    ]
  );

  useEffect(() => {
    setDirectoryEntries({});
    setExpandedDirectories([]);
    setSelectedEntryPath("");
  }, [workspaceRootPath]);

  useEffect(() => {
    if (!runtimeCapabilities.workspaceExplorer || !workspaceRootPath) {
      return;
    }

    void loadDirectory();
  }, [loadDirectory, runtimeCapabilities.workspaceExplorer, workspaceRootPath]);

  function updateDocument(next: string) {
    setMarkdown(next);
    setDirty(true);
    if (saveState !== "autosaving") {
      setSaveState("unsaved");
    }
  }

  function toStatus(errorPrefix: string, error: unknown): string {
    if (error instanceof DesktopOnlyError) {
      return error.message;
    }
    return `${errorPrefix}: ${String(error)}`;
  }

  async function handleOpenFolder() {
    if (!runtimeCapabilities.workspaceExplorer) {
      setStatus(messages.app.desktopModeNotice);
      return;
    }

    try {
      const selected = await pickWorkspaceDirectory();
      if (!selected) {
        return;
      }

      const nextConfig = await setWorkspaceRoot(selected);
      const nextRoot = nextConfig.workspace_root || "";
      setWorkspaceRootPath(nextRoot);
      setStatus(`Workspace: ${nextRoot}`);
    } catch (error) {
      setStatus(toStatus(messages.app.workspaceSetFailed, error));
    }
  }

  async function handleRefreshExplorer() {
    if (!runtimeCapabilities.workspaceExplorer || !workspaceRootPath) {
      setStatus(messages.app.openFolderHint);
      return;
    }

    const targets = Array.from(new Set(["", ...expandedDirectories]));
    const results = await Promise.all(targets.map((target) => loadDirectory(target || undefined)));
    if (results.every(Boolean)) {
      setStatus(messages.app.explorerRefreshed);
    }
  }

  async function openFromExplorer(entry: WorkspaceEntry) {
    if (!runtimeCapabilities.fileIO) {
      setStatus(messages.app.desktopModeNotice);
      return;
    }

    try {
      const file = await openFile(entry.absolute_path);
      setMarkdown(file.content);
      previousMarkdown.current = file.content;
      setActivePath(file.path);
      setVersion(file.version);
      setDirty(false);
      setSelectedEntryPath(entry.relative_path);
      setSaveState("saved");
      setStatus(`Opened: ${file.path}`);

      if (runtimeCapabilities.fileWatch) {
        await watchFile(file.path);
      }
    } catch (error) {
      setStatus(toStatus(messages.app.openFailed, error));
      setSaveState("error");
    }
  }

  async function handleExplorerEntry(entry: WorkspaceEntry) {
    if (entry.kind === "directory") {
      const relative = entry.relative_path;
      if (expandedDirectorySet.has(relative)) {
        setExpandedDirectories((current) => current.filter((item) => item !== relative));
        return;
      }

      setExpandedDirectories((current) => [...current, relative]);
      if (!directoryEntries[relative]) {
        await loadDirectory(relative);
      }
      return;
    }

    await openFromExplorer(entry);
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
      setSaveState("saving");
      const saved = await saveFile(activePath, markdown, version);
      if (saved.conflict) {
        setStatus(messages.app.saveConflict);
        setSaveState("conflict");
        return;
      }

      setVersion(saved.version);
      setDirty(false);
      previousMarkdown.current = markdown;
      setSaveState("saved");
      setStatus(`Saved: ${saved.path}`);
    } catch (error) {
      setStatus(toStatus(messages.app.saveFailed, error));
      setSaveState("error");
    }
  }

  async function handleSaveAs() {
    if (!runtimeCapabilities.fileIO) {
      setStatus(messages.app.desktopModeNotice);
      return;
    }

    const path = window.prompt(messages.app.saveAs, activePath || "");
    if (!path || !path.trim()) {
      return;
    }

    try {
      setSaveState("saving");
      const saved = await saveAsFile(path.trim(), markdown);
      setActivePath(saved.path);
      setVersion(saved.version);
      setDirty(false);
      previousMarkdown.current = markdown;
      setSaveState("saved");
      setStatus(`Saved as: ${saved.path}`);
      if (runtimeCapabilities.fileWatch) {
        await watchFile(saved.path);
      }
    } catch (error) {
      setStatus(toStatus(messages.app.saveAsFailed, error));
      setSaveState("error");
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
      setStatus(`PDF exported: ${exported.output_path}`);
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
        setSaveState("autosaving");
        const saved = await saveFile(activePath, markdown, version);
        if (saved.conflict) {
          setStatus(messages.app.autosaveConflict);
          setSaveState("conflict");
          return;
        }

        setVersion(saved.version);
        setDirty(false);
        previousMarkdown.current = markdown;
        setSaveState("saved");
        setStatus(`Autosaved at ${new Date().toLocaleTimeString()}`);
      } catch (error) {
        setStatus(toStatus(messages.app.autosaveFailed, error));
        setSaveState("error");
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

  function renderExplorer(relativePath: string, depth: number) {
    const entries = directoryEntries[relativePath] || [];

    if (!entries.length) {
      if (loadingDirectorySet.has(relativePath)) {
        return <p className="explorer-empty">{messages.editor.loading}</p>;
      }

      return <p className="explorer-empty">{messages.app.explorerEmpty}</p>;
    }

    return (
      <ul className="explorer-list" role="tree">
        {entries.map((entry) => {
          const isDirectory = entry.kind === "directory";
          const isExpanded = expandedDirectorySet.has(entry.relative_path);
          const isSelected = selectedEntryPath === entry.relative_path;

          return (
            <li key={entry.relative_path || entry.absolute_path}>
              <button
                type="button"
                className={`explorer-entry${isSelected ? " is-selected" : ""}`}
                style={{ paddingLeft: `${12 + depth * 14}px` }}
                onClick={() => {
                  void handleExplorerEntry(entry);
                }}
                disabled={!runtimeCapabilities.workspaceExplorer}
                data-testid={`explorer-item-${entry.relative_path.replace(/[^a-z0-9-_]/gi, "-")}`}
              >
                <span className="explorer-caret">{isDirectory ? (isExpanded ? "▾" : "▸") : "•"}</span>
                <span className="explorer-name">{entry.name}</span>
              </button>
              {isDirectory && isExpanded ? (
                <div className="explorer-children">{renderExplorer(entry.relative_path, depth + 1)}</div>
              ) : null}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <main className="workspace-shell">
      <header className="top-bar">
        <div className="top-bar-main">
          <p className="hero-eyebrow">Markdown Desktop Workspace</p>
          <h1>{messages.app.title}</h1>
          <p className="hero-subtitle">{messages.app.subtitle}</p>
          <p className="workspace-path">
            {messages.app.workspace}: {workspaceRootPath || messages.app.workspaceUnset}
          </p>
        </div>
        <div className="top-actions">
          <button
            className="action-button"
            type="button"
            onClick={handleOpenFolder}
            disabled={!runtimeCapabilities.workspaceExplorer}
            data-testid="open-folder-button"
          >
            {messages.app.openFolder}
          </button>
          <button
            className="action-button"
            type="button"
            onClick={handleSave}
            disabled={!runtimeCapabilities.fileIO}
            data-testid="save-button"
          >
            {messages.app.save}
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={handleSaveAs}
            disabled={!runtimeCapabilities.fileIO}
            data-testid="save-as-button"
          >
            {messages.app.saveAs}
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={handleExportHtml}
            disabled={!runtimeCapabilities.export}
            data-testid="export-html-button"
          >
            {messages.app.exportHtml}
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={handleExportPdf}
            disabled={!runtimeCapabilities.export}
            data-testid="export-pdf-button"
          >
            {messages.app.exportPdf}
          </button>
        </div>
      </header>

      {runtimeMode === "web" ? (
        <section className="runtime-banner" data-testid="runtime-banner">
          {messages.app.desktopModeNotice}
        </section>
      ) : null}

      <section className="workspace-main">
        <aside className="explorer-pane">
          <div className="explorer-header">
            <h2>{messages.app.explorerTitle}</h2>
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                void handleRefreshExplorer();
              }}
              disabled={!runtimeCapabilities.workspaceExplorer || !workspaceRootPath}
              data-testid="explorer-refresh-button"
            >
              {messages.app.refresh}
            </button>
          </div>

          {!workspaceRootPath ? (
            <div className="explorer-empty-state">
              <p>{messages.app.openFolderHint}</p>
            </div>
          ) : (
            renderExplorer("", 0)
          )}
        </aside>

        <section className="editor-pane">
          <div className="editor-search-row">
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
            <button
              className="secondary-button"
              type="button"
              onClick={handleReplaceNext}
              data-testid="replace-next-button"
            >
              {messages.app.replaceNext}
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={handleReplaceAll}
              data-testid="replace-all-button"
            >
              {messages.app.replaceAll}
            </button>
            <span className="match-counter">
              {messages.app.matches}: {matchCount}
            </span>
          </div>

          <section className="editor-panel">
            <MarkdownEditor value={markdown} onChange={updateDocument} labels={messages.editor} />
          </section>
        </section>
      </section>

      <footer className="status-bar">
        <span>
          {messages.app.status}: {status}
        </span>
        <span>
          {messages.app.saveState}: {saveStateLabel}
        </span>
        <span>
          {messages.app.wordCount}: {documentStats.words}
        </span>
        <span>
          {messages.app.characterCount}: {documentStats.characters}
        </span>
        <span>
          {messages.app.lineCount}: {documentStats.lines}
        </span>
        <span>
          {messages.app.runtime}: {runtimeModeLabel}
        </span>
        <span>
          {messages.app.path}: {activePath || messages.app.unopened}
        </span>
      </footer>

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
