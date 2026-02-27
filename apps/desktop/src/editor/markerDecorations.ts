import { type EditorState, RangeSetBuilder } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";
import { Decoration, type DecorationSet, ViewPlugin, type ViewUpdate } from "@codemirror/view";
import type { WriterMarkerPolicy } from "./types";

type NodeContext = {
  name: string;
  from: number;
  to: number;
};

const hiddenMarkerDecoration = Decoration.replace({});
const codeInfoDecoration = Decoration.mark({ class: "cm-fn-code-info" });

export function buildMarkdownMarkerDecorations(
  state: EditorState,
  policy: WriterMarkerPolicy
): DecorationSet {
  const markerNames = new Set(policy.markerNodeNames);
  const builder = new RangeSetBuilder<Decoration>();
  const tree = syntaxTree(state);
  const cursor = tree.cursor();

  const visit = (parent: NodeContext | null) => {
    do {
      const current: NodeContext = {
        name: cursor.name,
        from: cursor.from,
        to: cursor.to
      };

      if (cursor.firstChild()) {
        visit(current);
        cursor.parent();
      }

      const parentNode = parent;
      if (!parentNode) {
        continue;
      }

      const selectionInsideParent = isSelectionInside(
        state.selection.main.head,
        parentNode.from,
        parentNode.to
      );

      if (markerNames.has(current.name)) {
        const isFenceCodeMark = current.name === "CodeMark" && parentNode.name === "FencedCode";
        if (!selectionInsideParent && !(isFenceCodeMark && !policy.hideFenceCodeMarks)) {
          const [hideFrom, hideTo] = markerHideRange(state, current);
          if (hideFrom < hideTo) {
            builder.add(hideFrom, hideTo, hiddenMarkerDecoration);
          }
        }
      }

      if (current.name === "CodeInfo" && parentNode.name === "FencedCode" && !selectionInsideParent) {
        builder.add(current.from, current.to, codeInfoDecoration);
      }
    } while (cursor.nextSibling());
  };

  visit(null);
  return builder.finish();
}

export function createWriterMarkerDecorations(policy: WriterMarkerPolicy) {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: ViewUpdate["view"]) {
        this.decorations = buildMarkdownMarkerDecorations(view.state, policy);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.selectionSet) {
          this.decorations = buildMarkdownMarkerDecorations(update.state, policy);
        }
      }
    },
    {
      decorations: (instance) => instance.decorations
    }
  );
}

function isSelectionInside(position: number, from: number, to: number): boolean {
  return position >= from && position <= to;
}

function markerHideRange(state: EditorState, node: NodeContext): [number, number] {
  const hideFrom = node.from;
  let hideTo = node.to;

  if (node.name === "HeaderMark" || node.name === "ListMark" || node.name === "QuoteMark") {
    const trailingChar = state.doc.sliceString(node.to, node.to + 1);
    if (trailingChar === " ") {
      hideTo += 1;
    }
  }

  return [hideFrom, hideTo];
}
