import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { Jimp } from "jimp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, "..");

const defaultSource = path.join(appRoot, "branding/logo-source.png");
const source = process.argv[2] || process.env.FERRUMNOTE_BRAND_SOURCE || defaultSource;

const wordmarkOutput = path.join(appRoot, "src/assets/brand-wordmark.png");
const emblemOutput = path.join(appRoot, "src/assets/brand-emblem.png");
const iconSourceOutput = path.join(appRoot, "src-tauri/icons/app-icon-source.png");

if (!fs.existsSync(source)) {
  console.error(`Brand source image not found: ${source}`);
  console.error("Pass an explicit path: pnpm brand:prepare -- /path/to/FerrumNote.png");
  process.exit(1);
}

fs.mkdirSync(path.dirname(wordmarkOutput), { recursive: true });
fs.mkdirSync(path.dirname(emblemOutput), { recursive: true });
fs.mkdirSync(path.dirname(iconSourceOutput), { recursive: true });

const image = await Jimp.read(source);
const { width, height } = image.bitmap;
const emblemSize = Math.min(width, height);
const emblemCrop = {
  x: 0,
  y: Math.max(0, Math.floor((height - emblemSize) / 2)),
  w: emblemSize,
  h: emblemSize
};

const wordmark = image.clone().scaleToFit({ w: 920, h: 392 });
await wordmark.write(wordmarkOutput);

const emblem = image.clone().crop(emblemCrop).resize({ w: 512, h: 512 });
await emblem.write(emblemOutput);

const iconSource = image.clone().crop(emblemCrop).resize({ w: 1024, h: 1024 });
await iconSource.write(iconSourceOutput);

console.log("Generated assets:");
console.log(`- source: ${source}`);
console.log(`- ${wordmarkOutput}`);
console.log(`- ${emblemOutput}`);
console.log(`- ${iconSourceOutput}`);
