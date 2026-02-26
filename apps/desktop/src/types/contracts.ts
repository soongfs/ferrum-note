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

export type AppConfig = {
  autosave_ms: number;
  theme: string;
  font_size: number;
  recent_files_limit: number;
  line_width_hint: number;
};
