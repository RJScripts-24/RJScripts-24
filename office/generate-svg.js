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

const AGENT_POSITIONS = {
  frontend: { x: 140, y: 90 },
  backend:  { x: 680, y: 90 },
  database: { x: 140, y: 340 },
  devops:   { x: 680, y: 340 },
};

const WALK_POSITIONS = {
  frontend: { x: 180, y: 180 },
  backend:  { x: 720, y: 180 },
  database: { x: 180, y: 430 },
  devops:   { x: 720, y: 430 },
};

const WALK_ROUTES = [
  { from: "frontend", to: "backend"  },
  { from: "backend",  to: "database" },
  { from: "database", to: "devops"   },
  { from: "devops",   to: "frontend" },
];

const SCENE_DURATION = 10;
const TOTAL_CYCLE = 40;

// ?? State reading ??????????????????????????????????????????????????????????????

const config = readJson(configPath);
const state  = readJson(statePath);

// Extract speech lines ù Stage 4 writes strings; before that they may be objects
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

const SCENE_SPEECH = [
  { speaker: "frontend", pauseBegin: 2.5,  text: speechLines.frontend },
  { speaker: "backend",  pauseBegin: 12.5, text: speechLines.backend  },
  { speaker: "database", pauseBegin: 22.5, text: speechLines.database },
  { speaker: "devops",   pauseBegin: 32.5, text: speechLines.devops   },
];

const tickerRaw = `${state.ticker || "Neural Office online"} | Pixel agent choreography active`;
const tickerDur = `${Math.max(20, tickerRaw.length * 0.3).toFixed(1)}s`;
const commitSha    = state.lastCommit?.sha ? short(state.lastCommit.sha, 8) : "n/a";
const commitAuthor = state.lastCommit?.author || "unknown";

// ?? Drawing functions ??????????????????????????????????????????????????????????

function drawPixelAgent(x, y, role, label) {
  const c = ROLE_COLORS[role] || ROLE_COLORS.devops;

  // All measurements relative to anchor (x,y) = top-left of head
  const headX   = x - 14;        // head width=28, centered on x
  const headY   = y;
  const eyeBaseY = headY + 8;
  const neckX   = x - 5;         // neck width=10, centered on x
  const neckY   = headY + 24;
  const torsoX  = x - 18;        // torso width=36, centered on x
  const torsoY  = neckY + 8;
  const armLX   = torsoX - 10;   // left arm
  const armRX   = torsoX + 36;   // right arm
  const armY    = torsoY + 2;
  const legLX   = x - 14;        // left leg width=14
  const legRX   = x;             // right leg width=14
  const legY    = torsoY + 32;
  const shoeLX  = legLX - 1;     // shoes width=16
  const shoeRX  = legRX - 1;
  const shoeY   = legY + 28;

  // label box width based on text length
  const labelText = label || role.toUpperCase() + " AGENT";
  const labelW    = labelText.length * 8 + 16;
  const labelX    = x - labelW / 2;
  const labelY    = headY - 28;

  return `<g>
    <!-- label -->
    <rect x="${labelX}" y="${labelY}" width="${labelW}" height="20" rx="10"
      fill="#0f172a" stroke="${c.accent}" stroke-width="2"/>
    <text x="${x}" y="${labelY + 14}" font-size="11" font-family="monospace"
      fill="${c.accent}" text-anchor="middle">${esc(labelText)}</text>

    <!-- head -->
    <rect x="${headX}" y="${headY}" width="28" height="24" rx="4" fill="${c.skin}"/>
    <!-- hair strip -->
    <rect x="${headX}" y="${headY}" width="28" height="6" rx="4" fill="${c.hair}"/>
    <!-- left eye white -->
    <rect x="${headX + 6}" y="${eyeBaseY}" width="6" height="6" fill="#ffffff"/>
    <!-- right eye white -->
    <rect x="${headX + 16}" y="${eyeBaseY}" width="6" height="6" fill="#ffffff"/>
    <!-- left pupil -->
    <rect x="${headX + 7}" y="${eyeBaseY + 1}" width="4" height="4" fill="#111827"/>
    <!-- right pupil -->
    <rect x="${headX + 17}" y="${eyeBaseY + 1}" width="4" height="4" fill="#111827"/>

    <!-- neck -->
    <rect x="${neckX}" y="${neckY}" width="10" height="8" fill="${c.skin}"/>

    <!-- torso -->
    <rect x="${torsoX}" y="${torsoY}" width="36" height="32" rx="2" fill="${c.shirt}"/>
    <!-- badge -->
    <rect x="${torsoX + 12}" y="${torsoY + 12}" width="12" height="8" rx="2"
      fill="${c.badge}" opacity="0.7"/>

    <!-- left arm -->
    <rect x="${armLX}" y="${armY}" width="10" height="28" rx="4" fill="${c.shirt}"
      transform="rotate(-8, ${armLX + 5}, ${armY})"/>
    <!-- right arm -->
    <rect x="${armRX}" y="${armY}" width="10" height="28" rx="4" fill="${c.shirt}"
      transform="rotate(8, ${armRX + 5}, ${armY})"/>

    <!-- left leg -->
    <rect x="${legLX}" y="${legY}" width="14" height="28" rx="4" fill="#1e293b"/>
    <!-- right leg -->
    <rect x="${legRX}" y="${legY}" width="14" height="28" rx="4" fill="#1e293b"/>

    <!-- left shoe -->
    <rect x="${shoeLX}" y="${shoeY}" width="16" height="10" rx="3" fill="#0f172a"/>
    <!-- right shoe -->
    <rect x="${shoeRX}" y="${shoeY}" width="16" height="10" rx="3" fill="#0f172a"/>
  </g>`;
}

