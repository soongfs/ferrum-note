# Engine Architecture

## Scope
`fn-engine` is FerrumNote's self-hosted Markdown editing core.

Current M0 responsibilities:

- Markdown text storage
- AST generation for core Markdown blocks and inline syntax
- engine transactions (`replace_text`, command application, undo/redo)
- editor snapshot generation for the Writer surface
- plugin registry shape for future syntax/input/render extensions
- WebAssembly bridge used by the React renderer

## Runtime Split

### Rust core
- `crates/fn-engine`
- owns the document model, parser, transactions, selection state, and snapshot output

### WASM bridge
- `crates/fn-engine-wasm`
- exposes `EngineHandle` for the renderer
- serializes snapshots as JSON strings to keep the JS bridge small and explicit

### Renderer adapter
- `apps/desktop/src/engine/adapter.ts`
- loads the generated WASM package from `src/engine/pkg`
- provides typed methods for snapshot, selection, replace, command, undo, redo

## Document Model
The engine keeps:

- `RopeText`: current Markdown buffer
- `Vec<BlockNode>`: parsed block tree
- `Selection`: UTF-8 based selection offsets
- `revision`: monotonically increasing document revision

M0 uses a `String`-backed rope wrapper for simplicity. The type boundary is already in place so the storage strategy can be upgraded later without rewriting the API surface.

## Parsing Strategy
M0 parsing is intentionally narrow and deterministic.

### Block parser
Line scan for:

- headings
- paragraphs
- blockquotes
- bullet lists
- ordered lists
- fenced code blocks

### Inline parser
Second pass inside text-bearing blocks for:

- strong
- emphasis
- inline code
- links

The first implementation reparses the full document after each edit. The crate layout already separates parser, selection, transaction, and snapshot concerns so block-range incremental parsing can be introduced later.

## Transaction Model
Supported M0 transactions:

- text replacement by UTF-8 range
- toggle commands for strong/emphasis/inline code
- line-prefix commands for heading/blockquote/list
- fence insertion command
- undo/redo snapshot history

`replace_text(..., "\n")` applies input rules such as fenced-code auto-close and list continuation.

## Writer Surface Contract
The renderer consumes `EditorSnapshot` and projects it into a custom Writer DOM.

M0 deliberately prioritizes deterministic state ownership over rich WYSIWYG behavior:

- the engine owns Markdown and selection
- the renderer owns DOM projection and focus/selection mapping
- Source mode remains available through CodeMirror for raw editing

## Extension Direction
The registry shape is already present in `registry.rs`.
Future custom Markdown features should be added through:

- block syntax plugins
- inline syntax plugins
- input rule plugins
- render plugins

That keeps custom rules additive instead of turning the core parser and transaction layer into a pile of special cases.

## Build Pipeline
After changing the Rust engine or wasm wrapper:

```bash
cd apps/desktop
pnpm engine:build
```

This rebuilds the wasm target and refreshes `src/engine/pkg/*`.
