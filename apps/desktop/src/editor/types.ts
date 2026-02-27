export type EditorMode = "writer" | "source";

export type WriterMarkerPolicy = {
  markerNodeNames: readonly string[];
  hideFenceCodeMarks: boolean;
};

export const DEFAULT_WRITER_MARKER_POLICY: WriterMarkerPolicy = {
  markerNodeNames: [
    "HeaderMark",
    "EmphasisMark",
    "CodeMark",
    "LinkMark",
    "QuoteMark",
    "ListMark"
  ],
  hideFenceCodeMarks: false
};

export type WriterRenderPolicy = {
  headingScale: Record<1 | 2 | 3 | 4 | 5 | 6, number>;
  codeBlockStyle: {
    enabled: boolean;
  };
  showCodeInfoBadge: boolean;
};

export const DEFAULT_WRITER_RENDER_POLICY: WriterRenderPolicy = {
  headingScale: {
    1: 2,
    2: 1.6,
    3: 1.35,
    4: 1.2,
    5: 1.05,
    6: 1
  },
  codeBlockStyle: {
    enabled: true
  },
  showCodeInfoBadge: true
};
