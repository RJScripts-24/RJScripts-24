const fs = require("fs");
const path = require("path");

const configPath = path.join(__dirname, "agent-config.json");
const statePath = path.join(__dirname, "office-state.json");
const svgPath = path.join(__dirname, "base-office.svg");

// Smaller GIF artboard (README-friendly)
const WIDTH = 560;
const HEIGHT = 400;
const INTERACTIVE_URL = "https://rjscripts-24.github.io/RJScripts-24/office/interactive-office.html";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function short(text, max) {
  const s = String(text ?? "");
  return s.length > max ? `${s.slice(0, max - 3)}...` : s;
}

function truncate(str, max = 34) {
  if (!str) return "Reviewing commit...";
  return str.length > max ? str.slice(0, max - 1) + "\u2026" : str;
}

function xmlAttrUrl(url) {
  return String(url).replace(/&/g, "&amp;");
}

const ROLE_COLORS = {
  frontend: { shirt: "#38bdf8", hair: "#0ea5e9", skin: "#fbbf24", badge: "#fff", accent: "#38bdf8" },
  backend:  { shirt: "#34d399", hair: "#10b981", skin: "#fbbf24", badge: "#fff", accent: "#34d399" },
  database: { shirt: "#a78bfa", hair: "#7c3aed", skin: "#fbbf24", badge: "#fff", accent: "#a78bfa" },
  devops:   { shirt: "#fb923c", hair: "#ea580c", skin: "#fbbf24", badge: "#fff", accent: "#fb923c" },
};

const ROOM = {
  headerH: 36,
  floorTop: 58,
  footerH: 0,
};

const DESKS = {
  frontend: { x: 40,  y: 80 },
  backend:  { x: 310, y: 80 },
  database: { x: 40,  y: 210 },
  devops:   { x: 310, y: 210 },
};

// ?? State reading ??????????????????????????????????????????????????????????????

const config = readJson(configPath);
const state  = readJson(statePath);

const FRAME = Number(process.env.FRAME || 0);
const FRAMES = Math.max(1, Number(process.env.FRAMES || 1));
const t = FRAMES > 1 ? (FRAME % FRAMES) / FRAMES : 0;
const TAU = Math.PI * 2;

const rawAgents = state.agents || {};
function getSpeechLine(role) {
  const val = rawAgents[role];
  if (typeof val === "string") return val;
  if (val && typeof val === "object" && val.lastLine) return val.lastLine;
  return null;
}

const speechLines = {
  frontend: getSpeechLine("frontend") || "CI pipeline green",
  backend:  getSpeechLine("backend")  || "API schema updated",
  database: getSpeechLine("database") || "Migration complete",
  devops:   getSpeechLine("devops")   || "Deploy to prod done",
};

// Commit/state text is intentionally NOT rendered in the README animation.

function prng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function hashStr(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function lerp(a, b, p) {
  return a + (b - a) * p;
}

function roam(kind, baseX, baseY, radiusX, radiusY) {
  // Deterministic ùrandom arbitrary orderù path per agent.
  const rand = prng(hashStr(kind));
  const points = [];
  for (let i = 0; i < 5; i++) {
    points.push({
      x: baseX + (rand() * 2 - 1) * radiusX,
      y: baseY + (rand() * 2 - 1) * radiusY,
    });
  }
  const segs = points.length - 1;
  const p = FRAMES > 1 ? (FRAME % FRAMES) / FRAMES : 0;
  const segFloat = p * segs;
  const seg = Math.min(segs - 1, Math.floor(segFloat));
  const segP = segFloat - seg;
  const a = points[seg];
  const b = points[seg + 1];
  const e = segP * segP * (3 - 2 * segP);
  return { x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e) };
}

// ?? Drawing helpers ????????????????????????????????????????????????????????????

