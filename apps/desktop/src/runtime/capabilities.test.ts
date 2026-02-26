import { describe, expect, it } from "vitest";
import {
  DesktopOnlyError,
  detectRuntimeMode,
  getRuntimeCapabilities
} from "./capabilities";

describe("runtime capabilities", () => {
  it("returns web mode when tauri internals are absent", () => {
    const originalWindow = (globalThis as { window?: unknown }).window;
    (globalThis as { window?: unknown }).window = {};

    expect(detectRuntimeMode()).toBe("web");

    if (originalWindow === undefined) {
      delete (globalThis as { window?: unknown }).window;
    } else {
      (globalThis as { window?: unknown }).window = originalWindow;
    }
  });

  it("returns tauri mode when tauri internals are present", () => {
    const originalWindow = (globalThis as { window?: unknown }).window;
    (globalThis as { window?: { __TAURI_INTERNALS__?: object } }).window = {
      __TAURI_INTERNALS__: {}
    };

    expect(detectRuntimeMode()).toBe("tauri");

    if (originalWindow === undefined) {
      delete (globalThis as { window?: unknown }).window;
    } else {
      (globalThis as { window?: unknown }).window = originalWindow;
    }
  });

  it("maps web and tauri capability sets correctly", () => {
    expect(getRuntimeCapabilities("web")).toEqual({
      fileIO: false,
      export: false,
      fileWatch: false
    });

    expect(getRuntimeCapabilities("tauri")).toEqual({
      fileIO: true,
      export: true,
      fileWatch: true
    });
  });

  it("uses explicit desktop-only error messages", () => {
    expect(new DesktopOnlyError("save file").message).toContain("Desktop-only feature");
  });
});
