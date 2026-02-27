import { invoke } from "@tauri-apps/api/core";
import type {
  AppConfig,
  ExportResponse,
  ListWorkspaceEntriesResponse,
  OpenFileResponse,
  SaveFileResponse,
  WatchStartedResponse
} from "../types/contracts";
import {
  DesktopOnlyError,
  WEB_DEFAULT_CONFIG,
  detectRuntimeMode,
  getRuntimeCapabilities
} from "../runtime/capabilities";

function ensureCapability(capability: keyof ReturnType<typeof getRuntimeCapabilities>, feature: string) {
  const runtimeMode = detectRuntimeMode();
  const runtimeCapabilities = getRuntimeCapabilities(runtimeMode);

  if (!runtimeCapabilities[capability]) {
    throw new DesktopOnlyError(feature);
  }
}

export async function openFile(path: string): Promise<OpenFileResponse> {
  ensureCapability("fileIO", "open file");
  return invoke<OpenFileResponse>("open_file", { path });
}

export async function saveFile(
  path: string,
  content: string,
  expectedVersion: number
): Promise<SaveFileResponse> {
  ensureCapability("fileIO", "save file");
  return invoke<SaveFileResponse>("save_file", {
    path,
    content,
    expectedVersion
  });
}

export async function saveAsFile(path: string, content: string): Promise<SaveFileResponse> {
  ensureCapability("fileIO", "save file as");
  return invoke<SaveFileResponse>("save_as_file", {
    path,
    content
  });
}

export async function exportHtml(path: string, content: string): Promise<ExportResponse> {
  ensureCapability("export", "export html");
  return invoke<ExportResponse>("export_html", { path, content });
}

export async function exportPdf(path: string, content: string): Promise<ExportResponse> {
  ensureCapability("export", "export pdf");
  return invoke<ExportResponse>("export_pdf", { path, content });
}

export async function watchFile(path: string): Promise<WatchStartedResponse> {
  ensureCapability("fileWatch", "watch file");
  return invoke<WatchStartedResponse>("watch_file", { path });
}

export async function loadAppConfig(): Promise<AppConfig> {
  if (detectRuntimeMode() === "web") {
    return WEB_DEFAULT_CONFIG;
  }
  return invoke<AppConfig>("load_app_config");
}

export async function setWorkspaceRoot(path: string): Promise<AppConfig> {
  ensureCapability("workspaceExplorer", "set workspace root");
  return invoke<AppConfig>("set_workspace_root", { path });
}

export async function listWorkspaceEntries(
  relativePath?: string
): Promise<ListWorkspaceEntriesResponse> {
  ensureCapability("workspaceExplorer", "browse workspace");
  return invoke<ListWorkspaceEntriesResponse>("list_workspace_entries", {
    relativePath: relativePath ?? null
  });
}

export async function pickWorkspaceDirectory(): Promise<string | null> {
  ensureCapability("workspaceExplorer", "open folder");
  const input = window.prompt("Enter workspace directory path", "");
  if (!input || !input.trim()) {
    return null;
  }
  return input.trim();
}
