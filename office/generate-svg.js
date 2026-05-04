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

function xmlAttrUrl(url) {
  return String(url).replace(/&/g, "&amp;");
}

function short(text, max) {
  const s = String(text ?? "");
  return s.length > max ? `${s.slice(0, max - 3)}...` : s;
}

const config = readJson(configPath);
const state = readJson(statePath);
const agents = config.agents
  .filter((a) => a.id !== "master")
  .map((a) => ({ ...a }));

const scenePositions = {
  frontend: { x: 110, y: 120 },
  backend: { x: 790, y: 120 },
  database: { x: 130, y: 390 },
  devops: { x: 790, y: 390 },
};

for (const agent of agents) {
  agent.scenePosition = scenePositions[agent.id] || { x: 450, y: 380 };
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

function renderDesk(agent) {
  const s = state.agents?.[agent.id] || {};
  const pos = agent.scenePosition;
  const link = xmlAttrUrl(INTERACTIVE_URL);
  return `
  <a href="${link}" xlink:href="${link}" target="_blank" rel="noopener">
    <g class="desk-group" transform="translate(${pos.x} ${pos.y})">
      <rect class="hover-outline" x="-24" y="-60" width="220" height="220" rx="10" fill="transparent" stroke="${agent.accentColor}" stroke-width="2" opacity="0"/>
      <rect x="24" y="-28" width="128" height="24" rx="3" fill="#0b0f17" stroke="${agent.accentColor}" stroke-width="2"/>
      <text x="88" y="-11" class="agent-label">${esc(agent.name.toUpperCase().replace(/ /g, "_"))}</text>
      <rect x="18" y="55" width="140" height="80" rx="8" fill="#8b4f2f" stroke="#2e1d18" stroke-width="5"/>
      <rect x="55" y="74" width="64" height="38" rx="4" fill="#151b28" stroke="#293548" stroke-width="4"/>
      <rect x="62" y="82" width="50" height="22" fill="${agent.accentColor}" class="screen-pulse"/>
      <ellipse cx="86" cy="155" rx="66" ry="12" fill="#111827" opacity="0.42"/>
      <text x="88" y="166" class="tiny">${esc(short(s.lastLine || "Monitoring latest commit", 30))}</text>
      <g transform="translate(62 -20)">${renderSprite(agent)}</g>
    </g>
  </a>`;
}

function renderConversationPanel() {
  const conversation = state.conversation || { headline: "No conversation", turns: [] };
  const turns = (conversation.turns || []).slice(0, 4);
  const turnMarkup = turns
    .map((t, i) => {
      const y = 152 + i * 48;
      return `<text x="850" y="${y}" class="turn-speaker">${esc((t.speakerName || t.speakerId || "Agent").toUpperCase())}</text>
      <text x="850" y="${y + 15}" class="turn-text">${esc(short(t.text || "", 48))}</text>`;
    })
    .join("\n");

  return `
  <g>
    <rect x="700" y="92" width="358" height="250" rx="12" fill="#111827" stroke="#2f3b52" stroke-width="3"/>
    <text x="720" y="118" class="panel-title">LATEST COMMIT DISCUSSION</text>
    <text x="720" y="136" class="panel-sub">${esc(short(state.conversation?.headline || "", 56))}</text>
    ${turnMarkup}
  </g>`;
}

function renderWalkers() {
  const plan = state.animationPlan || {};
  const routes = Array.isArray(plan.walkerRoutes) && plan.walkerRoutes.length > 0
    ? plan.walkerRoutes
    : [
        { agentId: "frontend", pathValues: "172 130; 430 300; 172 130", dur: "14s", delay: "0s" },
        { agentId: "backend", pathValues: "852 130; 430 300; 852 130", dur: "15s", delay: "1s" },
      ];

  return routes
    .slice(0, 2)
    .map((r) => {
      const agent = agents.find((a) => a.id === r.agentId) || agents[0];
      return `
      <g class="walker" aria-label="${esc(agent.name)} walker">
        <animateTransform attributeName="transform" type="translate" values="${esc(r.pathValues)}" dur="${esc(r.dur || "14s")}" begin="${esc(r.delay || "0s")}" repeatCount="indefinite"/>
        <ellipse cx="22" cy="91" rx="20" ry="6" fill="#0b1220" opacity="0.45"/>
        ${renderSprite(agent, 0.9)}
      </g>`;
    })
    .join("\n");
}

const tickerRaw = `${state.ticker || "Neural Office online"} | Click preview to open interactive office`;
const tickerDur = `${Math.max(20, tickerRaw.length * 0.28).toFixed(1)}s`;
const desksMarkup = agents.map(renderDesk).join("\n");
const walkersMarkup = renderWalkers();
const linkAttr = xmlAttrUrl(INTERACTIVE_URL);
const commitSha = state.lastCommit?.sha ? short(state.lastCommit.sha, 8) : "n/a";
const commitAuthor = state.lastCommit?.author || "unknown";

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
    .title { font: 900 32px Consolas,Monaco,monospace; fill:#f8fafc; letter-spacing:2px; text-anchor:middle; }
    .subtitle { font: 700 12px Consolas,Monaco,monospace; fill:#9fb3c8; text-anchor:middle; }
    .agent-label { font: 900 12px Consolas,Monaco,monospace; fill:#f8fafc; text-anchor:middle; }
    .tiny { font: 700 9px Consolas,Monaco,monospace; fill:#cbd5e1; text-anchor:middle; }
    .panel-title { font: 900 12px Consolas,Monaco,monospace; fill:#7dd3fc; }
    .panel-sub { font: 700 10px Consolas,Monaco,monospace; fill:#dbeafe; }
    .turn-speaker { font: 800 10px Consolas,Monaco,monospace; fill:#f8fafc; }
    .turn-text { font: 700 10px Consolas,Monaco,monospace; fill:#9fb3c8; }
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
    @keyframes ticker { from { transform: translateX(${WIDTH}px);} to { transform: translateX(-1600px);} }
    @keyframes screenPulse { 0%,100%{opacity:.6} 50%{opacity:1} }
    @keyframes bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
    @keyframes armA { 0%,100%{transform:rotate(0)} 50%{transform:rotate(8deg)} }
    @keyframes armB { 0%,100%{transform:rotate(0)} 50%{transform:rotate(-8deg)} }
    @keyframes legA { 0%,100%{transform:rotate(0)} 50%{transform:rotate(10deg)} }
    @keyframes legB { 0%,100%{transform:rotate(10deg)} 50%{transform:rotate(0)} }
    @keyframes pulse { 0%,100%{opacity:.35} 50%{opacity:.75} }
    @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
  ]]></style>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bgGrad)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#grid)" opacity="0.55"/>
  <rect x="32" y="62" width="${WIDTH - 64}" height="${HEIGHT - 126}" rx="20" fill="none" stroke="#26334a" stroke-width="4"/>

  <text x="${WIDTH / 2}" y="38" class="title">NEURAL OFFICE · COMMIT CHOREOGRAPHY</text>
  <text x="${WIDTH / 2}" y="58" class="subtitle">Latest commit ${esc(commitSha)} by ${esc(commitAuthor)} · agents discuss then return to desks</text>

  <a href="${linkAttr}" xlink:href="${linkAttr}" target="_blank" rel="noopener">
    <g>
      <circle cx="430" cy="300" r="58" fill="#0f1729" stroke="#3b4e69" stroke-width="3"/>
      <circle cx="430" cy="300" r="44" class="meeting-glow" fill="#67e8f9" opacity="0.25"/>
      <text x="430" y="297" class="tiny">SYNC</text>
      <text x="430" y="311" class="tiny">ZONE</text>
    </g>
  </a>

  ${desksMarkup}
  ${renderConversationPanel()}
  ${walkersMarkup}

  <rect x="30" y="${HEIGHT - 42}" width="${WIDTH - 60}" height="28" rx="10" fill="#0b1220" stroke="#26334a" stroke-width="2"/>
  <svg x="42" y="${HEIGHT - 39}" width="${WIDTH - 84}" height="24" overflow="hidden">
    <text x="0" y="16" class="ticker-text">${esc(tickerRaw)}</text>
  </svg>
</svg>`;

fs.writeFileSync(svgPath, svg);
console.log(`SVG regenerated: ${svgPath}`);