function drawDesk(x, y, role) {
  const c = ROLE_COLORS[role] || ROLE_COLORS.devops;
  // x,y = left edge of desk surface
  const surfaceW = 120;
  const bodyW    = 100;
  const bodyX    = x + (surfaceW - bodyW) / 2;
  const monW     = 60;
  const monH     = 40;
  const monX     = x + (surfaceW - monW) / 2;
  const monY     = y - 16 - monH - 16;   // above stand, above desk surface
  const standX   = x + (surfaceW - 8) / 2;
  const standY   = monY + monH;
  const kbdX     = x + (surfaceW - 50) / 2;
  const kbdY     = y - 2;

  return `<g>
    <!-- desk body -->
    <rect x="${bodyX}" y="${y + 16}" width="${bodyW}" height="40" rx="4"
      fill="#6b4e2e"/>
    <!-- desk surface -->
    <rect x="${x}" y="${y}" width="${surfaceW}" height="16" rx="4"
      fill="#7c5a3a" stroke="#5a3e28" stroke-width="1"/>
    <!-- monitor stand -->
    <rect x="${standX}" y="${standY}" width="8" height="16" fill="#555"/>
    <!-- monitor -->
    <rect x="${monX}" y="${monY}" width="${monW}" height="${monH}" rx="6"
      fill="#0f172a" stroke="#334155" stroke-width="1.5"/>
    <!-- screen glow -->
    <rect x="${monX + 3}" y="${monY + 3}" width="${monW - 6}" height="${monH - 6}" rx="4"
      fill="${c.accent}" opacity="0.3"/>
    <!-- keyboard -->
    <rect x="${kbdX}" y="${kbdY}" width="50" height="10" rx="3" fill="#334155"/>
  </g>`;
}

