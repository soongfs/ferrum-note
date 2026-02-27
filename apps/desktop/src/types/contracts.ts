export type OpenFileResponse = {
  path: string;
  content: string;
  version: number;
  last_modified: number;
};

export type SaveFileResponse = {
  path: string;
  version: number;
  bytes_written: number;
  conflict: boolean;
};

export type ExportResponse = {
  output_path: string;
  bytes_written: number;
};

export type WatchStartedResponse = {
  path: string;
  watch_id: string;
};

export type EditorSyncPayload = {
  doc_id: string;
  markdown: string;
  version: number;
  dirty: boolean;
  changed_blocks: string[];
};

export type WorkspaceEntryKind = "directory" | "markdown";

export type WorkspaceEntry = {
  name: string;
  relative_path: string;
  absolute_path: string;
  kind: WorkspaceEntryKind;
  modified_at: number;
};

export type ListWorkspaceEntriesResponse = {
  root_path: string;
  current_relative_path: string;
  entries: WorkspaceEntry[];
};

export type AppConfig = {
  autosave_ms: number;
  theme: string;
  font_size: number;
  recent_files_limit: number;
  line_width_hint: number;
  ui_language: string;
  show_debug_panels: boolean;
  workspace_root?: string;
};
