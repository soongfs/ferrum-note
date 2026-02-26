import type { AppConfig } from "../types/contracts";

export type RuntimeMode = "tauri" | "web";

export type RuntimeCapabilities = {
  fileIO: boolean;
  export: boolean;
  fileWatch: boolean;
  workspaceExplorer: boolean;
};

export class DesktopOnlyError extends Error {
  constructor(feature: string) {
    super(`Desktop-only feature unavailable in browser mode: ${feature}`);
    this.name = "DesktopOnlyError";
  }
}

export const WEB_DEFAULT_CONFIG: AppConfig = {
  autosave_ms: 1500,
  theme: "light",
  font_size: 16,
  recent_files_limit: 20,
  line_width_hint: 88,
  ui_language: "en",
  show_debug_panels: false
};

export function detectRuntimeMode(): RuntimeMode {
  if (typeof window === "undefined") {
    return "web";
  }

  const runtimeWindow = window as Window & {
    __TAURI_INTERNALS__?: unknown;
    __TAURI__?: unknown;
  };

  if (runtimeWindow.__TAURI_INTERNALS__ || runtimeWindow.__TAURI__) {
    return "tauri";
  }

  return "web";
}

export function getRuntimeCapabilities(mode: RuntimeMode): RuntimeCapabilities {
  if (mode === "tauri") {
    return {
      fileIO: true,
      export: true,
      fileWatch: true,
      workspaceExplorer: true
    };
  }

  return {
    fileIO: false,
    export: false,
    fileWatch: false,
    workspaceExplorer: false
  };
}
