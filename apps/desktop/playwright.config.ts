import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  use: {
    baseURL: "http://127.0.0.1:1420"
  },
  webServer: {
    command: "pnpm dev --host 127.0.0.1",
    port: 1420,
    reuseExistingServer: true,
    timeout: 120000
  }
});