function drawWalkingAgent(agentId, fromPos, toPos, sceneIndex) {
  const c = ROLE_COLORS[agentId] || ROLE_COLORS.devops;
  const beginSec   = sceneIndex * SCENE_DURATION;
  const standUpDur = 0.5;
  const walkDur    = 2;
  const pauseDur   = 3;
  const returnDur  = 2;
  const sitDownDur = 0.5;
  const totalDur   = SCENE_DURATION; // 10s

  // draw a simplified pixel agent inline (no label, smaller scale for walker)
  const wx = -14; // relative to group origin
  const wy = 0;
  const agentSprite = `
    <rect x="${wx}" y="${wy}" width="28" height="24" rx="4" fill="${c.skin}"/>
    <rect x="${wx}" y="${wy}" width="28" height="6" rx="4" fill="${c.hair}"/>
    <rect x="${wx + 6}" y="${wy + 8}" width="6" height="6" fill="#ffffff"/>
    <rect x="${wx + 16}" y="${wy + 8}" width="6" height="6" fill="#ffffff"/>
    <rect x="${wx + 7}" y="${wy + 9}" width="4" height="4" fill="#111827"/>
    <rect x="${wx + 17}" y="${wy + 9}" width="4" height="4" fill="#111827"/>
    <rect x="-5" y="${wy + 24}" width="10" height="8" fill="${c.skin}"/>
    <rect x="-18" y="${wy + 32}" width="36" height="32" rx="2" fill="${c.shirt}"/>
    <rect x="-28" y="${wy + 34}" width="10" height="28" rx="4" fill="${c.shirt}"/>
    <rect x="18" y="${wy + 34}" width="10" height="28" rx="4" fill="${c.shirt}"/>
    <rect x="-14" y="${wy + 64}" width="14" height="28" rx="4" fill="#1e293b"/>
    <rect x="0" y="${wy + 64}" width="14" height="28" rx="4" fill="#1e293b"/>
    <rect x="-15" y="${wy + 92}" width="16" height="10" rx="3" fill="#0f172a"/>
    <rect x="-1" y="${wy + 92}" width="16" height="10" rx="3" fill="#0f172a"/>`;

  const dx = toPos.x - fromPos.x;
  const dy = toPos.y - fromPos.y;

  const walkBegin   = beginSec + standUpDur;
  const pauseBegin  = walkBegin + walkDur;
  const returnBegin = pauseBegin + pauseDur;
  const sitBegin    = returnBegin + returnDur;

  return `<g id="walker-${agentId}" visibility="hidden">
    <animate attributeName="visibility" calcMode="discrete"
      values="hidden;visible;hidden"
      keyTimes="0;${beginSec / TOTAL_CYCLE};${(beginSec + totalDur) / TOTAL_CYCLE}"
      dur="${TOTAL_CYCLE}s" repeatCount="indefinite"/>

    <g transform="translate(${fromPos.x} ${fromPos.y})">
      <g id="walker-body-${agentId}">
        <!-- Stand up -->
        <animateTransform attributeName="transform" type="translate"
          values="0 0; 0 -20" dur="${standUpDur}s" begin="${beginSec}s"
          fill="freeze" calcMode="linear" repeatCount="indefinite"/>

        <!-- Walk to target -->
        <animateMotion path="M 0,-20 L ${dx},${dy - 20}" dur="${walkDur}s" begin="${walkBegin}s"
          fill="freeze" calcMode="linear" repeatCount="indefinite"/>

        <!-- Pause (hold position implicitly via freeze) -->

        <!-- Walk back -->
        <animateMotion path="M ${dx},${dy - 20} L 0,-20" dur="${returnDur}s" begin="${returnBegin}s"
          fill="freeze" calcMode="linear" repeatCount="indefinite"/>

        <!-- Sit down -->
        <animateTransform attributeName="transform" type="translate"
          values="0 -20; 0 0" dur="${sitDownDur}s" begin="${sitBegin}s"
          fill="freeze" calcMode="linear" repeatCount="indefinite"/>

        <!-- Footstep bob during forward walk -->
        <animateTransform attributeName="transform" type="translate"
          values="0 0; 0 -3; 0 0; 0 3; 0 0" dur="0.2s"
          begin="${walkBegin}s" repeatCount="${Math.round(walkDur / 0.2)}"/>

        <!-- Footstep bob during return walk -->
        <animateTransform attributeName="transform" type="translate"
          values="0 0; 0 -3; 0 0; 0 3; 0 0" dur="0.2s"
          begin="${returnBegin}s" repeatCount="${Math.round(returnDur / 0.2)}"/>

        ${agentSprite}
      </g>
    </g>
  </g>`;
}

function drawSpeechBubble(x, y, text, beginSec, durationSec) {
  const MAX_CHARS = 28;
  const truncated = truncate(text, 34);

  let line1 = truncated;
  let line2  = "";
  if (truncated.length > MAX_CHARS) {
    const breakAt = truncated.lastIndexOf(" ", MAX_CHARS) || MAX_CHARS;
    line1 = truncated.slice(0, breakAt);
    line2  = truncated.slice(breakAt + 1);
  }

  const twoLines   = line2.length > 0;
  const bubbleH    = twoLines ? 56 : 36;
  const bubbleW    = 200;
  const bubbleX    = x - bubbleW / 2;
  const bubbleY    = y - bubbleH - 12; // 12px above anchor
  const tailCX     = x;
  const tailY      = bubbleY + bubbleH;

  const disappearBegin = beginSec + durationSec - 0.3;

  return `<g id="bubble-${Math.round(beginSec)}" visibility="hidden">
    <animate attributeName="visibility" calcMode="discrete"
      values="hidden;visible;hidden"
      keyTimes="0;${beginSec / TOTAL_CYCLE};${(beginSec + durationSec) / TOTAL_CYCLE}"
      dur="${TOTAL_CYCLE}s" repeatCount="indefinite"/>

    <g transform-origin="${x} ${bubbleY + bubbleH / 2}">
      <animateTransform attributeName="transform" type="scale"
        from="0" to="1" begin="${beginSec}s" dur="0.3s" fill="freeze"
        additive="sum" repeatCount="indefinite" restart="always"/>
      <animateTransform attributeName="transform" type="scale"
        from="1" to="0" begin="${disappearBegin}s" dur="0.3s" fill="freeze"
        additive="sum" repeatCount="indefinite" restart="always"/>

      <!-- bubble rect -->
      <rect x="${bubbleX}" y="${bubbleY}" width="${bubbleW}" height="${bubbleH}" rx="12"
        fill="#0f172a" stroke="#ffffff" stroke-width="1.5"/>
      <!-- tail triangle -->
      <polygon points="${tailCX},${tailY + 12} ${tailCX - 10},${tailY} ${tailCX + 10},${tailY}"
        fill="#0f172a" stroke="#ffffff" stroke-width="1.5"/>

      <!-- text -->
      <text font-size="11" font-family="monospace" fill="#ffffff" text-anchor="middle">
        <tspan x="${x}" y="${bubbleY + 20}">${esc(line1)}</tspan>
        ${twoLines ? `<tspan x="${x}" dy="14">${esc(line2)}</tspan>` : ""}
      </text>
    </g>
  </g>`;
}

