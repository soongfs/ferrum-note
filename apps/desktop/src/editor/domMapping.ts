import type { EngineSelection } from "../engine/types";

export type DomPositionMap = {
  element: HTMLElement;
  startUtf8: number;
  endUtf8: number;
  text: string;
  empty: boolean;
};

export type DomSelectionOffsets = EngineSelection & {
  start_utf8: number;
  end_utf8: number;
};

const encoder = new TextEncoder();

export function utf8BytesForCodeUnitOffset(text: string, codeUnitOffset: number): number {
  return encoder.encode(text.slice(0, codeUnitOffset)).length;
}

export function codeUnitOffsetForUtf8(text: string, utf8Offset: number): number {
  let consumed = 0;
  let codeUnits = 0;

  for (const character of text) {
    const bytes = encoder.encode(character).length;
    if (consumed + bytes > utf8Offset) {
      break;
    }
    consumed += bytes;
    codeUnits += character.length;
  }

  return codeUnits;
}

export function collectLeafMaps(root: HTMLElement): DomPositionMap[] {
  return Array.from(root.querySelectorAll<HTMLElement>("[data-leaf='true']")).map((element) => ({
    element,
    startUtf8: Number(element.dataset.start ?? "0"),
    endUtf8: Number(element.dataset.end ?? "0"),
    text: element.dataset.empty === "true" ? "" : element.textContent ?? "",
    empty: element.dataset.empty === "true"
  }));
}

export function readDomSelection(root: HTMLElement): DomSelectionOffsets | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const anchorNode = selection.anchorNode;
  const focusNode = selection.focusNode;
  if (!anchorNode || !focusNode || !root.contains(anchorNode) || !root.contains(focusNode)) {
    return null;
  }

  const anchorUtf8 = domPointToUtf8(root, anchorNode, selection.anchorOffset);
  const headUtf8 = domPointToUtf8(root, focusNode, selection.focusOffset);

  if (anchorUtf8 === null || headUtf8 === null) {
    return null;
  }

  return {
    anchor_utf8: anchorUtf8,
    head_utf8: headUtf8,
    start_utf8: Math.min(anchorUtf8, headUtf8),
    end_utf8: Math.max(anchorUtf8, headUtf8)
  };
}

export function serializeWriterMarkdown(root: HTMLElement, previousMarkdown: string): string {
  const blocks = Array.from(root.querySelectorAll<HTMLElement>("[data-block='true']"));
  let cursorUtf8 = 0;
  let nextMarkdown = "";

  for (const block of blocks) {
    const startUtf8 = Number(block.dataset.start ?? "0");
    const endUtf8 = Number(block.dataset.end ?? String(startUtf8));
    nextMarkdown += sliceByUtf8Offsets(previousMarkdown, cursorUtf8, startUtf8);

    const leaf = block.querySelector<HTMLElement>("[data-leaf='true']");
    const blockText = leaf && leaf.dataset.empty === "true" ? "" : leaf?.textContent ?? "";
    nextMarkdown += blockText;
    cursorUtf8 = endUtf8;
  }

  nextMarkdown += sliceByUtf8Offsets(previousMarkdown, cursorUtf8);
  return nextMarkdown;
}

export function sliceByUtf8Offsets(text: string, startUtf8: number, endUtf8?: number): string {
  const startCodeUnits = codeUnitOffsetForUtf8(text, startUtf8);
  const endCodeUnits = endUtf8 === undefined ? text.length : codeUnitOffsetForUtf8(text, endUtf8);
  return text.slice(startCodeUnits, endCodeUnits);
}

function domPointToUtf8(root: HTMLElement, node: Node, offset: number): number | null {
  if (node === root) {
    if (offset <= 0) {
      return 0;
    }

    if (offset >= root.childNodes.length) {
      return Number(root.dataset.docEnd ?? "0");
    }
  }

  const resolvedLeaf = resolveLeafForNode(root, node, offset);
  if (!resolvedLeaf) {
    return null;
  }

  const { leaf, localCodeUnitOffset, position } = resolvedLeaf;
  const startUtf8 = Number(leaf.dataset.start ?? "0");
  const endUtf8 = Number(leaf.dataset.end ?? String(startUtf8));
  const text = leaf.dataset.empty === "true" ? "" : leaf.textContent ?? "";

  if (leaf.dataset.empty === "true") {
    return startUtf8;
  }

  if (position === "start") {
    return startUtf8;
  }

  if (position === "end") {
    return endUtf8;
  }

  return startUtf8 + utf8BytesForCodeUnitOffset(text, localCodeUnitOffset);
}

function resolveLeafForNode(
  root: HTMLElement,
  node: Node,
  offset: number
):
  | {
      leaf: HTMLElement;
      localCodeUnitOffset: number;
      position: "within" | "start" | "end";
    }
  | null {
  if (node.nodeType === Node.TEXT_NODE) {
    const textNode = node as Text;
    const leaf = textNode.parentElement?.closest<HTMLElement>("[data-leaf='true']");
    if (!leaf) {
      return null;
    }

    return {
      leaf,
      localCodeUnitOffset: Math.min(offset, textNode.data.length),
      position: "within"
    };
  }

  const element = node instanceof HTMLElement ? node : node.parentElement;
  if (!element) {
    return null;
  }

  const directLeaf = element.closest<HTMLElement>("[data-leaf='true']");
  if (directLeaf && root.contains(directLeaf)) {
    return {
      leaf: directLeaf,
      localCodeUnitOffset: 0,
      position: offset <= 0 ? "start" : "end"
    };
  }

  const childNodes = Array.from(element.childNodes);
  if (offset < childNodes.length) {
    const nextLeaf = findFirstLeaf(childNodes[offset]);
    if (nextLeaf) {
      return {
        leaf: nextLeaf,
        localCodeUnitOffset: 0,
        position: "start"
      };
    }
  }

  if (offset > 0 && offset - 1 < childNodes.length) {
    const previousLeaf = findLastLeaf(childNodes[offset - 1]);
    if (previousLeaf) {
      return {
        leaf: previousLeaf,
        localCodeUnitOffset: previousLeaf.textContent?.length ?? 0,
        position: "end"
      };
    }
  }

  const leaves = collectLeafMaps(root);
  if (!leaves.length) {
    return null;
  }

  const fallback = offset <= 0 ? leaves[0].element : leaves[leaves.length - 1].element;
  return {
    leaf: fallback,
    localCodeUnitOffset: 0,
    position: offset <= 0 ? "start" : "end"
  };
}

function findFirstLeaf(node: Node | undefined): HTMLElement | null {
  if (!node) {
    return null;
  }

  if (node instanceof HTMLElement && node.dataset.leaf === "true") {
    return node;
  }

  const children = Array.from(node.childNodes);
  for (const child of children) {
    const found = findFirstLeaf(child);
    if (found) {
      return found;
    }
  }

  return null;
}

function findLastLeaf(node: Node | undefined): HTMLElement | null {
  if (!node) {
    return null;
  }

  if (node instanceof HTMLElement && node.dataset.leaf === "true") {
    return node;
  }

  const children = Array.from(node.childNodes).reverse();
  for (const child of children) {
    const found = findLastLeaf(child);
    if (found) {
      return found;
    }
  }

  return null;
}
