export type UiMessages = {
  app: {
    title: string;
    subtitle: string;
    filePathPlaceholder: string;
    open: string;
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
    version: string;
    autosave: string;
    debugToggle: string;
    debugPayloadTitle: string;
    enterPathHint: string;
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
    shortcutHint: string;
  };
};

export const en: UiMessages = {
  app: {
    title: "FerrumNote",
    subtitle: "Rust + Tauri + TipTap Markdown Editor",
    filePathPlaceholder: "Path to .md file, e.g. /home/user/notes/today.md",
    open: "Open",
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
    version: "Version",
    autosave: "Autosave",
    debugToggle: "Show Debug Payload",
    debugPayloadTitle: "Editor Sync Payload",
    enterPathHint: "Enter a file path first.",
    saveNeedFileHint: "Open a file first or use Save As.",
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
    unopened: "Not opened"
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
    shortcutHint: "Shortcuts: Ctrl/Cmd+B, Ctrl/Cmd+I, Ctrl/Cmd+Z"
  }
};

export const zhCN: UiMessages = {
  app: {
    title: "FerrumNote",
    subtitle: "Rust + Tauri + TipTap Markdown 编辑器",
    filePathPlaceholder: "输入 .md 路径，例如 /home/user/notes/today.md",
    open: "打开",
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
    version: "版本",
    autosave: "自动保存",
    debugToggle: "显示调试载荷",
    debugPayloadTitle: "编辑器同步载荷",
    enterPathHint: "请先输入路径。",
    saveNeedFileHint: "请先打开文件或使用另存为。",
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
    unopened: "未打开"
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
    shortcutHint: "快捷键：Ctrl/Cmd+B、Ctrl/Cmd+I、Ctrl/Cmd+Z"
  }
};

export function resolveMessages(language: string): UiMessages {
  if (language.toLowerCase().startsWith("zh")) {
    return zhCN;
  }
  return en;
}