function drawLabelTag(x, y, text, accent = "#ffffff") {
  const w = Math.max(70, text.length * 8 + 20);
  return `<g>
    <rect x="${x}" y="${y}" width="${w}" height="22" rx="6" fill="#0b1220" stroke="${accent}" stroke-width="2"/>
    <text x="${x + w / 2}" y="${y + 15}" font-size="11" font-family="monospace" font-weight="900"
      fill="#e2e8f0" text-anchor="middle">${esc(text)}</text>
  </g>`;
}

// Minimal 5x7 pixel font (A-Z, 0-9, _, space, !)
const PIX = {
  "A": ["01110","10001","10001","11111","10001","10001","10001"],
  "B": ["11110","10001","11110","10001","10001","10001","11110"],
  "C": ["01111","10000","10000","10000","10000","10000","01111"],
  "D": ["11110","10001","10001","10001","10001","10001","11110"],
  "E": ["11111","10000","11110","10000","10000","10000","11111"],
  "F": ["11111","10000","11110","10000","10000","10000","10000"],
  "G": ["01111","10000","10000","10011","10001","10001","01110"],
  "H": ["10001","10001","11111","10001","10001","10001","10001"],
  "I": ["11111","00100","00100","00100","00100","00100","11111"],
  "J": ["00111","00010","00010","00010","00010","10010","01100"],
  "K": ["10001","10010","11100","10010","10001","10001","10001"],
  "L": ["10000","10000","10000","10000","10000","10000","11111"],
  "M": ["10001","11011","10101","10001","10001","10001","10001"],
  "N": ["10001","11001","10101","10011","10001","10001","10001"],
  "O": ["01110","10001","10001","10001","10001","10001","01110"],
  "P": ["11110","10001","10001","11110","10000","10000","10000"],
  "Q": ["01110","10001","10001","10001","10101","10010","01101"],
  "R": ["11110","10001","10001","11110","10010","10001","10001"],
  "S": ["01111","10000","10000","01110","00001","00001","11110"],
  "T": ["11111","00100","00100","00100","00100","00100","00100"],
  "U": ["10001","10001","10001","10001","10001","10001","01110"],
  "V": ["10001","10001","10001","10001","10001","01010","00100"],
  "W": ["10001","10001","10001","10001","10101","11011","10001"],
  "X": ["10001","01010","00100","00100","00100","01010","10001"],
  "Y": ["10001","01010","00100","00100","00100","00100","00100"],
  "Z": ["11111","00001","00010","00100","01000","10000","11111"],
  "0": ["01110","10001","10011","10101","11001","10001","01110"],
  "1": ["00100","01100","00100","00100","00100","00100","01110"],
  "2": ["01110","10001","00001","00010","00100","01000","11111"],
  "3": ["11110","00001","00001","01110","00001","00001","11110"],
  "4": ["00010","00110","01010","10010","11111","00010","00010"],
  "5": ["11111","10000","11110","00001","00001","10001","01110"],
  "6": ["00110","01000","10000","11110","10001","10001","01110"],
  "7": ["11111","00001","00010","00100","01000","01000","01000"],
  "8": ["01110","10001","10001","01110","10001","10001","01110"],
  "9": ["01110","10001","10001","01111","00001","00010","01100"],
  "_": ["00000","00000","00000","00000","00000","00000","11111"],
  "!": ["00100","00100","00100","00100","00100","00000","00100"],
  " ": ["00000","00000","00000","00000","00000","00000","00000"],
};

function drawPixelText(x, y, text, color = "#e2e8f0", scale = 2) {
  const s = String(text || "").toUpperCase();
  const parts = [];
  let cx = x;
  for (const ch of s) {
    const g = PIX[ch] || PIX[" "];
    for (let row = 0; row < g.length; row++) {
      const line = g[row];
      for (let col = 0; col < line.length; col++) {
        if (line[col] === "1") {
          parts.push(`<rect x="${cx + col * scale}" y="${y + row * scale}" width="${scale}" height="${scale}" fill="${color}"/>`);
        }
      }
    }
    cx += (5 + 1) * scale; // glyph + spacing
  }
  return `<g>${parts.join("")}</g>`;
}

