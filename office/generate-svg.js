const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'agent-config.json');
const statePath = path.join(__dirname, 'office-state.json');
const svgPath = path.join(__dirname, 'base-office.svg');

const REPO_OWNER = 'RJScripts-24';
const REPO_NAME = 'RJScripts-24';
const WIDTH = 1100;
const BASE_HEIGHT = 640;

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
}

const config = readJson(configPath);
const state = readJson(statePath);

const basePositions = {
  frontend: { x: 145, y: 150, side: 'left' },
  master: { x: 475, y: 260, side: 'center' },
  backend: { x: 790, y: 150, side: 'right' },
  database: { x: 175, y: 430, side: 'left' },
  devops: { x: 790, y: 430, side: 'right' }
};

const agents = config.agents.map((agent, index) => {
  const fallback = {
    x: 85 + ((index - 5) % 5) * 190,
    y: 545 + Math.floor(Math.max(0, index - 5) / 5) * 165,
    side: 'extra'
  };
  return { ...agent, scenePosition: basePositions[agent.id] || fallback };
});

const extraRows = Math.max(0, Math.ceil(Math.max(0, agents.length - 5) / 5));
const HEIGHT = BASE_HEIGHT + extraRows * 165;

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Full new-issue URL; only the title segment is encodeURIComponent per Issue-Ops spec. */
function buildIssueUrl(agent) {
  const title = encodeURIComponent(`Query for ${agent.name}: `);
  return `https://github.com/${REPO_OWNER}/${REPO_NAME}/issues/new?template=query_template.yml&labels=ask-agent,ask-${agent.id}&title=${title}`;
}

/** `&` must be `&amp;` inside XML/SVG attribute values. */
function xmlAttrUrl(url) {
  return String(url).replace(/&/g, '&amp;');
}

