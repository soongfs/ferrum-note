export type EngineSelection = {
  anchor_utf8: number;
  head_utf8: number;
};

export type RenderAttrs = {
  heading_level?: number | null;
  href?: string | null;
  title?: string | null;
  language?: string | null;
  class_name?: string | null;
  start_utf8?: number | null;
  end_utf8?: number | null;
  list_index?: number | null;
  raw_markdown?: string | null;
};

export type RenderBlockKind =
  | "paragraph"
  | "heading"
  | "blockquote_paragraph"
  | "bullet_list_item"
  | "ordered_list_item"
  | "fenced_code";

export type RenderInlineKind =
  | "text"
  | "strong"
  | "emphasis"
  | "inline_code"
  | "link"
  | "code_text";

export type RenderInlineVM = {
  node_id: number;
  kind: RenderInlineKind;
  text: string | null;
  range: {
    start_utf8: number;
    end_utf8: number;
  };
  children: RenderInlineVM[];
  attrs: RenderAttrs;
};

export type RenderBlockVM = {
  node_id: number;
  kind: RenderBlockKind;
  children: RenderInlineVM[];
  attrs: RenderAttrs;
};

export type EngineSnapshot = {
  revision: number;
  markdown: string;
  blocks: RenderBlockVM[];
  selection: EngineSelection;
};

export type WriterInputIntent =
  | "insert_text"
  | "delete_backward"
  | "delete_forward"
  | "insert_paragraph"
  | "insert_from_paste"
  | "history_undo"
  | "history_redo";

export type EngineCommandString =
  | "toggle_strong"
  | "toggle_emphasis"
  | "toggle_inline_code"
  | "toggle_blockquote"
  | "toggle_bullet_list"
  | "toggle_ordered_list"
  | "undo"
  | "redo"
  | `toggle_heading:${number}`
  | `insert_fence:${string}`
  | "insert_fence";
