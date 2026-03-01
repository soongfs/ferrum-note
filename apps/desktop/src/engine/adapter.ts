import type { EngineCommandString, EngineSelection, EngineSnapshot } from "./types";
import wasmUrl from "./pkg/fn_engine_wasm_bg.wasm?url";

type WasmEngineHandle = {
  snapshot(): string;
  markdown(): string;
  set_markdown(markdown: string): string;
  replace_text(start_utf8: number, end_utf8: number, insert: string): string;
  set_selection(anchor_utf8: number, head_utf8: number): string;
  apply_command(command: string): string;
  undo(): string;
  redo(): string;
};

type WasmModule = {
  default: (moduleOrPath?: string | URL | Request) => Promise<unknown>;
  EngineHandle: new (markdown: string) => WasmEngineHandle;
};

export type EngineApi = {
  snapshot: () => EngineSnapshot;
  markdown: () => string;
  setMarkdown: (markdown: string) => EngineSnapshot;
  replaceText: (startUtf8: number, endUtf8: number, insert: string) => EngineSnapshot;
  setSelection: (anchorUtf8: number, headUtf8: number) => EngineSnapshot;
  applyCommand: (command: EngineCommandString) => EngineSnapshot;
  undo: () => EngineSnapshot;
  redo: () => EngineSnapshot;
};

let wasmModulePromise: Promise<WasmModule> | null = null;
let wasmInitPromise: Promise<void> | null = null;

async function loadWasmModule(): Promise<WasmModule> {
  if (!wasmModulePromise) {
    wasmModulePromise = import("./pkg/fn_engine_wasm") as Promise<WasmModule>;
  }

  const module = await wasmModulePromise;
  if (!wasmInitPromise) {
    wasmInitPromise = module.default(wasmUrl).then(() => undefined);
  }

  await wasmInitPromise;
  return module;
}

function parseSnapshot(payload: string): EngineSnapshot {
  return JSON.parse(payload) as EngineSnapshot;
}

export async function createEngine(markdown: string): Promise<EngineApi> {
  const module = await loadWasmModule();
  const handle = new module.EngineHandle(markdown);

  return {
    snapshot: () => parseSnapshot(handle.snapshot()),
    markdown: () => handle.markdown(),
    setMarkdown: (nextMarkdown) => parseSnapshot(handle.set_markdown(nextMarkdown)),
    replaceText: (startUtf8, endUtf8, insert) =>
      parseSnapshot(handle.replace_text(startUtf8, endUtf8, insert)),
    setSelection: (anchorUtf8, headUtf8) =>
      parseSnapshot(handle.set_selection(anchorUtf8, headUtf8)),
    applyCommand: (command) => parseSnapshot(handle.apply_command(command)),
    undo: () => parseSnapshot(handle.undo()),
    redo: () => parseSnapshot(handle.redo())
  };
}

export function collapseSelection(offset: number): EngineSelection {
  return {
    anchor_utf8: offset,
    head_utf8: offset
  };
}