function shorten(text, max) {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

function statusMarkup(agent, agentState) {
  const color = agent.accentColor;
  const status = agentState.status || 'idle';

  if (status === 'thinking') {
    return `
      <g transform="translate(92 -58)" class="thinking-bubble">
        <path d="M0 0 h70 v28 h-26 l-8 9 -8 -9 h-28z" fill="#f5f7fb" stroke="#0b1220" stroke-width="3"/>
        <circle cx="24" cy="15" r="3.5" fill="#0b1220" class="dot-one"/>
        <circle cx="36" cy="15" r="3.5" fill="#0b1220" class="dot-two"/>
        <circle cx="48" cy="15" r="3.5" fill="#0b1220" class="dot-three"/>
      </g>`;
  }

  if (status === 'active') {
    return `
      <circle cx="83" cy="11" r="34" fill="none" stroke="${color}" stroke-width="4" class="active-aura"/>
      <circle cx="83" cy="11" r="43" fill="none" stroke="${color}" stroke-width="2" opacity="0.5" class="active-aura slow"/>`;
  }

  if (status === 'completed') {
    return `
      <g transform="translate(127 -34)" class="completed-badge">
        <circle cx="0" cy="0" r="16" fill="#2ea043" stroke="#eafff1" stroke-width="3"/>
        <path d="M-7 0 l5 6 l10 -13" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="square" stroke-linejoin="miter"/>
      </g>`;
  }

  return `<circle cx="83" cy="11" r="34" fill="none" stroke="${color}" stroke-width="3" class="idle-ring"/>`;
}

function sprite(agent, options = {}) {
  const color = agent.accentColor || '#61DAFB';
  const skin = options.skin || '#ffd7a8';
  const hair = options.hair || '#223047';
  const scale = options.scale || 1;
  const antenna = agent.id === 'master' ? `<rect x="21" y="-7" width="5" height="9" fill="#ffe66d"/><rect x="19" y="-11" width="9" height="5" fill="#fff3a6"/>` : '';
  return `
    <g class="agent-sprite" transform="scale(${scale})">
      ${antenna}
      <rect x="12" y="2" width="24" height="23" fill="${hair}"/>
      <rect x="15" y="8" width="18" height="17" fill="${skin}"/>
      <rect x="18" y="15" width="4" height="4" fill="#111827"/>
      <rect x="28" y="15" width="4" height="4" fill="#111827"/>
      <rect x="18" y="25" width="14" height="5" fill="#152033" opacity="0.55"/>
      <rect x="11" y="31" width="26" height="32" fill="${color}"/>
      <rect x="6" y="35" width="8" height="24" fill="${color}" class="arm-left"/>
      <rect x="34" y="35" width="8" height="24" fill="${color}" class="arm-right"/>
      <rect x="14" y="63" width="8" height="19" fill="#151b28" class="leg-left"/>
      <rect x="27" y="63" width="8" height="19" fill="#151b28" class="leg-right"/>
      <rect x="11" y="82" width="12" height="5" fill="#0b0f17"/>
      <rect x="26" y="82" width="12" height="5" fill="#0b0f17"/>
    </g>`;
}

/**
 * Renders a speech bubble above the agent desk when showBubble is true.
 * Positioned relative to the desk group origin (translate applied by caller).
 * deskWidth is 140px (rect starts at x=18, width=140 → centre ≈ x=88).
 */
function renderSpeechBubble(agent, agentState) {
  if (!agentState.showBubble) return '';
  const color = agent.accentColor;
  const short = esc(agentState.lastQueryShort || '');
  // Wrap at 22 chars per line, max 2 lines
  const words = short.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length > 22) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = (current + ' ' + word).trim();
    }
    if (lines.length === 2) { current = ''; break; }
  }
  if (current && lines.length < 2) lines.push(current);
  const line1 = lines[0] || '';
  const line2 = lines[1] || '';

  return `
    <g class="speech-bubble" transform="translate(23 -82)">
      <rect x="0" y="0" width="130" height="52" rx="8" fill="#f8fafc" stroke="${color}" stroke-width="2"/>
      <polygon points="55,52 65,66 75,52" fill="#f8fafc" stroke="${color}" stroke-width="2"/>
      <polygon points="56,52 74,52 65,64" fill="#f8fafc"/>
      <text x="65" y="16" style="font:900 8px Consolas,Monaco,monospace;fill:${color};text-anchor:middle;">💬 Just answered:</text>
      <text x="65" y="30" style="font:700 9px Consolas,Monaco,monospace;fill:#111827;text-anchor:middle;">${line1}</text>
      ${line2 ? `<text x="65" y="43" style="font:700 9px Consolas,Monaco,monospace;fill:#111827;text-anchor:middle;">${line2}</text>` : ''}
    </g>`;
}

