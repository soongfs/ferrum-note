export type EditorMode = "writer" | "source";

export type ActiveSyntaxLens = {
  blockFrom: number;
  blockTo: number;
  markdown: string;
  visible: boolean;
};
