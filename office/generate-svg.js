const fs = require("fs");
const path = require("path");

const configPath = path.join(__dirname, "agent-config.json");
const statePath = path.join(__dirname, "office-state.json");
const svgPath = path.join(__dirname, "base-office.svg");

const WIDTH = 860;
const HEIGHT = 600;
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
  headerH: 64,
  floorTop: 90,
  footerH: 46,
};

const DESKS = {
  frontend: { x: 92,  y: 130 },
  backend:  { x: 550, y: 130 },
  database: { x: 92,  y: 360 },
  devops:   { x: 550, y: 360 },
};

// ?? State reading ??????????????????????????????????????????????????????????????

const config = readJson(configPath);
const state  = readJson(statePath);

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

const tickerRaw = `${state.ticker || "Neural Office online"} | Static pixel office scene`;
const commitSha    = state.lastCommit?.sha ? short(state.lastCommit.sha, 8) : "n/a";
const commitAuthor = state.lastCommit?.author || "unknown";
const commitMsg    = state.lastCommit?.message ? short(state.lastCommit.message, 64) : "no message";

// ?? Drawing helpers ????????????????????????????????????????????????????????????

function drawLabelTag(x, y, text, accent = "#ffffff") {
  const w = Math.max(70, text.length * 8 + 20);
  return `<g>
    <rect x="${x}" y="${y}" width="${w}" height="22" rx="6" fill="#0b1220" stroke="${accent}" stroke-width="2"/>
    <text x="${x + w / 2}" y="${y + 15}" font-size="11" font-family="monospace" font-weight="900"
      fill="#e2e8f0" text-anchor="middle">${esc(text)}</text>
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
  parts.push(`<rect x="28" y="14" width="70" height="40" rx="6" fill="#111827" stroke="#334155" stroke-width="2"/>`);
  parts.push(`<text x="63" y="38" font-size="10" font-family="monospace" fill="#7dd3fc" text-anchor="middle">NEURAL</text>`);
  parts.push(`<rect x="760" y="14" width="72" height="40" rx="6" fill="#111827" stroke="#334155" stroke-width="2"/>`);
  parts.push(`<text x="796" y="38" font-size="10" font-family="monospace" fill="#fbbf24" text-anchor="middle">OFFICE</text>`);
  return parts.join("\n");
}

function drawDeskCluster(x, y, role) {
  const c = ROLE_COLORS[role] || ROLE_COLORS.devops;
  const parts = [];
  parts.push(`<rect x="${x}" y="${y + 48}" width="250" height="22" rx="8" fill="#7c5a3a" stroke="#5a3e28" stroke-width="2"/>`);
  parts.push(`<rect x="${x + 12}" y="${y + 70}" width="226" height="78" rx="10" fill="#6b4e2e"/>`);
  parts.push(`<rect x="${x + 92}" y="${y + 10}" width="92" height="58" rx="10" fill="#0f172a" stroke="#334155" stroke-width="2"/>`);
  parts.push(`<rect x="${x + 98}" y="${y + 16}" width="80" height="46" rx="8" fill="${c.accent}" opacity="0.25"/>`);
  parts.push(`<rect x="${x + 134}" y="${y + 68}" width="10" height="18" rx="3" fill="#475569"/>`);
  parts.push(`<rect x="${x + 104}" y="${y + 86}" width="68" height="12" rx="4" fill="#334155"/>`);
  parts.push(`<rect x="${x + 26}" y="${y + 62}" width="34" height="52" rx="10" fill="#111827" opacity="0.65"/>`);
  parts.push(`<rect x="${x + 200}" y="${y + 82}" width="14" height="16" rx="3" fill="#0f172a"/>`);
  parts.push(`<rect x="${x + 214}" y="${y + 86}" width="6" height="8" rx="3" fill="none" stroke="#94a3b8" stroke-width="2"/>`);
  parts.push(`<rect x="${x + 28}" y="${y + 30}" width="14" height="12" rx="3" fill="#14532d"/>`);
  parts.push(`<circle cx="${x + 35}" cy="${y + 26}" r="7" fill="#22c55e" opacity="0.9"/>`);
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

  return `<g transform="translate(${x} ${y})">
    <rect x="10" y="6" width="34" height="30" rx="8" fill="#0b1220" opacity="0.55"/>
    <rect x="14" y="10" width="26" height="22" rx="6" fill="${palette.skin}"/>
    <rect x="14" y="10" width="26" height="6" rx="6" fill="${palette.hair}"/>
    <rect x="20" y="20" width="6" height="6" rx="2" fill="#ffffff"/>
    <rect x="30" y="20" width="6" height="6" rx="2" fill="#ffffff"/>
    <rect x="22" y="22" width="3" height="3" rx="1" fill="#111827"/>
    <rect x="32" y="22" width="3" height="3" rx="1" fill="#111827"/>

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

function drawSpeechBox(x, y, role, text) {
  const c = ROLE_COLORS[role] || ROLE_COLORS.frontend;
  const msg = truncate(text, 34);
  const w = 200;
  const h = 36;
  return `<g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#0f172a" stroke="${c.accent}" stroke-width="2"/>
    <text x="${x + 10}" y="${y + 22}" font-size="11" font-family="monospace" fill="#ffffff">${esc(msg)}</text>
  </g>`;
}

// ?? Main SVG ???????????????????????????????????????????????????????????????????

const linkAttr = xmlAttrUrl(INTERACTIVE_URL);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
  width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}"
  role="img" aria-label="Neural Office — static pixel office scene">
  <defs>
    <linearGradient id="hdrGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#0a1628"/>
      <stop offset="1" stop-color="#0b1220"/>
    </linearGradient>
  </defs>

  ${drawWall()}
  ${drawFloor()}

  <!-- Header -->
  <rect x="0" y="0" width="${WIDTH}" height="${ROOM.headerH}" fill="url(#hdrGrad)"/>
  <text x="${WIDTH / 2}" y="30" font-size="18" font-family="monospace" font-weight="900"
    fill="#f8fafc" text-anchor="middle" letter-spacing="2">NEURAL OFFICE · PIXEL FLOOR</text>
  <text x="${WIDTH / 2}" y="50" font-size="10" font-family="monospace"
    fill="#9fb3c8" text-anchor="middle">commit ${esc(commitSha)} by ${esc(commitAuthor)} · ${esc(commitMsg)}</text>

  <!-- Desks -->
  ${drawDeskCluster(DESKS.frontend.x, DESKS.frontend.y, "frontend")}
  ${drawDeskCluster(DESKS.backend.x,  DESKS.backend.y,  "backend")}
  ${drawDeskCluster(DESKS.database.x, DESKS.database.y, "database")}
  ${drawDeskCluster(DESKS.devops.x,   DESKS.devops.y,   "devops")}

  <!-- Main agents -->
  ${drawLabelTag(DESKS.frontend.x + 18, DESKS.frontend.y - 10, "FRONTEND_AGENT", ROLE_COLORS.frontend.accent)}
  ${drawAgentSprite(DESKS.frontend.x + 46, DESKS.frontend.y + 36, "frontend")}
  ${drawSpeechBox(DESKS.frontend.x + 18, DESKS.frontend.y + 150, "frontend", speechLines.frontend)}

  ${drawLabelTag(DESKS.backend.x + 48, DESKS.backend.y - 10, "BACKEND_AGENT", ROLE_COLORS.backend.accent)}
  ${drawAgentSprite(DESKS.backend.x + 74, DESKS.backend.y + 36, "backend")}
  ${drawSpeechBox(DESKS.backend.x + 48, DESKS.backend.y + 150, "backend", speechLines.backend)}

  ${drawLabelTag(DESKS.database.x + 18, DESKS.database.y - 10, "DATABASE_AGENT", ROLE_COLORS.database.accent)}
  ${drawAgentSprite(DESKS.database.x + 46, DESKS.database.y + 36, "database")}
  ${drawSpeechBox(DESKS.database.x + 18, DESKS.database.y + 150, "database", speechLines.database)}

  ${drawLabelTag(DESKS.devops.x + 66, DESKS.devops.y - 10, "DEVOPS_AGENT", ROLE_COLORS.devops.accent)}
  ${drawAgentSprite(DESKS.devops.x + 92, DESKS.devops.y + 36, "devops")}
  ${drawSpeechBox(DESKS.devops.x + 66, DESKS.devops.y + 150, "devops", speechLines.devops)}

  <!-- NPCs -->
  ${drawLabelTag(250, 96, "PM_AGENT", "#e879f9")}
  ${drawAgentSprite(258, 110, "pm")}

  ${drawLabelTag(382, 286, "NEW_HIRE!", "#fbbf24")}
  ${drawAgentSprite(376, 300, "intern")}

  ${drawLabelTag(744, 332, "QA_AGENT", "#22c55e")}
  ${drawAgentSprite(742, 346, "qa")}

  ${drawLabelTag(704, 96, "MEMORY (SESSION 2)", "#93c5fd")}
  <g transform="translate(770 110)">
    <rect x="0" y="10" width="52" height="56" rx="14" fill="#0b1220" opacity="0.55"/>
    <rect x="8" y="18" width="36" height="32" rx="10" fill="#1f2937"/>
    <circle cx="20" cy="34" r="4" fill="#93c5fd"/>
    <circle cx="32" cy="34" r="4" fill="#93c5fd"/>
    <rect x="16" y="52" width="20" height="10" rx="5" fill="#64748b"/>
  </g>

  <!-- Task arrows -->
  ${drawArrow(328, 140, 540, 140, "#2dd4bf")}
  ${drawArrow(340, 410, 540, 410, "#60a5fa")}
  ${drawArrow(470, 320, 700, 320, "#34d399")}

  <!-- Footer / ticker -->
  <rect x="0" y="${HEIGHT - ROOM.footerH}" width="${WIDTH}" height="${ROOM.footerH}" fill="#070e1c" opacity="0.98"/>
  <rect x="0" y="${HEIGHT - ROOM.footerH}" width="${WIDTH}" height="1" fill="#1e2d45"/>
  <text x="18" y="${HEIGHT - 18}" font-size="12" font-family="monospace" font-weight="800" fill="#7dd3fc">
    ${esc(tickerRaw)}
  </text>

  <!-- Click-through badge (not full overlay) -->
  <a href="${linkAttr}" xlink:href="${linkAttr}" target="_blank" rel="noopener">
    <rect x="${WIDTH - 210}" y="18" width="190" height="26" rx="10" fill="rgba(0,0,0,0.25)" stroke="#334155" stroke-width="2"/>
    <text x="${WIDTH - 115}" y="36" font-size="11" font-family="monospace" fill="#e2e8f0" text-anchor="middle">OPEN_INTERACTIVE_VIEW</text>
  </a>
</svg>`;

fs.writeFileSync(svgPath, svg);
console.log(`SVG regenerated: ${svgPath} (${Buffer.byteLength(svg, "utf8")} bytes)`);