function drawLabelTagPixel(x, y, text, accent = "#ffffff") {
  // Pill with pixel-font text (no <text> element)
  const scale = 2;
  const w = Math.max(70, text.length * (6 * scale) + 18);
  const h = 22;
  const tx = x + 10;
  const ty = y + 6;
  return `<g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="#0b1220" stroke="${accent}" stroke-width="2"/>
    ${drawPixelText(tx, ty, text, "#e2e8f0", scale)}
  </g>`;
}

function drawArrow(x1, y1, x2, y2, color = "#2dd4bf") {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.max(1, Math.hypot(dx, dy));
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy;
  const py = ux;
  const head = 10;
  const tailW = 4;
  const hx = x2 - ux * head;
  const hy = y2 - uy * head;
  const p1x = x1 + px * tailW;
  const p1y = y1 + py * tailW;
  const p2x = x1 - px * tailW;
  const p2y = y1 - py * tailW;
  const p3x = hx - px * tailW;
  const p3y = hy - py * tailW;
  const p4x = hx + px * tailW;
  const p4y = hy + py * tailW;
  return `<g opacity="0.95">
    <polygon points="${p1x.toFixed(1)},${p1y.toFixed(1)} ${p2x.toFixed(1)},${p2y.toFixed(1)} ${p3x.toFixed(1)},${p3y.toFixed(1)} ${p4x.toFixed(1)},${p4y.toFixed(1)}"
      fill="${color}"/>
    <polygon points="${x2},${y2} ${(hx + px * 9).toFixed(1)},${(hy + py * 9).toFixed(1)} ${(hx - px * 9).toFixed(1)},${(hy - py * 9).toFixed(1)}"
      fill="${color}"/>
  </g>`;
}

function drawParticles() {
  // small pixel particles drifting (frame-based)
  const rand = prng(1337);
  const parts = [];
  for (let i = 0; i < 18; i++) {
    const baseX = 12 + rand() * (WIDTH - 24);
    const baseY = ROOM.floorTop + 8 + rand() * (HEIGHT - ROOM.floorTop - 20);
    const sp = 6 + rand() * 16;
    const dy = -Math.round(((FRAME % FRAMES) / Math.max(1, FRAMES)) * sp * 10) / 10;
    parts.push(`<rect x="${baseX.toFixed(0)}" y="${(baseY + dy).toFixed(0)}" width="2" height="2" fill="rgba(125,211,252,0.55)"/>`);
  }
  return `<g>${parts.join("")}</g>`;
}

function drawScanlines() {
  // subtle scanlines for pixel feel
  const parts = [];
  const offset = (FRAME % 6);
  for (let y = ROOM.floorTop + offset; y < HEIGHT; y += 6) {
    parts.push(`<rect x="0" y="${y}" width="${WIDTH}" height="1" fill="rgba(0,0,0,0.10)"/>`);
  }
  return `<g>${parts.join("")}</g>`;
}

function drawFloor() {
  const top = ROOM.floorTop;
  const plankH = 14;
  const n = Math.ceil((HEIGHT - top - ROOM.footerH) / plankH);
  const parts = [];
  parts.push(`<rect x="0" y="${top}" width="${WIDTH}" height="${HEIGHT - top}" fill="#3b2414"/>`);
  for (let i = 0; i < n; i++) {
    const y = top + i * plankH;
    const shade = i % 2 === 0 ? "#402715" : "#3a2313";
    parts.push(`<rect x="0" y="${y}" width="${WIDTH}" height="${plankH}" fill="${shade}"/>`);
    parts.push(`<rect x="0" y="${y + plankH - 1}" width="${WIDTH}" height="1" fill="rgba(255,255,255,0.05)"/>`);
    for (let j = 0; j < 6; j++) {
      const seamX = 40 + j * 140 + (i % 3) * 12;
      parts.push(`<rect x="${seamX}" y="${y + 2}" width="2" height="${plankH - 4}" fill="rgba(0,0,0,0.12)"/>`);
    }
  }
  return parts.join("\n");
}

