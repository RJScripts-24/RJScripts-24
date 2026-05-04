const fs = require("fs");
const path = require("path");

const configPath = path.join(__dirname, "agent-config.json");
const statePath = path.join(__dirname, "office-state.json");
const svgPath = path.join(__dirname, "base-office.svg");

const WIDTH = 1100;
const HEIGHT = 640;
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

function xmlAttrUrl(url) {
  return String(url).replace(/&/g, "&amp;");
}

function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

function shuffledBySeed(items, seed) {
  const arr = [...items];
  let s = seed || 1;
  for (let i = arr.length - 1; i > 0; i -= 1) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const config = readJson(configPath);
const state = readJson(statePath);
const agents = config.agents.filter((a) => ["frontend", "backend", "database", "devops"].includes(a.id));

const deskPos = {
  frontend: { x: 110, y: 120 },
  backend: { x: 790, y: 120 },
  database: { x: 130, y: 390 },
  devops: { x: 790, y: 390 },
};

for (const a of agents) a.scenePosition = deskPos[a.id];

const commitSeed = hashSeed(String(state.lastCommit?.sha || state.lastCommit?.message || "neural-office"));
const orderedIds = shuffledBySeed(["frontend", "backend", "database", "devops"], commitSeed);
const turnBySpeaker = {};
for (const turn of state.conversation?.turns || []) {
  if (!turnBySpeaker[turn.speakerId]) turnBySpeaker[turn.speakerId] = turn;
}

function renderSprite(agent, scale = 1) {
  return `
  <g class="agent-sprite" transform="scale(${scale})">
    <rect x="12" y="2" width="24" height="23" fill="#223047"/>
    <rect x="15" y="8" width="18" height="17" fill="#ffd7a8"/>
    <rect x="18" y="15" width="4" height="4" fill="#111827"/>
    <rect x="28" y="15" width="4" height="4" fill="#111827"/>
    <rect x="11" y="31" width="26" height="32" fill="${agent.accentColor}"/>
    <rect x="6" y="35" width="8" height="24" fill="${agent.accentColor}" class="arm-left"/>
    <rect x="34" y="35" width="8" height="24" fill="${agent.accentColor}" class="arm-right"/>
    <rect x="14" y="63" width="8" height="19" fill="#151b28" class="leg-left"/>
    <rect x="27" y="63" width="8" height="19" fill="#151b28" class="leg-right"/>
  </g>`;
}

function bubbleForAgent(agent, phaseIdx) {
  const turn = turnBySpeaker[agent.id];
  if (!turn) return "";
  const line = short(turn.text || "Reviewing latest commit details.", 44);
  const x = agent.scenePosition.x + 18;
  const y = agent.scenePosition.y - 78;
  const delay = phaseIdx * 6;
  return `
  <g class="head-bubble" style="animation-delay:${delay}s" transform="translate(${x} ${y})">
    <rect x="0" y="0" width="152" height="48" rx="8" fill="#f8fafc" stroke="${agent.accentColor}" stroke-width="2"/>
    <path d="M66 48 l8 11 l8 -11" fill="#f8fafc" stroke="${agent.accentColor}" stroke-width="2"/>
    <text x="76" y="16" class="bubble-speaker">${esc((turn.speakerName || agent.name).toUpperCase())}</text>
    <text x="76" y="32" class="bubble-line">${esc(line)}</text>
  </g>`;
}

function renderDesk(agent, phaseIdx) {
  const st = state.agents?.[agent.id] || {};
  const pos = agent.scenePosition;
  const href = xmlAttrUrl(INTERACTIVE_URL);
  return `
  <a href="${href}" xlink:href="${href}" target="_blank" rel="noopener">
    <g class="desk-group" transform="translate(${pos.x} ${pos.y})">
      <rect class="hover-outline" x="-24" y="-60" width="220" height="220" rx="10" fill="transparent" stroke="${agent.accentColor}" stroke-width="2" opacity="0"/>
      ${bubbleForAgent(agent, phaseIdx)}
      <rect x="24" y="-28" width="128" height="24" rx="3" fill="#0b0f17" stroke="${agent.accentColor}" stroke-width="2"/>
      <text x="88" y="-11" class="agent-label">${esc(agent.name.toUpperCase().replace(/ /g, "_"))}</text>
      <rect x="18" y="55" width="140" height="80" rx="8" fill="#8b4f2f" stroke="#2e1d18" stroke-width="5"/>
      <rect x="55" y="74" width="64" height="38" rx="4" fill="#151b28" stroke="#293548" stroke-width="4"/>
      <rect x="62" y="82" width="50" height="22" fill="${agent.accentColor}" class="screen-pulse"/>
      <ellipse cx="86" cy="155" rx="66" ry="12" fill="#111827" opacity="0.42"/>
      <text x="88" y="166" class="tiny">${esc(short(st.lastLine || "Monitoring latest commit", 30))}</text>
      <g transform="translate(62 -20)">${renderSprite(agent)}</g>
    </g>
  </a>`;
}

function walkerRoute(fromId, toId) {
  const from = deskPos[fromId];
  const to = deskPos[toId];
  const startX = from.x + 62;
  const startY = from.y - 20;
  const meetX = (from.x + to.x) / 2;
  const meetY = (from.y + to.y) / 2 + 10;
  return `${startX} ${startY}; ${meetX} ${meetY}; ${to.x + 62} ${to.y - 20}; ${startX} ${startY}`;
}

function renderWalkers() {
  const cycle = 24;
  return orderedIds
    .map((fromId, idx) => {
      const toId = orderedIds[(idx + 1) % orderedIds.length];
      const agent = agents.find((a) => a.id === fromId);
      if (!agent) return "";
      const delay = idx * (cycle / 4);
      const values = walkerRoute(fromId, toId);
      return `
      <g class="walker-seq" style="animation-delay:${delay}s">
        <animateTransform attributeName="transform" type="translate" values="${values}" dur="${cycle}s" begin="0s" repeatCount="indefinite"/>
        <ellipse cx="22" cy="91" rx="20" ry="6" fill="#0b1220" opacity="0.45"/>
        ${renderSprite(agent, 0.9)}
      </g>`;
    })
    .join("\n");
}

const tickerRaw = `${state.ticker || "Neural Office online"} | Randomized agent choreography active`;
const tickerDur = `${Math.max(20, tickerRaw.length * 0.3).toFixed(1)}s`;
const commitSha = state.lastCommit?.sha ? short(state.lastCommit.sha, 8) : "n/a";
const commitAuthor = state.lastCommit?.author || "unknown";

const desksMarkup = orderedIds
  .map((id, idx) => renderDesk(agents.find((a) => a.id === id), idx))
  .join("\n");
const walkersMarkup = renderWalkers();
const linkAttr = xmlAttrUrl(INTERACTIVE_URL);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}" role="img" aria-label="Neural Office commit conversation view">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0b1220"/>
      <stop offset="1" stop-color="#251410"/>
    </linearGradient>
    <pattern id="grid" width="34" height="34" patternUnits="userSpaceOnUse">
      <path d="M0 0 H34 M0 0 V34" stroke="#26334a" stroke-width="1" opacity="0.35"/>
    </pattern>
  </defs>
  <style><![CDATA[
    .title { font: 900 30px Consolas,Monaco,monospace; fill:#f8fafc; letter-spacing:2px; text-anchor:middle; }
    .subtitle { font: 700 12px Consolas,Monaco,monospace; fill:#9fb3c8; text-anchor:middle; }
    .agent-label { font: 900 12px Consolas,Monaco,monospace; fill:#f8fafc; text-anchor:middle; }
    .tiny { font: 700 9px Consolas,Monaco,monospace; fill:#cbd5e1; text-anchor:middle; }
    .bubble-speaker { font: 800 8px Consolas,Monaco,monospace; fill:#334155; text-anchor:middle; }
    .bubble-line { font: 700 9px Consolas,Monaco,monospace; fill:#111827; text-anchor:middle; }
    .ticker-text { font: 800 15px Consolas,Monaco,monospace; fill:#7dd3fc; animation: ticker ${tickerDur} linear infinite; }
    .screen-pulse { animation: screenPulse 1.5s linear infinite; }
    .agent-sprite { animation: bob 2.1s linear infinite; }
    .arm-left { animation: armA 0.55s steps(2) infinite; transform-origin: 10px 36px; }
    .arm-right { animation: armB 0.55s steps(2) infinite; transform-origin: 38px 36px; }
    .leg-left { animation: legA 0.45s steps(2) infinite; transform-origin: 18px 64px; }
    .leg-right { animation: legB 0.45s steps(2) infinite; transform-origin: 31px 64px; }
    .hover-outline { transition: opacity .2s; }
    a:hover .hover-outline { opacity: 0.42; }
    .meeting-glow { animation: pulse 1.8s linear infinite; }
    .head-bubble { opacity: 0; animation: speakWindow 24s linear infinite; }
    .walker-seq { opacity: 0; animation: walkerWindow 24s linear infinite; }
    @keyframes ticker { from { transform: translateX(${WIDTH}px);} to { transform: translateX(-1550px);} }
    @keyframes screenPulse { 0%,100%{opacity:.6} 50%{opacity:1} }
    @keyframes bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
    @keyframes armA { 0%,100%{transform:rotate(0)} 50%{transform:rotate(8deg)} }
    @keyframes armB { 0%,100%{transform:rotate(0)} 50%{transform:rotate(-8deg)} }
    @keyframes legA { 0%,100%{transform:rotate(0)} 50%{transform:rotate(10deg)} }
    @keyframes legB { 0%,100%{transform:rotate(10deg)} 50%{transform:rotate(0)} }
    @keyframes pulse { 0%,100%{opacity:.35} 50%{opacity:.75} }
    @keyframes speakWindow { 0%, 8%, 100% { opacity: 0; } 12%, 26% { opacity: 1; } 30%, 100% { opacity: 0; } }
    @keyframes walkerWindow { 0%, 4%, 100% { opacity: 0; } 6%, 28% { opacity: 1; } 32%, 100% { opacity: 0; } }
    @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
  ]]></style>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bgGrad)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#grid)" opacity="0.55"/>
  <rect x="32" y="62" width="${WIDTH - 64}" height="${HEIGHT - 126}" rx="20" fill="none" stroke="#26334a" stroke-width="4"/>

  <text x="${WIDTH / 2}" y="38" class="title">NEURAL OFFICE · COMMIT CHOREOGRAPHY</text>
  <text x="${WIDTH / 2}" y="58" class="subtitle">Latest commit ${esc(commitSha)} by ${esc(commitAuthor)} · sequential 4-agent discussions</text>

  <a href="${linkAttr}" xlink:href="${linkAttr}" target="_blank" rel="noopener">
    <g>
      <circle cx="430" cy="300" r="58" fill="#0f1729" stroke="#3b4e69" stroke-width="3"/>
      <circle cx="430" cy="300" r="44" class="meeting-glow" fill="#67e8f9" opacity="0.25"/>
      <text x="430" y="297" class="tiny">SYNC</text>
      <text x="430" y="311" class="tiny">ZONE</text>
    </g>
  </a>

  ${desksMarkup}
  ${walkersMarkup}

  <rect x="30" y="${HEIGHT - 42}" width="${WIDTH - 60}" height="28" rx="10" fill="#0b1220" stroke="#26334a" stroke-width="2"/>
  <svg x="42" y="${HEIGHT - 39}" width="${WIDTH - 84}" height="24" overflow="hidden">
    <text x="0" y="16" class="ticker-text">${esc(tickerRaw)}</text>
  </svg>
</svg>`;

fs.writeFileSync(svgPath, svg);
console.log(`SVG regenerated: ${svgPath}`);
