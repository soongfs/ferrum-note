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