function drawWall() {
  const parts = [];
  parts.push(`<rect x="0" y="0" width="${WIDTH}" height="${ROOM.floorTop}" fill="#0b1220"/>`);
  parts.push(`<rect x="0" y="${ROOM.floorTop - 4}" width="${WIDTH}" height="4" fill="#111c33"/>`);
  parts.push(`<rect x="0" y="0" width="${WIDTH}" height="2" fill="rgba(255,255,255,0.05)"/>`);
  // Left/right poster blocks (pixelated, no words)
  parts.push(`<rect x="16" y="10" width="70" height="32" rx="6" fill="#111827" stroke="#334155" stroke-width="2"/>`);
  parts.push(`<rect x="24" y="18" width="10" height="10" rx="2" fill="#7dd3fc" opacity="0.9"/>`);
  parts.push(`<rect x="38" y="18" width="40" height="4" rx="2" fill="#334155"/>`);
  parts.push(`<rect x="38" y="26" width="34" height="4" rx="2" fill="#334155"/>`);

  parts.push(`<rect x="${WIDTH - 86}" y="10" width="70" height="32" rx="6" fill="#111827" stroke="#334155" stroke-width="2"/>`);
  parts.push(`<rect x="${WIDTH - 78}" y="18" width="10" height="10" rx="2" fill="#fbbf24" opacity="0.9"/>`);
  parts.push(`<rect x="${WIDTH - 64}" y="18" width="40" height="4" rx="2" fill="#334155"/>`);
  parts.push(`<rect x="${WIDTH - 64}" y="26" width="30" height="4" rx="2" fill="#334155"/>`);
  return parts.join("\n");
}

function drawDeskCluster(x, y, role) {
  const c = ROLE_COLORS[role] || ROLE_COLORS.devops;
  const parts = [];
  parts.push(`<rect x="${x}" y="${y + 34}" width="200" height="18" rx="7" fill="#7c5a3a" stroke="#5a3e28" stroke-width="2"/>`);
  parts.push(`<rect x="${x + 10}" y="${y + 52}" width="180" height="60" rx="10" fill="#6b4e2e"/>`);
  parts.push(`<rect x="${x + 74}" y="${y + 6}" width="74" height="46" rx="10" fill="#0f172a" stroke="#334155" stroke-width="2"/>`);
  const glow = 0.16 + 0.14 * (0.5 + 0.5 * Math.sin(TAU * t + (role.charCodeAt(0) % 7)));
  parts.push(`<rect x="${x + 79}" y="${y + 11}" width="64" height="36" rx="8" fill="${c.accent}" opacity="${glow.toFixed(2)}"/>`);
  parts.push(`<rect x="${x + 108}" y="${y + 52}" width="8" height="14" rx="3" fill="#475569"/>`);
  parts.push(`<rect x="${x + 84}" y="${y + 66}" width="56" height="10" rx="4" fill="#334155"/>`);
  parts.push(`<rect x="${x + 18}" y="${y + 46}" width="30" height="44" rx="10" fill="#111827" opacity="0.65"/>`);
  parts.push(`<rect x="${x + 158}" y="${y + 64}" width="12" height="14" rx="3" fill="#0f172a"/>`);
  parts.push(`<rect x="${x + 170}" y="${y + 68}" width="5" height="7" rx="3" fill="none" stroke="#94a3b8" stroke-width="2"/>`);
  parts.push(`<rect x="${x + 20}" y="${y + 22}" width="12" height="10" rx="3" fill="#14532d"/>`);
  parts.push(`<circle cx="${x + 26}" cy="${y + 18}" r="6" fill="#22c55e" opacity="0.9"/>`);
  return `<g>${parts.join("\n")}</g>`;
}

