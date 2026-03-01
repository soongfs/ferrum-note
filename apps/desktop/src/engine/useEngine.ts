import { useCallback, useEffect, useRef, useState } from "react";
import { createEngine, type EngineApi } from "./adapter";
import type { EngineCommandString, EngineSnapshot } from "./types";

type UseEngineResult = {
  ready: boolean;
  error: string | null;
  snapshot: EngineSnapshot | null;
  setMarkdown: (markdown: string) => EngineSnapshot | null;
  replaceText: (startUtf8: number, endUtf8: number, insert: string) => EngineSnapshot | null;
  setSelection: (anchorUtf8: number, headUtf8: number) => EngineSnapshot | null;
  applyCommand: (command: EngineCommandString) => EngineSnapshot | null;
  undo: () => EngineSnapshot | null;
  redo: () => EngineSnapshot | null;
};

export function useEngine(
  markdown: string,
  onMarkdownChange: (nextMarkdown: string) => void
): UseEngineResult {
  const initialMarkdown = useRef(markdown);
  const [engine, setEngine] = useState<EngineApi | null>(null);
  const [snapshot, setSnapshot] = useState<EngineSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastKnownMarkdown = useRef(markdown);

  useEffect(() => {
    let cancelled = false;

    createEngine(initialMarkdown.current)
      .then((instance) => {
        if (cancelled) {
          return;
        }

        const initialSnapshot = instance.snapshot();
        lastKnownMarkdown.current = initialSnapshot.markdown;
        setEngine(instance);
        setSnapshot(initialSnapshot);
        setError(null);
      })
      .catch((reason) => {
        if (cancelled) {
          return;
        }

        setError(String(reason));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!engine) {
      return;
    }

    if (markdown === lastKnownMarkdown.current) {
      return;
    }

    try {
      const nextSnapshot = engine.setMarkdown(markdown);
      lastKnownMarkdown.current = nextSnapshot.markdown;
      setSnapshot(nextSnapshot);
      setError(null);
    } catch (reason) {
      setError(String(reason));
    }
  }, [engine, markdown]);

  const publish = useCallback(
    (nextSnapshot: EngineSnapshot | null) => {
      if (!nextSnapshot) {
        return null;
      }

      lastKnownMarkdown.current = nextSnapshot.markdown;
      setSnapshot(nextSnapshot);
      setError(null);
      if (nextSnapshot.markdown !== markdown) {
        onMarkdownChange(nextSnapshot.markdown);
      }
      return nextSnapshot;
    },
    [markdown, onMarkdownChange]
  );

  const run = useCallback(
    (executor: (instance: EngineApi) => EngineSnapshot) => {
      if (!engine) {
        return null;
      }

      try {
        return publish(executor(engine));
      } catch (reason) {
        setError(String(reason));
        return null;
      }
    },
    [engine, publish]
  );

  const setMarkdown = useCallback(
    (nextMarkdown: string) => {
      if (!engine) {
        return null;
      }

      try {
        const nextSnapshot = engine.setMarkdown(nextMarkdown);
        lastKnownMarkdown.current = nextSnapshot.markdown;
        setSnapshot(nextSnapshot);
        setError(null);
        if (nextSnapshot.markdown !== markdown) {
          onMarkdownChange(nextSnapshot.markdown);
        }
        return nextSnapshot;
      } catch (reason) {
        setError(String(reason));
        return null;
      }
    },
    [engine, markdown, onMarkdownChange]
  );

  return {
    ready: Boolean(engine && snapshot),
    error,
    snapshot,
    setMarkdown,
    replaceText: useCallback(
      (startUtf8: number, endUtf8: number, insert: string) =>
        run((instance) => instance.replaceText(startUtf8, endUtf8, insert)),
      [run]
    ),
    setSelection: useCallback(
      (anchorUtf8: number, headUtf8: number) =>
        run((instance) => instance.setSelection(anchorUtf8, headUtf8)),
      [run]
    ),
    applyCommand: useCallback(
      (command: EngineCommandString) => run((instance) => instance.applyCommand(command)),
      [run]
    ),
    undo: useCallback(() => run((instance) => instance.undo()), [run]),
    redo: useCallback(() => run((instance) => instance.redo()), [run])
  };
}