// ?? Particles ??????????????????????????????????????????????????????????????????

function drawParticles() {
  const particles = [];
  // Deterministic "random" using a simple LCG so SVG is stable across runs
  let seed = 42;
  function rand(min, max) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return min + (seed % (max - min));
  }

  for (let i = 0; i < 12; i++) {
    const cx  = rand(40, 820);
    const cy  = rand(100, 550);
    const dur = (4 + (i % 5)).toFixed(1);
    const del = (i * 0.7).toFixed(1);
    particles.push(
      `<circle cx="${cx}" cy="${cy}" r="2" fill="rgba(99,179,237,0.4)">
        <animateTransform attributeName="transform" type="translate"
          from="0,0" to="0,-40" dur="${dur}s" begin="${del}s"
          repeatCount="indefinite"/>
      </circle>`
    );
  }
  return particles.join("\n");
}

// ?? Floor grid ????????????????????????????????????????????????????????????????

function drawFloorGrid() {
  const lines = [];
  for (let i = 0; i < 6; i++) {
    const yPos = 260 + i * (270 / 5);
    lines.push(`<line x1="30" y1="${yPos.toFixed(0)}" x2="830" y2="${yPos.toFixed(0)}"
      stroke="#1e2d45" stroke-width="1"/>`);
  }
  return lines.join("\n");
}

// ?? Glow rings ????????????????????????????????????????????????????????????????

function drawGlowRings() {
  return WALK_ROUTES.map(({ from }, i) => {
    const pos       = AGENT_POSITIONS[from];
    const c         = ROLE_COLORS[from];
    const sceneBegin = i * SCENE_DURATION;
    return `<circle cx="${pos.x}" cy="${pos.y + 60}" r="36" fill="none"
      stroke="${c.accent}" stroke-width="2" opacity="0" id="glow-${from}" visibility="hidden">
      <animate attributeName="visibility" calcMode="discrete"
        values="hidden;visible;hidden"
        keyTimes="0;${sceneBegin / TOTAL_CYCLE};${(sceneBegin + SCENE_DURATION) / TOTAL_CYCLE}"
        dur="${TOTAL_CYCLE}s" repeatCount="indefinite"/>
      <animate attributeName="r" from="32" to="42" dur="1s"
        begin="${sceneBegin}s" repeatCount="${SCENE_DURATION}"/>
      <animate attributeName="opacity" from="0.6" to="0" dur="1s"
        begin="${sceneBegin}s" repeatCount="${SCENE_DURATION}"/>
    </circle>`;
  }).join("\n");
}

// ?? Scene indicator ???????????????????????????????????????????????????????????

function drawSceneIndicator() {
  const labels = [
    { role: "frontend", text: "\u25BA FRONTEND AGENT REPORTING", begin: 0,  end: 10 },
    { role: "backend",  text: "\u25BA BACKEND AGENT REPORTING",  begin: 10, end: 20 },
    { role: "database", text: "\u25BA DATABASE AGENT REPORTING", begin: 20, end: 30 },
    { role: "devops",   text: "\u25BA DEVOPS AGENT REPORTING",   begin: 30, end: 40 },
  ];

  return labels.map(({ role, text, begin, end }) => {
    const c = ROLE_COLORS[role];
    return `<text x="430" y="75" font-size="10" font-family="monospace"
      fill="${c.accent}" text-anchor="middle" visibility="hidden">
      <animate attributeName="visibility" calcMode="discrete"
        values="hidden;visible;hidden"
        keyTimes="0;${begin / TOTAL_CYCLE};${end / TOTAL_CYCLE}"
        dur="${TOTAL_CYCLE}s" repeatCount="indefinite"/>
      ${esc(text)}
    </text>`;
  }).join("\n");
}

