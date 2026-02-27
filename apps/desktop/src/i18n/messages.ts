export type UiMessages = {
  app: {
    title: string;
    subtitle: string;
    openFolder: string;
    refresh: string;
    explorerTitle: string;
    workspace: string;
    workspaceUnset: string;
    openFolderHint: string;
    explorerEmpty: string;
    explorerRefreshed: string;
    explorerLoadFailed: string;
    workspaceSetFailed: string;
    save: string;
    saveAs: string;
    exportHtml: string;
    exportPdf: string;
    searchPlaceholder: string;
    replacePlaceholder: string;
    replaceNext: string;
    replaceAll: string;
    matches: string;
    status: string;
    path: string;
    autosave: string;
    desktopModeNotice: string;
    debugToggle: string;
    debugPayloadTitle: string;
    saveNeedFileHint: string;
    openFailed: string;
    saveFailed: string;
    saveAsFailed: string;
    exportHtmlFailed: string;
    exportPdfFailed: string;
    noReplaceQuery: string;
    noReplaceMatch: string;
    replacedNext: string;
    replacedAll: string;
    autosaveConflict: string;
    autosaveFailed: string;
    saveConflict: string;
    ready: string;
    unopened: string;
    saveState: string;
    saveStateSaved: string;
    saveStateUnsaved: string;
    saveStateSaving: string;
    saveStateAutosaving: string;
    saveStateConflict: string;
    saveStateError: string;
    wordCount: string;
    characterCount: string;
    lineCount: string;
    runtime: string;
    modeTauri: string;
    modeWeb: string;
    modeWriter: string;
    modeSource: string;
  };
  editor: {
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
};

export const en: UiMessages = {
  app: {
    title: "FerrumNote",
    subtitle: "Rust + Tauri + TipTap Markdown Workspace",
    openFolder: "Open Folder",
    refresh: "Refresh",
    explorerTitle: "Explorer",
    workspace: "Workspace",
    workspaceUnset: "Not set",
    openFolderHint: "Open a folder to browse Markdown files.",
    explorerEmpty: "No folders or Markdown files found.",
    explorerRefreshed: "Explorer refreshed.",
    explorerLoadFailed: "Explorer load failed",
    workspaceSetFailed: "Open folder failed",
    save: "Save",
    saveAs: "Save As",
    exportHtml: "Export HTML",
    exportPdf: "Export PDF",
    searchPlaceholder: "Find",
    replacePlaceholder: "Replace",
    replaceNext: "Replace Next",
    replaceAll: "Replace All",
    matches: "Matches",
    status: "Status",
    path: "Path",
    autosave: "Autosave",
    desktopModeNotice:
      "Desktop-only features are disabled in browser mode. Use `pnpm tauri dev` for full file and explorer functions.",
    debugToggle: "Show Debug Payload",
    debugPayloadTitle: "Editor Sync Payload",
    saveNeedFileHint: "Open a file in Explorer first or use Save As.",
    openFailed: "Open failed",
    saveFailed: "Save failed",
    saveAsFailed: "Save As failed",
    exportHtmlFailed: "HTML export failed",
    exportPdfFailed: "PDF export failed",
    noReplaceQuery: "Enter search text first.",
    noReplaceMatch: "No match to replace.",
    replacedNext: "Replaced next match.",
    replacedAll: "Replaced all matches.",
    autosaveConflict: "Autosave conflict: file was changed externally.",
    autosaveFailed: "Autosave failed",
    saveConflict: "Save conflict: file changed externally, reload required.",
    ready: "Ready",
    unopened: "Not opened",
    saveState: "Save State",
    saveStateSaved: "Saved",
    saveStateUnsaved: "Unsaved",
    saveStateSaving: "Saving",
    saveStateAutosaving: "Autosaving",
    saveStateConflict: "Conflict",
    saveStateError: "Error",
    wordCount: "Words",
    characterCount: "Characters",
    lineCount: "Lines",
    runtime: "Runtime",
    modeTauri: "Desktop",
    modeWeb: "Browser",
    modeWriter: "Writer",
    modeSource: "Source"
  },
  editor: {
    placeholder: "Start writing Markdown...",
    loading: "Loading editor...",
    bold: "Bold",
    italic: "Italic",
    heading: "Heading",
    quote: "Quote",
    codeBlock: "Code Block",
    bulletList: "Bullet List",
    orderedList: "Numbered List",
    undo: "Undo",
    redo: "Redo",
    language: "Language",
    languagePlaceholder: "e.g. python",
    shortcutHint: "Shortcuts: Ctrl/Cmd+B, Ctrl/Cmd+I, Ctrl/Cmd+Z",
    sourceShortcutHint: "Source mode supports line numbers, wrapping, and Ctrl/Cmd+Shift+M toggle.",
    syntaxLens: "Markdown Syntax Lens",
    syntaxLensError: "Invalid Markdown block. Keep one top-level block in the lens."
  }
};

export const zhCN: UiMessages = {
  app: {
    title: "FerrumNote",
    subtitle: "Rust + Tauri + TipTap Markdown 工作区",
    openFolder: "打开目录",
    refresh: "刷新",
    explorerTitle: "资源管理器",
    workspace: "工作区",
    workspaceUnset: "未设置",
    openFolderHint: "请先打开目录以浏览 Markdown 文件。",
    explorerEmpty: "当前目录下没有可显示的目录或 Markdown 文件。",
    explorerRefreshed: "资源管理器已刷新。",
    explorerLoadFailed: "资源管理器加载失败",
    workspaceSetFailed: "打开目录失败",
    save: "保存",
    saveAs: "另存为",
    exportHtml: "导出 HTML",
    exportPdf: "导出 PDF",
    searchPlaceholder: "查找",
    replacePlaceholder: "替换",
    replaceNext: "替换下一个",
    replaceAll: "全部替换",
    matches: "匹配",
    status: "状态",
    path: "路径",
    autosave: "自动保存",
    desktopModeNotice: "浏览器模式下已禁用桌面专属功能，请使用 `pnpm tauri dev`。",
    debugToggle: "显示调试载荷",
    debugPayloadTitle: "编辑器同步载荷",
    saveNeedFileHint: "请先在资源管理器中打开文件，或使用另存为。",
    openFailed: "打开失败",
    saveFailed: "保存失败",
    saveAsFailed: "另存为失败",
    exportHtmlFailed: "HTML 导出失败",
    exportPdfFailed: "PDF 导出失败",
    noReplaceQuery: "请先输入查找内容。",
    noReplaceMatch: "没有可替换内容。",
    replacedNext: "已替换下一个匹配项。",
    replacedAll: "已全部替换。",
    autosaveConflict: "自动保存冲突：文件被外部修改。",
    autosaveFailed: "自动保存失败",
    saveConflict: "保存冲突：文件已被外部修改。",
    ready: "就绪",
    unopened: "未打开",
    saveState: "保存状态",
    saveStateSaved: "已保存",
    saveStateUnsaved: "未保存",
    saveStateSaving: "保存中",
    saveStateAutosaving: "自动保存中",
    saveStateConflict: "冲突",
    saveStateError: "错误",
    wordCount: "字数",
    characterCount: "字符数",
    lineCount: "行数",
    runtime: "运行时",
    modeTauri: "桌面",
    modeWeb: "浏览器",
    modeWriter: "写作",
    modeSource: "源码"
  },
  editor: {
    placeholder: "开始输入 Markdown...",
    loading: "编辑器加载中...",
    bold: "粗体",
    italic: "斜体",
    heading: "标题",
    quote: "引用",
    codeBlock: "代码块",
    bulletList: "无序列表",
    orderedList: "有序列表",
    undo: "撤销",
    redo: "重做",
    language: "语言",
    languagePlaceholder: "如 python",
    shortcutHint: "快捷键：Ctrl/Cmd+B、Ctrl/Cmd+I、Ctrl/Cmd+Z",
    sourceShortcutHint: "源码模式支持行号、自动换行与 Ctrl/Cmd+Shift+M 切换。",
    syntaxLens: "Markdown 语法镜头",
    syntaxLensError: "当前块解析失败，请保持为单个顶层 Markdown 块。"
  }
};

export function resolveMessages(language: string): UiMessages {
  if (language.toLowerCase().startsWith("zh")) {
    return zhCN;
  }
  return en;
}
