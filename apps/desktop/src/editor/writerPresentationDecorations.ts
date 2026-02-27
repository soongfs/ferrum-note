import { RangeSetBuilder, type EditorState } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";
import { Decoration, type DecorationSet, ViewPlugin, type ViewUpdate } from "@codemirror/view";
import type { WriterRenderPolicy } from "./types";

const codeInfoDecoration = Decoration.mark({ class: "cm-fn-code-info" });
const codeOpenDecoration = Decoration.line({ attributes: { class: "cm-fn-fenced-line cm-fn-fenced-open" } });
const codeBodyDecoration = Decoration.line({ attributes: { class: "cm-fn-fenced-line cm-fn-fenced-body" } });
const codeCloseDecoration = Decoration.line({
  attributes: { class: "cm-fn-fenced-line cm-fn-fenced-close" }
});

type NodeRange = {
  name: string;
  from: number;
  to: number;
};

const headingLevels: Record<string, 1 | 2 | 3 | 4 | 5 | 6> = {
  ATXHeading1: 1,
  ATXHeading2: 2,
  ATXHeading3: 3,
  ATXHeading4: 4,
  ATXHeading5: 5,
  ATXHeading6: 6,
  SetextHeading1: 1,
  SetextHeading2: 2
};

export function buildWriterPresentationDecorations(
  state: EditorState,
  policy: WriterRenderPolicy
): DecorationSet {
  const entries: DecorationEntry[] = [];
  const cursor = syntaxTree(state).cursor();

  do {
    const current: NodeRange = {
      name: cursor.name,
      from: cursor.from,
      to: cursor.to
    };

    const headingLevel = headingLevels[current.name];
    if (headingLevel) {
      const line = state.doc.lineAt(current.from);
      entries.push({
        from: line.from,
        to: line.from,
        decoration: createHeadingLineDecoration(headingLevel, policy.headingScale[headingLevel])
      });
    }

    if (current.name === "FencedCode" && policy.codeBlockStyle.enabled) {
      addFencedLineDecorations(state, entries, current.from, current.to);
    }

    if (current.name === "CodeInfo" && policy.showCodeInfoBadge) {
      entries.push({
        from: current.from,
        to: current.to,
        decoration: codeInfoDecoration
      });
    }
  } while (cursor.next());

  entries.sort((left, right) => {
    if (left.from !== right.from) {
      return left.from - right.from;
    }

    if (left.to !== right.to) {
      return left.to - right.to;
    }

    return 0;
  });

  const builder = new RangeSetBuilder<Decoration>();
  for (const entry of entries) {
    builder.add(entry.from, entry.to, entry.decoration);
  }

  return builder.finish();
}

function createHeadingLineDecoration(level: 1 | 2 | 3 | 4 | 5 | 6, scale: number): Decoration {
  return Decoration.line({
    attributes: {
      class: `cm-fn-heading cm-fn-heading-${level}`,
      style: `--cm-fn-heading-scale:${scale}`
    }
  });
}

export function createWriterPresentationDecorations(policy: WriterRenderPolicy) {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: ViewUpdate["view"]) {
        this.decorations = buildWriterPresentationDecorations(view.state, policy);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.selectionSet || update.viewportChanged) {
          this.decorations = buildWriterPresentationDecorations(update.state, policy);
        }
      }
    },
    {
      decorations: (instance) => instance.decorations
    }
  );
}

function addFencedLineDecorations(
  state: EditorState,
  entries: DecorationEntry[],
  from: number,
  to: number
) {
  const firstLine = state.doc.lineAt(from);
  const inclusiveEnd = Math.max(from, to - 1);
  const lastLine = state.doc.lineAt(inclusiveEnd);

  for (let number = firstLine.number; number <= lastLine.number; number += 1) {
    const line = state.doc.line(number);
    const atFirst = number === firstLine.number;
    const atLast = number === lastLine.number;

    if (atFirst) {
      entries.push({
        from: line.from,
        to: line.from,
        decoration: codeOpenDecoration
      });
      continue;
    }

    if (atLast) {
      entries.push({
        from: line.from,
        to: line.from,
        decoration: codeCloseDecoration
      });
      continue;
    }

    entries.push({
      from: line.from,
      to: line.from,
      decoration: codeBodyDecoration
    });
  }
}

type DecorationEntry = {
  from: number;
  to: number;
  decoration: Decoration;
};