// ?? Main SVG assembly ?????????????????????????????????????????????????????????

const desksMarkup = ["frontend", "backend", "database", "devops"].map(role => {
  const pos = AGENT_POSITIONS[role];
  // desk anchor: agent sits slightly overlapping the desk top
  // agent body anchor = pos, desk top = pos.y + agentBodyHeight
  const agentBodyH = 24 + 8 + 32 + 28 + 10; // head+neck+torso+legs+shoes ? 102
  const deskY = pos.y + 80; // place desk about 80px below head anchor
  return `${drawDesk(pos.x - 60, deskY, role)}
${drawPixelAgent(pos.x, pos.y, role, role.toUpperCase() + " AGENT")}`;
}).join("\n");

const walkersMarkup = WALK_ROUTES.map(({ from, to }, i) => {
  return drawWalkingAgent(from, WALK_POSITIONS[from], WALK_POSITIONS[to], i);
}).join("\n");

const bubblesMarkup = SCENE_SPEECH.map(({ speaker, pauseBegin, text }) => {
  const targetRoute = WALK_ROUTES.find(r => r.from === speaker);
  const toPos = targetRoute ? WALK_POSITIONS[targetRoute.to] : WALK_POSITIONS[speaker];
  // bubble appears 60px above walking agent's head at target position
  const bubX = toPos.x;
  const bubY = toPos.y - 60;
  return drawSpeechBubble(bubX, bubY, truncate(text, 34), pauseBegin, 3);
}).join("\n");

const glowRings       = drawGlowRings();
const particles       = drawParticles();
const floorGrid       = drawFloorGrid();
const sceneIndicator  = drawSceneIndicator();
const linkAttr        = xmlAttrUrl(INTERACTIVE_URL);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
  width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}"
  role="img" aria-label="Neural Office ù 4 AI agents discussing your latest commit">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0b1220"/>
      <stop offset="1" stop-color="#0f1a2e"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bgGrad)"/>

  <!-- Subtle dot grid background -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="none"
    stroke="none" opacity="0.18"/>

  <!-- Floor grid lines -->
  ${floorGrid}

  <!-- Ambient particles -->
  ${particles}

  <!-- Glow rings (active agent indicator) -->
  ${glowRings}

  <!-- Title bar -->
  <rect x="0" y="0" width="${WIDTH}" height="55" fill="#0a1628" opacity="0.9"/>
  <text x="${WIDTH / 2}" y="28" font-size="18" font-family="monospace" font-weight="900"
    fill="#f8fafc" text-anchor="middle" letter-spacing="2">NEURAL OFFICE \u00B7 COMMIT CHOREOGRAPHY</text>
  <text x="${WIDTH / 2}" y="46" font-size="10" font-family="monospace"
    fill="#9fb3c8" text-anchor="middle">commit ${esc(commitSha)} by ${esc(commitAuthor)}</text>

  <!-- Scene indicator -->
  ${sceneIndicator}

  <!-- Static desks and agents -->
  ${desksMarkup}

  <!-- Walking agents (render above static) -->
  ${walkersMarkup}

  <!-- Speech bubbles (topmost) -->
  ${bubblesMarkup}

  <!-- Ticker bar -->
  <rect x="0" y="${HEIGHT - 36}" width="${WIDTH}" height="36" fill="#070e1c" opacity="0.95"/>
  <rect x="0" y="${HEIGHT - 36}" width="${WIDTH}" height="1" fill="#1e2d45"/>
  <svg x="10" y="${HEIGHT - 26}" width="${WIDTH - 20}" height="20" overflow="hidden">
    <text x="${WIDTH}" y="14" font-size="12" font-family="monospace" font-weight="700"
      fill="#7dd3fc">
      ${esc(tickerRaw)}
      <animateTransform attributeName="transform" type="translate"
        from="${WIDTH},0" to="-${tickerRaw.length * 8},0"
        dur="${tickerDur}" repeatCount="indefinite"/>
    </text>
  </svg>

  <!-- Interactive link overlay (clickable area) -->
  <a href="${linkAttr}" xlink:href="${linkAttr}" target="_blank" rel="noopener">
    <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" fill="transparent"/>
  </a>
</svg>`;

fs.writeFileSync(svgPath, svg);
console.log(`SVG regenerated: ${svgPath} (${Buffer.byteLength(svg, "utf8")} bytes)`);
