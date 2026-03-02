import type { EngineSelection } from "../engine/types";
import { codeUnitOffsetForUtf8, collectLeafMaps, type DomPositionMap } from "./domMapping";

export type SelectionDomTarget =
  | {
      kind: "root";
      offset: number;
    }
  | {
      kind: "leaf";
      leafIndex: number;
      offset: number;
    };

export function restoreDomSelection(root: HTMLElement, selection: EngineSelection): void {
  const nativeSelection = window.getSelection();
  if (!nativeSelection) {
    return;
  }

  const anchorPoint = findDomPointForUtf8(root, selection.anchor_utf8);
  const focusPoint = findDomPointForUtf8(root, selection.head_utf8);
  if (!anchorPoint || !focusPoint) {
    return;
  }

  nativeSelection.removeAllRanges();

  if (typeof nativeSelection.setBaseAndExtent === "function") {
    nativeSelection.setBaseAndExtent(
      anchorPoint.node,
      anchorPoint.offset,
      focusPoint.node,
      focusPoint.offset
    );
    return;
  }

  const range = document.createRange();
  range.setStart(anchorPoint.node, anchorPoint.offset);
  range.setEnd(focusPoint.node, focusPoint.offset);
  nativeSelection.addRange(range);
}

function findDomPointForUtf8(
  root: HTMLElement,
  utf8Offset: number
): { node: Node; offset: number } | null {
  const leaves = collectLeafMaps(root);
  const target = mapUtf8OffsetToDomTarget(
    leaves,
    utf8Offset,
    root.childNodes.length,
    Number(root.dataset.docEnd ?? String(leaves[leaves.length - 1]?.endUtf8 ?? 0))
  );

  if (!target) {
    return null;
  }

  if (target.kind === "root") {
    return {
      node: root,
      offset: target.offset
    };
  }

  const leaf = leaves[target.leafIndex];
  const textNode = leaf?.element.firstChild;
  if (!leaf || !textNode) {
    return null;
  }

  return {
    node: textNode,
    offset: leaf.empty ? 0 : target.offset
  };
}

export function mapUtf8SelectionToDomTargets(
  leaves: Pick<DomPositionMap, "startUtf8" | "endUtf8" | "text" | "empty">[],
  selection: EngineSelection,
  rootChildCount: number,
  docEndUtf8?: number
): { anchor: SelectionDomTarget; focus: SelectionDomTarget } | null {
  const anchor = mapUtf8OffsetToDomTarget(leaves, selection.anchor_utf8, rootChildCount, docEndUtf8);
  const focus = mapUtf8OffsetToDomTarget(leaves, selection.head_utf8, rootChildCount, docEndUtf8);

  if (!anchor || !focus) {
    return null;
  }

  return { anchor, focus };
}

export function mapUtf8OffsetToDomTarget(
  leaves: Pick<DomPositionMap, "startUtf8" | "endUtf8" | "text" | "empty">[],
  utf8Offset: number,
  rootChildCount: number,
  docEndUtf8 = leaves[leaves.length - 1]?.endUtf8 ?? 0
): SelectionDomTarget | null {
  if (!leaves.length) {
    return {
      kind: "root",
      offset: 0
    };
  }

  if (utf8Offset >= docEndUtf8) {
    return {
      kind: "root",
      offset: rootChildCount
    };
  }

  const containingLeafIndex = leaves.findIndex(
    (candidate) => utf8Offset >= candidate.startUtf8 && utf8Offset <= candidate.endUtf8
  );
  const leafIndex =
    containingLeafIndex >= 0
      ? containingLeafIndex
      : leaves.findIndex((candidate) => utf8Offset < candidate.startUtf8);

  const resolvedLeafIndex = leafIndex >= 0 ? leafIndex : leaves.length - 1;
  const leaf = leaves[resolvedLeafIndex];

  if (leaf.empty || utf8Offset <= leaf.startUtf8) {
    return {
      kind: "leaf",
      leafIndex: resolvedLeafIndex,
      offset: 0
    };
  }

  if (utf8Offset >= leaf.endUtf8) {
    return {
      kind: "leaf",
      leafIndex: resolvedLeafIndex,
      offset: leaf.text.length
    };
  }

  return {
    kind: "leaf",
    leafIndex: resolvedLeafIndex,
    offset: codeUnitOffsetForUtf8(leaf.text, Math.max(0, utf8Offset - leaf.startUtf8))
  };
}