function drawAgentSprite(x, y, kind) {
  const palette = {
    frontend: { shirt: ROLE_COLORS.frontend.shirt, hair: "#0ea5e9", skin: "#fbbf24" },
    backend:  { shirt: ROLE_COLORS.backend.shirt,  hair: "#10b981", skin: "#fbbf24" },
    database: { shirt: ROLE_COLORS.database.shirt, hair: "#7c3aed", skin: "#fbbf24" },
    devops:   { shirt: ROLE_COLORS.devops.shirt,   hair: "#ea580c", skin: "#fbbf24" },
    pm:       { shirt: "#f472b6", hair: "#f97316", skin: "#fbbf24" },
    intern:   { shirt: "#e2e8f0", hair: "#1f2937", skin: "#fbbf24" },
    qa:       { shirt: "#22c55e", hair: "#16a34a", skin: "#fbbf24" },
    memory:   { shirt: "#94a3b8", hair: "#64748b", skin: "#93c5fd" },
  }[kind] || { shirt: "#60a5fa", hair: "#334155", skin: "#fbbf24" };

  const phase = (kind.charCodeAt(0) % 9) * 0.37;
  const bob = Math.round(Math.sin(TAU * t + phase) * 2);
  const blink = (Math.floor((t * 8 + phase) % 8) === 0); // 1 frame blink
  return `<g transform="translate(${x} ${y + bob})">
    <rect x="10" y="6" width="34" height="30" rx="8" fill="#0b1220" opacity="0.55"/>
    <rect x="14" y="10" width="26" height="22" rx="6" fill="${palette.skin}"/>
    <rect x="14" y="10" width="26" height="6" rx="6" fill="${palette.hair}"/>
    <rect x="20" y="20" width="6" height="${blink ? 2 : 6}" rx="2" fill="#ffffff"/>
    <rect x="30" y="20" width="6" height="${blink ? 2 : 6}" rx="2" fill="#ffffff"/>
    ${blink ? "" : `<rect x="22" y="22" width="3" height="3" rx="1" fill="#111827"/>
    <rect x="32" y="22" width="3" height="3" rx="1" fill="#111827"/>`}

    <path d="M13 38 h28 c6 0 10 4 10 10 v12 c0 6-4 10-10 10 H13 c-6 0-10-4-10-10 V48 c0-6 4-10 10-10 z"
      fill="${palette.shirt}"/>
    <rect x="22" y="52" width="14" height="10" rx="3" fill="rgba(255,255,255,0.55)"/>

    <rect x="8" y="44" width="10" height="22" rx="6" fill="${palette.shirt}"/>
    <rect x="40" y="44" width="10" height="22" rx="6" fill="${palette.shirt}"/>

    <rect x="18" y="70" width="10" height="24" rx="6" fill="#1e293b"/>
    <rect x="30" y="70" width="10" height="24" rx="6" fill="#1e293b"/>
    <rect x="16" y="92" width="14" height="10" rx="4" fill="#0f172a"/>
    <rect x="28" y="92" width="14" height="10" rx="4" fill="#0f172a"/>
  </g>`;
}

// (intentionally no speech boxes in GIF mode)

// ?? Main SVG ???????????????????????????????????????????????????????????????????

