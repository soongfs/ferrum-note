import { mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const appDir = resolve(__dirname, "..");
const repoDir = resolve(appDir, "../..");
const wasmCrateManifest = resolve(repoDir, "crates/fn-engine-wasm/Cargo.toml");
const targetWasm = resolve(repoDir, "target/wasm32-unknown-unknown/release/fn_engine_wasm.wasm");
const outDir = resolve(appDir, "src/engine/pkg");

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

run(
  "cargo",
  [
    "build",
    "--manifest-path",
    wasmCrateManifest,
    "--target",
    "wasm32-unknown-unknown",
    "--release"
  ],
  repoDir
);
run("wasm-bindgen", [targetWasm, "--target", "web", "--out-dir", outDir], repoDir);

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    env: process.env
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
