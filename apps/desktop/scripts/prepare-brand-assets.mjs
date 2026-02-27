import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { Jimp } from "jimp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, "..");

const source = process.argv[2] || "/home/soongfs/FerrumNote.png";

const WORDMARK_CROP = { x: 160, y: 180, w: 1220, h: 520 };
const EMBLEM_CROP = { x: 220, y: 220, w: 360, h: 360 };

const wordmarkOutput = path.join(appRoot, "src/assets/brand-wordmark.png");
const emblemOutput = path.join(appRoot, "src/assets/brand-emblem.png");
const iconSourceOutput = path.join(appRoot, "src-tauri/icons/app-icon-source.png");

const image = await Jimp.read(source);

const wordmark = image.clone().crop(WORDMARK_CROP).resize({ w: 920, h: 392 });
await wordmark.write(wordmarkOutput);

const emblem = image.clone().crop(EMBLEM_CROP).resize({ w: 512, h: 512 });
await emblem.write(emblemOutput);

const iconSource = image.clone().crop(EMBLEM_CROP).resize({ w: 1024, h: 1024 });
await iconSource.write(iconSourceOutput);

console.log("Generated assets:");
console.log(`- ${wordmarkOutput}`);
console.log(`- ${emblemOutput}`);
console.log(`- ${iconSourceOutput}`);