const linkAttr = xmlAttrUrl(INTERACTIVE_URL);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
  width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}"
  role="img" aria-label="Pixel office animation scene">
  <defs>
    <linearGradient id="hdrGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#0a1628"/>
      <stop offset="1" stop-color="#0b1220"/>
    </linearGradient>
  </defs>

  ${drawWall()}
  ${drawFloor()}
  ${drawParticles()}
  ${drawScanlines()}

  <!-- Header (pixel text) -->
  <rect x="0" y="0" width="${WIDTH}" height="${ROOM.headerH}" fill="url(#hdrGrad)"/>
  ${drawPixelText(18, 12, "LIVE SCENE", "#f8fafc", 2)}

  <!-- Desks -->
  ${drawDeskCluster(DESKS.frontend.x, DESKS.frontend.y, "frontend")}
  ${drawDeskCluster(DESKS.backend.x,  DESKS.backend.y,  "backend")}
  ${drawDeskCluster(DESKS.database.x, DESKS.database.y, "database")}
  ${drawDeskCluster(DESKS.devops.x,   DESKS.devops.y,   "devops")}

  <!-- Main agents roaming -->
  ${(() => { const p = roam("frontend", DESKS.frontend.x + 70, DESKS.frontend.y + 55, 60, 32); return drawLabelTagPixel(DESKS.frontend.x + 8, DESKS.frontend.y - 14, "FRONTEND", ROLE_COLORS.frontend.accent) + "\\n" + drawAgentSprite(p.x, p.y, "frontend"); })()}
  ${(() => { const p = roam("backend", DESKS.backend.x + 78, DESKS.backend.y + 55, 60, 32); return drawLabelTagPixel(DESKS.backend.x + 16, DESKS.backend.y - 14, "BACKEND", ROLE_COLORS.backend.accent) + "\\n" + drawAgentSprite(p.x, p.y, "backend"); })()}
  ${(() => { const p = roam("database", DESKS.database.x + 70, DESKS.database.y + 55, 60, 32); return drawLabelTagPixel(DESKS.database.x + 8, DESKS.database.y - 14, "DATABASE", ROLE_COLORS.database.accent) + "\\n" + drawAgentSprite(p.x, p.y, "database"); })()}
  ${(() => { const p = roam("devops", DESKS.devops.x + 78, DESKS.devops.y + 55, 60, 32); return drawLabelTagPixel(DESKS.devops.x + 24, DESKS.devops.y - 14, "DEVOPS", ROLE_COLORS.devops.accent) + "\\n" + drawAgentSprite(p.x, p.y, "devops"); })()}

  <!-- NPCs roaming -->
  ${(() => { const p = roam("pm", WIDTH * 0.30, ROOM.floorTop + 34, 45, 22); return drawLabelTagPixel(140, 38, "PM", "#e879f9") + "\\n" + drawAgentSprite(p.x, p.y, "pm"); })()}
  ${(() => { const p = roam("intern", WIDTH * 0.48, ROOM.floorTop + 112, 55, 30); return drawLabelTagPixel(220, 148, "NEW_HIRE", "#fbbf24") + "\\n" + drawAgentSprite(p.x, p.y, "intern"); })()}
  ${(() => { const p = roam("qa", WIDTH * 0.76, ROOM.floorTop + 124, 45, 26); return drawLabelTagPixel(WIDTH - 92, 160, "QA", "#22c55e") + "\\n" + drawAgentSprite(p.x, p.y, "qa"); })()}

  ${drawLabelTagPixel(WIDTH - 126, 38, "MEMORY", "#93c5fd")}
  <g transform="translate(${WIDTH - 86} 56)">
    <rect x="0" y="10" width="52" height="56" rx="14" fill="#0b1220" opacity="0.55"/>
    <rect x="8" y="18" width="36" height="32" rx="10" fill="#1f2937"/>
    <circle cx="20" cy="34" r="4" fill="#93c5fd"/>
    <circle cx="32" cy="34" r="4" fill="#93c5fd"/>
    <rect x="16" y="52" width="20" height="10" rx="5" fill="#64748b"/>
  </g>

  <!-- Task arrows -->
  <g opacity="${(0.65 + 0.25 * Math.sin(TAU * t)).toFixed(2)}">
    ${drawArrow(210, 110, 300, 110, "#2dd4bf")}
  </g>
  <g opacity="${(0.65 + 0.25 * Math.sin(TAU * t + 1.7)).toFixed(2)}">
    ${drawArrow(210, 250, 300, 250, "#60a5fa")}
  </g>
  <g opacity="${(0.65 + 0.25 * Math.sin(TAU * t + 3.2)).toFixed(2)}">
    ${drawArrow(290, 190, 420, 190, "#34d399")}
  </g>

  <!-- no external link / badge in README GIF -->
</svg>`;

fs.writeFileSync(svgPath, svg);
console.log(`SVG regenerated: ${svgPath} (${Buffer.byteLength(svg, "utf8")} bytes)`);
