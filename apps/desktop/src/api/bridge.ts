import { invoke } from "@tauri-apps/api/core";
import type {
  AppConfig,
  ExportResponse,
  OpenFileResponse,
  SaveFileResponse,
  WatchStartedResponse
} from "../types/contracts";

export async function openFile(path: string): Promise<OpenFileResponse> {
  return invoke<OpenFileResponse>("open_file", { path });
}

export async function saveFile(
  path: string,
  content: string,
  expectedVersion: number
): Promise<SaveFileResponse> {
  return invoke<SaveFileResponse>("save_file", {
    path,
    content,
    expectedVersion
  });
}

export async function saveAsFile(path: string, content: string): Promise<SaveFileResponse> {
  return invoke<SaveFileResponse>("save_as_file", {
    path,
    content
  });
}

export async function exportHtml(path: string, content: string): Promise<ExportResponse> {
  return invoke<ExportResponse>("export_html", { path, content });
}

export async function exportPdf(path: string, content: string): Promise<ExportResponse> {
  return invoke<ExportResponse>("export_pdf", { path, content });
}

export async function watchFile(path: string): Promise<WatchStartedResponse> {
  return invoke<WatchStartedResponse>("watch_file", { path });
}

export async function loadAppConfig(): Promise<AppConfig> {
  return invoke<AppConfig>("load_app_config");
}
