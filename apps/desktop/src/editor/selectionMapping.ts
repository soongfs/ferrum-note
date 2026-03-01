import type { EngineSelection } from "../engine/types";
import { codeUnitOffsetForUtf8, collectLeafMaps } from "./domMapping";

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

  const range = document.createRange();
  range.setStart(anchorPoint.node, anchorPoint.offset);
  range.setEnd(focusPoint.node, focusPoint.offset);
  nativeSelection.removeAllRanges();
  nativeSelection.addRange(range);
}

function findDomPointForUtf8(
  root: HTMLElement,
  utf8Offset: number
): { node: Node; offset: number } | null {
  const leaves = collectLeafMaps(root);
  if (!leaves.length) {
    return null;
  }

  const lastLeaf = leaves[leaves.length - 1];
  if (utf8Offset > lastLeaf.endUtf8) {
    return {
      node: root,
      offset: root.childNodes.length
    };
  }

  const leaf =
    leaves.find((candidate) => utf8Offset >= candidate.startUtf8 && utf8Offset <= candidate.endUtf8) ??
    leaves.find((candidate) => utf8Offset < candidate.startUtf8) ??
    lastLeaf;

  const textNode = leaf.element.firstChild;
  if (!textNode) {
    return null;
  }

  if (leaf.empty) {
    return {
      node: textNode,
      offset: 0
    };
  }

  const localUtf8 = Math.max(0, utf8Offset - leaf.startUtf8);
  return {
    node: textNode,
    offset: codeUnitOffsetForUtf8(leaf.text, localUtf8)
  };
}
