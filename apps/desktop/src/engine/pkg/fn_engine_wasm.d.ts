/* tslint:disable */
/* eslint-disable */

export class EngineHandle {
    free(): void;
    [Symbol.dispose](): void;
    apply_command(command: string): string;
    markdown(): string;
    constructor(markdown: string);
    redo(): string;
    replace_text(start_utf8: number, end_utf8: number, insert: string): string;
    set_markdown(markdown: string): string;
    set_selection(anchor_utf8: number, head_utf8: number): string;
    snapshot(): string;
    undo(): string;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_enginehandle_free: (a: number, b: number) => void;
    readonly enginehandle_apply_command: (a: number, b: number, c: number) => [number, number, number, number];
    readonly enginehandle_markdown: (a: number) => [number, number];
    readonly enginehandle_new: (a: number, b: number) => number;
    readonly enginehandle_redo: (a: number) => [number, number, number, number];
    readonly enginehandle_replace_text: (a: number, b: number, c: number, d: number, e: number) => [number, number, number, number];
    readonly enginehandle_set_markdown: (a: number, b: number, c: number) => [number, number, number, number];
    readonly enginehandle_set_selection: (a: number, b: number, c: number) => [number, number, number, number];
    readonly enginehandle_snapshot: (a: number) => [number, number, number, number];
    readonly enginehandle_undo: (a: number) => [number, number, number, number];
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