function desk(agent) {
  const { x, y, side } = agent.scenePosition;
  const agentState = state.agents[agent.id] || { status: 'idle', queriesResolved: 0, showBubble: false };
  const color = agent.accentColor;
  const label = esc(agent.name.toUpperCase().replace(/ /g, '_'));
  const role = esc(shorten(agent.role, 43));
  const isMaster = agent.id === 'master';
  const bubble = renderSpeechBubble(agent, agentState);
  const masterRing = isMaster
    ? `<g class="master-orbit" transform="translate(85 22)">
        <ellipse cx="0" cy="0" rx="110" ry="72" fill="none" stroke="#ffd700" stroke-width="4" stroke-dasharray="16 12" opacity="0.9"/>
        <circle cx="110" cy="0" r="7" fill="#fff0a0"/>
      </g>`
    : '';
  const leftDeskDetails = side === 'right'
    ? `<rect x="128" y="66" width="45" height="82" fill="#243044"/><rect x="133" y="75" width="35" height="42" fill="#121826"/><rect x="139" y="82" width="23" height="26" fill="${color}" class="screen-pulse"/>`
    : `<rect x="-3" y="66" width="45" height="82" fill="#243044"/><rect x="2" y="75" width="35" height="42" fill="#121826"/><rect x="8" y="82" width="23" height="26" fill="${color}" class="screen-pulse"/>`;

  const issueHref = xmlAttrUrl(buildIssueUrl(agent));
  return `
  <a href="${issueHref}" xlink:href="${issueHref}" target="_blank" rel="noopener">
    <g class="station station-${esc(agent.id)}" transform="translate(${x} ${y})">
      <rect class="hover-outline" x="-28" y="-98" width="236" height="302" rx="10" fill="transparent" stroke="${color}" stroke-width="2" opacity="0" pointer-events="none"/>
      ${masterRing}
      ${bubble}
      <rect x="22" y="-28" width="132" height="30" rx="3" fill="#0b0f17" stroke="${color}" stroke-width="3"/>
      <text x="88" y="-8" class="agent-label">${label}</text>
      <text x="88" y="168" class="role-label">${role}</text>
      <g class="counter">
        <rect x="36" y="14" width="104" height="21" rx="10" fill="#101826" stroke="#2f3b52"/>
        <text x="88" y="29" class="counter-text">RESOLVED ${Number(agentState.queriesResolved || 0)}</text>
      </g>
      ${statusMarkup(agent, agentState)}
      <ellipse cx="86" cy="156" rx="68" ry="14" fill="#111827" opacity="0.42"/>
      <rect x="18" y="55" width="140" height="80" rx="8" fill="#8b4f2f" stroke="#2e1d18" stroke-width="5"/>
      <rect x="18" y="55" width="140" height="17" fill="#b8693d" opacity="0.82"/>
      <path d="M28 89 h120 M28 113 h120" stroke="#63331f" stroke-width="3" opacity="0.65"/>
      <rect x="36" y="126" width="18" height="26" fill="#4b2a1d"/>
      <rect x="123" y="126" width="18" height="26" fill="#4b2a1d"/>
      <rect x="54" y="74" width="64" height="38" rx="4" fill="#151b28" stroke="#293548" stroke-width="4"/>
      <rect x="61" y="81" width="50" height="24" fill="${color}" class="screen-pulse"/>
      <rect x="78" y="113" width="18" height="8" fill="#293548"/>
      <rect x="61" y="122" width="51" height="8" fill="#151b28"/>
      <rect x="55" y="139" width="62" height="6" fill="#172033"/>
      <rect x="124" y="80" width="19" height="14" fill="#f5f1df"/>
      <path d="M127 86 h12 M127 91 h9" stroke="#334155" stroke-width="2"/>
      <circle cx="132" cy="111" r="8" fill="#67e8f9" opacity="0.72"/>
      <path d="M140 111 q9 -7 13 2" fill="none" stroke="#67e8f9" stroke-width="4" opacity="0.72"/>
      ${leftDeskDetails}
      <g class="sprite-wrap" transform="translate(62 -20)">
        ${sprite(agent)}
      </g>
    </g>
  </a>`;
}

function flowLine(points, color, delay = '0s') {
  const d = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point[0]} ${point[1]}`).join(' ');
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="square" stroke-dasharray="18 16" class="data-flow" style="animation-delay:${delay}"/>`;
}

function walkingAgent(id, agent, values, dur, delay, note) {
  return `
  <g class="walker" aria-label="${esc(note)}">
    <animateTransform attributeName="transform" type="translate" values="${values}" dur="${dur}" begin="${delay}" repeatCount="indefinite"/>
    <ellipse cx="22" cy="91" rx="21" ry="6" fill="#0b1220" opacity="0.45"/>
    ${sprite(agent, { skin: '#c8f7ff', hair: '#243044', scale: 0.9 })}
  </g>`;
}

