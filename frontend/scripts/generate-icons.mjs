// Generates app icons + favicon from the Restored Church brand mark.
// Run once after `npm install` and any time `public/logo.webp` changes:
//   npm -w frontend run icons
//
// Uses `sharp` (devDependency).
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(here, "..", "public");
const iconsDir = path.join(publicDir, "icons");
const source = path.join(publicDir, "logo.webp");

// Bone-white safe area matches the logo's own background and the new
// --color-bg token. Pixel-snapping with sharp gives clean edges on all icons.
const SAFE_BG = "#ffffff";

async function renderContained(outPath, size) {
  await sharp(source)
    .resize(size, size, { fit: "contain", background: SAFE_BG })
    .flatten({ background: SAFE_BG })
    .png()
    .toFile(outPath);
  console.log("Wrote", path.relative(publicDir, outPath));
}

async function renderMaskable(outPath, size, safeAreaRatio = 0.78) {
  // PWA maskable icons get cropped to a circle/squircle by the OS. Reserve
  // ~22% padding so the round badge survives the worst-case mask.
  const inner = Math.round(size * safeAreaRatio);
  const offset = Math.round((size - inner) / 2);
  const buf = await sharp(source)
    .resize(inner, inner, { fit: "contain", background: SAFE_BG })
    .flatten({ background: SAFE_BG })
    .png()
    .toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 3, background: SAFE_BG },
  })
    .composite([{ input: buf, top: offset, left: offset }])
    .png()
    .toFile(outPath);
  console.log("Wrote", path.relative(publicDir, outPath));
}

await renderContained(path.join(iconsDir, "icon-192.png"), 192);
await renderContained(path.join(iconsDir, "icon-512.png"), 512);
await renderMaskable(path.join(iconsDir, "icon-512-maskable.png"), 512);
await renderContained(path.join(iconsDir, "apple-touch-icon.png"), 180);
await renderContained(path.join(publicDir, "favicon.png"), 32);
