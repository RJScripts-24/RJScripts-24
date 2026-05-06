const fs = require("fs");
const path = require("path");

const { Resvg } = require("@resvg/resvg-js");
const { PNG } = require("pngjs");
const { GIFEncoder, quantize, applyPalette } = require("gifenc");

// Generates an animated GIF for GitHub README reliability.
// Frames are rendered by calling office/generate-svg.js with FRAME/FRAMES env vars.

const ROOT = path.join(__dirname, "..");
const OFFICE_SVG_PATH = path.join(ROOT, "office", "base-office.svg");
const OUT_GIF_PATH = path.join(ROOT, "office", "neural-office.gif");

// Keep in sync with office/generate-svg.js
const WIDTH = 560;
const HEIGHT = 400;

const LOOP_SECONDS = Number(process.env.LOOP_SECONDS || 8);
// Smaller size: fewer frames + fewer colors.
const FPS = Number(process.env.FPS || 6);
const FRAMES = Math.max(1, Math.round(LOOP_SECONDS * FPS));

function runGenerateSvg(frame) {
  // require the generator file and execute it as a separate node process
  // so FRAME/FRAMES apply cleanly.
  const { spawnSync } = require("child_process");
  const res = spawnSync(process.execPath, ["office/generate-svg.js"], {
    cwd: ROOT,
    env: { ...process.env, FRAME: String(frame), FRAMES: String(FRAMES) },
    stdio: "pipe",
    encoding: "utf8",
  });
  if (res.status !== 0) {
    throw new Error(`generate-svg.js failed (frame ${frame}): ${res.stderr || res.stdout}`);
  }
}

function svgToRgba(svgText) {
  const resvg = new Resvg(svgText, {
    fitTo: { mode: "width", value: WIDTH },
  });
  const pngData = resvg.render().asPng();
  const png = PNG.sync.read(pngData);
  return png.data; // Uint8Array RGBA
}

function main() {
  const encoder = GIFEncoder();
  const frames = [];

  for (let i = 0; i < FRAMES; i++) {
    if (i % Math.max(1, Math.floor(FRAMES / 8)) === 0) {
      console.log(`[gif] rendering frame ${i + 1}/${FRAMES}`);
    }
    runGenerateSvg(i);
    const svg = fs.readFileSync(OFFICE_SVG_PATH, "utf8");
    const rgba = svgToRgba(svg);
    frames.push(rgba);
  }

  // Global palette (smaller size vs per-frame palettes)
  const palette = quantize(frames[0], 64); // smaller palette => smaller GIF

  for (let i = 0; i < frames.length; i++) {
    const indexed = applyPalette(frames[i], palette);
    encoder.writeFrame(indexed, WIDTH, HEIGHT, {
      palette,
      delay: Math.round(1000 / FPS),
      transparent: false,
    });
  }

  encoder.finish();
  const buffer = Buffer.from(encoder.bytes());
  fs.writeFileSync(OUT_GIF_PATH, buffer);
  console.log(`GIF written: ${OUT_GIF_PATH} (${buffer.length} bytes)`);
}

main();