const deskSvg = agents.map(desk).join('\n');
const tickerRaw = (state.ticker || 'AI Agents Online | Open the live office chat to ask a question.') + '  |  Click any agent to ask a question →';
const ticker = esc(tickerRaw);
const tickerDur = Math.max(20, tickerRaw.length * 0.3).toFixed(1) + 's';

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}" role="img" aria-label="Animated pixel art virtual office with AI agents">
  <defs>
    <linearGradient id="floorGlow" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#18324a"/>
      <stop offset="0.45" stop-color="#101827"/>
      <stop offset="1" stop-color="#3b2119"/>
    </linearGradient>
    <pattern id="wood" width="56" height="32" patternUnits="userSpaceOnUse">
      <rect width="56" height="32" fill="#8b4f2f"/>
      <path d="M0 31 h56 M0 15 h56 M14 0 v15 M42 16 v16" stroke="#6f3b24" stroke-width="2" opacity="0.8"/>
      <path d="M8 7 q12 -6 24 0 M28 24 q9 -5 20 0" stroke="#b86a3f" stroke-width="1.5" fill="none" opacity="0.55"/>
    </pattern>
    <filter id="softGlow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <style><![CDATA[
    .screen-pulse { animation: screenPulse 1.8s linear infinite; }
    .sprite-wrap, .agent-sprite { animation: float 2.4s linear infinite; }
    .arm-left { animation: typeLeft 0.55s steps(2) infinite; transform-origin: 10px 36px; }
    .arm-right { animation: typeRight 0.55s steps(2) infinite; transform-origin: 38px 36px; }
    .leg-left { animation: walkLegA 0.45s steps(2) infinite; transform-origin: 18px 64px; }
    .leg-right { animation: walkLegB 0.45s steps(2) infinite; transform-origin: 31px 64px; }
    .idle-ring { animation: idlePulse 2s linear infinite; }
    .active-aura { animation: activePulse 0.55s linear infinite; filter: url(#softGlow); }
    .active-aura.slow { animation-duration: 1.1s; }
    .completed-badge { animation: badgePop 30s linear forwards; }
    .dot-one { animation: thinkDot 1.4s linear infinite; }
    .dot-two { animation: thinkDot 1.4s linear infinite 0.25s; }
    .dot-three { animation: thinkDot 1.4s linear infinite 0.5s; }
    .master-orbit { transform-origin: 85px 22px; animation: spin 9s linear infinite; }
    .data-flow { animation: dash 1.3s linear infinite; }
    .ticker-text { animation: ticker ${tickerDur} linear infinite; }
    .fan { transform-origin: center; animation: spin 3.5s linear infinite; }
    .blink { animation: blink 2.8s steps(2) infinite; }

    @media (prefers-reduced-motion: reduce) {
      * { animation: none !important; transition: none !important; }
    }
    @keyframes screenPulse { 0%,100%{opacity:.68} 50%{opacity:1;filter:drop-shadow(0 0 10px currentColor)} }
    @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
    @keyframes typeLeft { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(8deg)} }
    @keyframes typeRight { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(-8deg)} }
    @keyframes walkLegA { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(10deg)} }
    @keyframes walkLegB { 0%,100%{transform:rotate(10deg)} 50%{transform:rotate(0deg)} }
    @keyframes idlePulse { 0%,100%{opacity:.25} 50%{opacity:.7} }
    @keyframes activePulse { 0%,100%{opacity:.55;stroke-width:3} 50%{opacity:1;stroke-width:6} }
    @keyframes badgePop { 0%,88%{opacity:1;transform:scale(1)} 92%{transform:scale(1.15)} 100%{opacity:0;transform:scale(.8)} }
    @keyframes thinkDot { 0%,100%{opacity:.15} 50%{opacity:1} }
    @keyframes spin { to{transform:rotate(360deg)} }
    @keyframes dash { to{stroke-dashoffset:-68} }
    @keyframes ticker { from{transform:translateX(${WIDTH}px)} to{transform:translateX(-1300px)} }
    @keyframes blink { 0%,80%,100%{opacity:1} 82%,88%{opacity:.2} }
    .title { font: 900 34px Consolas, Monaco, monospace; fill:#f8fafc; letter-spacing:3px; text-anchor:middle; }
    .subtitle { font: 700 13px Consolas, Monaco, monospace; fill:#9fb3c8; text-anchor:middle; letter-spacing:1px; }
    .agent-label { font: 900 15px Consolas, Monaco, monospace; fill:#f8fafc; text-anchor:middle; letter-spacing:1px; }
    .role-label { font: 700 10px Consolas, Monaco, monospace; fill:#cbd5e1; text-anchor:middle; }
    .counter-text { font: 800 10px Consolas, Monaco, monospace; fill:#9fb3c8; text-anchor:middle; }
    .bubble-title { font: 900 8px Consolas, Monaco, monospace; fill:#334155; text-anchor:middle; }
    .bubble-copy { font: 700 10px Consolas, Monaco, monospace; fill:#111827; text-anchor:middle; }
    .tiny { font: 700 10px Consolas, Monaco, monospace; fill:#dbeafe; text-anchor:middle; }
    .ticker-text { font: 800 16px Consolas, Monaco, monospace; fill:#7dd3fc; }
    a { cursor:pointer; }
    a:hover rect.hover-outline { opacity: 0.4; }
    @keyframes bubble-fadeout { 0%,85%{opacity:1} 100%{opacity:0} }
    .speech-bubble { animation: bubble-fadeout 1800s linear forwards; }
  ]]></style>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="#080b12"/>
  <rect x="30" y="58" width="${WIDTH - 60}" height="${HEIGHT - 112}" rx="18" fill="url(#floorGlow)" stroke="#26334a" stroke-width="6"/>
  <rect x="52" y="92" width="${WIDTH - 104}" height="${HEIGHT - 170}" fill="url(#wood)" opacity="0.96"/>
  <path d="M52 92 h${WIDTH - 104} v${HEIGHT - 170} h-${WIDTH - 104}z" fill="none" stroke="#3e536f" stroke-width="4" opacity="0.65"/>

  <g opacity="0.95">
    <rect x="72" y="105" width="94" height="58" fill="#111827" stroke="#2f3b52" stroke-width="4"/>
    <rect x="83" y="116" width="72" height="36" fill="#123b5d"/>
    <path d="M91 143 h55 M92 132 h38 M92 123 h48" stroke="#67e8f9" stroke-width="3" class="blink"/>
    <rect x="928" y="104" width="94" height="58" fill="#111827" stroke="#2f3b52" stroke-width="4"/>
    <rect x="939" y="115" width="72" height="36" fill="#173b25"/>
    <path d="M948 126 h50 M948 137 h38 M948 146 h58" stroke="#86efac" stroke-width="3" class="blink"/>
    <g class="fan" transform="translate(548 117)">
      <circle cx="0" cy="0" r="15" fill="#172033" stroke="#6b7b94" stroke-width="3"/>
      <path d="M0 -4 l58 -9 l3 16 l-61 7z M0 4 l-58 9 l-3 -16 l61 -7z M-4 0 l-9 -58 l16 -3 l7 61z M4 0 l9 58 l-16 3 l-7 -61z" fill="#5d728e" opacity="0.75"/>
      <circle cx="0" cy="0" r="5" fill="#dbeafe"/>
    </g>
  </g>

  <text x="${WIDTH / 2}" y="39" class="title">GITHUB VIRTUAL AGENT OFFICE</text>
  <text x="${WIDTH / 2}" y="61" class="subtitle">Animated SVG preview - click works when the SVG is opened directly; README image links to the live chat room</text>

  <g class="data-layer" opacity="0.9">
    ${flowLine([[250,215],[410,215],[505,294]], '#5eead4', '0s')}
    ${flowLine([[720,215],[615,215],[560,294]], '#67e8f9', '.25s')}
    ${flowLine([[295,472],[420,430],[503,345]], '#c4b5fd', '.5s')}
    ${flowLine([[780,472],[650,430],[570,346]], '#fdba74', '.75s')}
    <polygon points="410,215 392,205 392,225" fill="#5eead4"/>
    <polygon points="615,215 633,205 633,225" fill="#67e8f9"/>
    <polygon points="420,430 401,425 411,444" fill="#c4b5fd"/>
    <polygon points="650,430 668,424 659,444" fill="#fdba74"/>
  </g>

  <g class="office-props">
    <rect x="486" y="104" width="126" height="82" rx="8" fill="#2b3548" stroke="#111827" stroke-width="5"/>
    <rect x="500" y="117" width="38" height="55" fill="#111827"/><rect x="559" y="117" width="38" height="55" fill="#111827"/>
    <rect x="511" y="128" width="16" height="34" fill="#67e8f9" opacity="0.7"/><rect x="570" y="128" width="16" height="34" fill="#fca5a5" opacity="0.7"/>
    <rect x="523" y="420" width="58" height="86" rx="8" fill="#1f2937" stroke="#111827" stroke-width="5"/>
    <rect x="535" y="432" width="34" height="12" fill="#475569"/><rect x="535" y="454" width="34" height="12" fill="#475569"/><rect x="535" y="476" width="34" height="12" fill="#475569"/>
    <circle cx="88" cy="548" r="18" fill="#1f2937"/><path d="M78 546 q10 -20 22 0" stroke="#6ee7b7" stroke-width="5" fill="none"/>
    <circle cx="1016" cy="548" r="18" fill="#1f2937"/><path d="M1006 546 q10 -20 22 0" stroke="#f9a8d4" stroke-width="5" fill="none"/>
  </g>

  ${deskSvg}

  ${walkingAgent('walk-a', agents.find(a => a.id === 'frontend') || agents[0], '320 285; 405 285; 405 365; 690 365; 690 285; 320 285', '16s', '0s', 'Frontend agent walking between desks')}
  ${walkingAgent('walk-b', agents.find(a => a.id === 'backend') || agents[0], '642 122; 610 235; 530 260; 452 235; 410 122; 642 122', '13s', '2s', 'Backend agent walking code route')}
  ${walkingAgent('walk-c', agents.find(a => a.id === 'devops') || agents[0], '870 365; 690 330; 575 405; 355 385; 205 365; 870 365', '19s', '4s', 'DevOps agent walking infrastructure route')}

  <g transform="translate(934 248)">
    <rect x="0" y="0" width="118" height="78" rx="12" fill="#f8fafc" stroke="#111827" stroke-width="4"/>
    <text x="59" y="28" class="bubble-copy">SEARCH</text>
    <text x="59" y="46" class="bubble-copy">MEMORY</text>
    <path d="M20 78 l-18 20 l34 -20" fill="#f8fafc" stroke="#111827" stroke-width="4"/>
  </g>
  <g transform="translate(986 348)">
    <rect x="0" y="0" width="58" height="52" rx="10" fill="#dbeafe" stroke="#111827" stroke-width="4"/>
    <rect x="14" y="-12" width="30" height="14" fill="#dbeafe" stroke="#111827" stroke-width="4"/>
    <circle cx="18" cy="23" r="4" fill="#111827"/><circle cx="40" cy="23" r="4" fill="#111827"/>
    <path d="M20 37 h18" stroke="#111827" stroke-width="4"/>
    <text x="29" y="72" class="tiny">MEMORY</text>
  </g>

  <rect x="30" y="${HEIGHT - 47}" width="${WIDTH - 60}" height="32" rx="10" fill="#0b1220" stroke="#26334a" stroke-width="3"/>
  <svg x="42" y="${HEIGHT - 43}" width="${WIDTH - 84}" height="28" overflow="hidden">
    <text x="0" y="20" class="ticker-text">${ticker}  |  Open office/interactive-office.html for the in-page chatbox experience.</text>
  </svg>
</svg>`;

fs.writeFileSync(svgPath, svgContent);
console.log(`SVG regenerated: ${svgPath}`);
