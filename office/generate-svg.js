const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'agent-config.json');
const statePath = path.join(__dirname, 'office-state.json');
const svgPath = path.join(__dirname, 'base-office.svg');

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));

let svgHeight = 600;
if (config.agents.length > 5) {
  svgHeight = 800; // Expansion for extra agents
}

let agentsSvg = '';

config.agents.forEach(agent => {
  const agState = state.agents[agent.id] || { status: 'idle', queriesResolved: 0 };
  const status = agState.status;
  const color = agent.accentColor;
  
  let animationClass = '';
  let statusVisuals = '';
  
  if (status === 'idle') {
    animationClass = 'pulse-idle';
    statusVisuals = `<circle cx="60" cy="27" r="20" fill="none" stroke="${color}" stroke-width="2" class="pulse-idle" />`;
  } else if (status === 'thinking') {
    statusVisuals = `
      <g transform="translate(60, 0)">
        <circle cx="0" cy="0" r="3" fill="#fff" class="thinking-dot" style="animation-delay: 0s" />
        <circle cx="10" cy="0" r="3" fill="#fff" class="thinking-dot" style="animation-delay: 0.3s" />
        <circle cx="20" cy="0" r="3" fill="#fff" class="thinking-dot" style="animation-delay: 0.6s" />
      </g>
    `;
  } else if (status === 'active') {
    animationClass = 'pulse-active glow-pulse';
  } else if (status === 'completed') {
    statusVisuals = `
      <g transform="translate(85, -10)" class="badge-fadeout">
        <circle cx="0" cy="0" r="12" fill="#2ea043" />
        <text x="0" y="4" font-family="sans-serif" font-size="12" fill="#fff" text-anchor="middle">✓</text>
      </g>
    `;
  }
  
  let masterRing = '';
  if (agent.id === 'master') {
    masterRing = `<circle cx="70" cy="30" r="80" fill="none" stroke="#FFD700" stroke-width="2" stroke-dasharray="10 5" class="master-ring" />`;
  }
  
  let speechBubble = '';
  if (agState.lastActive && agState.lastQuery) {
    const lastActiveTime = new Date(agState.lastActive).getTime();
    if (Date.now() - lastActiveTime < 60 * 60 * 1000) { // 1 hour
      const queryText = agState.lastQuery.length > 25 ? agState.lastQuery.substring(0, 22) + '...' : agState.lastQuery;
      speechBubble = `
        <g transform="translate(0, -50)">
          <path d="M0,0 L120,0 L120,30 L65,30 L60,40 L55,30 L0,30 Z" fill="#ffffff" />
          <text x="60" y="20" font-family="sans-serif" font-size="10" fill="#000" text-anchor="middle">${queryText}</text>
        </g>
      `;
    }
  }

  agentsSvg += `
  <a href="https://github.com/RJScripts-24/RJScripts-24/issues/new?labels=${agent.issueLabel}&amp;template=query_template.md&amp;title=Query+for+${encodeURIComponent(agent.name)}%3A+" target="_blank">
    <g transform="translate(${agent.deskPosition.x}, ${agent.deskPosition.y})">
      ${masterRing}
      ${speechBubble}
      <rect x="20" y="40" width="80" height="35" fill="#2d333b" rx="2" />
      <rect x="35" y="15" width="50" height="25" fill="#1c2128" rx="2" />
      <rect x="40" y="20" width="40" height="15" fill="${color}" class="${animationClass}" rx="1" />
      <text x="60" y="-10" class="text-label" fill="#8b949e">Resolved: ${agState.queriesResolved || 0}</text>
      <g class="float">
        <rect x="56" y="0" width="8" height="10" fill="${color}" />
        <rect x="56" y="-8" width="8" height="8" fill="#FFF" />
        <rect x="58" y="-6" width="2" height="2" fill="#000" />
        <rect x="62" y="-6" width="2" height="2" fill="#000" />
      </g>
      ${statusVisuals}
      <text x="60" y="95" class="text-label">${agent.name}</text>
    </g>
  </a>
  `;
});

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 900 ${svgHeight}" width="900" height="${svgHeight}">
  <style>
    <![CDATA[
      @media (prefers-reduced-motion: no-preference) {
        .float { animation: float 2.5s linear infinite; }
        .pulse-idle { animation: pulse-idle 2s linear infinite; }
        .pulse-active { animation: pulse-active 0.5s linear infinite; }
        .thinking-dot { animation: thinking-dot 1.5s linear infinite; }
        .marquee-text { animation: ticker-scroll 25s linear infinite; }
        .master-ring { transform-origin: 70px 30px; animation: golden-spin 8s linear infinite; }
        .badge-fadeout { animation: badge-fadeout 30s linear forwards; }
        .glow-pulse { animation: glow-pulse 0.5s alternate infinite; }
      }
      
      @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-4px); } }
      @keyframes pulse-idle { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.6; } }
      @keyframes pulse-active { 0%, 100% { opacity: 0.7; } 50% { opacity: 1.0; } }
      @keyframes thinking-dot { 0%, 100% { opacity: 0; } 50% { opacity: 1; } }
      @keyframes ticker-scroll { 0% { transform: translateX(900px); } 100% { transform: translateX(-100%); } }
      @keyframes golden-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      @keyframes badge-fadeout { 0%, 90% { opacity: 1; } 100% { opacity: 0; } }
      @keyframes glow-pulse { 0% { filter: drop-shadow(0 0 4px #fff); } 100% { filter: drop-shadow(0 0 12px #fff); } }

      .text-title { font-family: monospace; font-size: 24px; fill: #ffffff; text-anchor: middle; font-weight: bold; }
      .text-ticker { font-family: monospace; font-size: 16px; fill: #00ff00; }
      .text-label { font-family: monospace; font-size: 12px; fill: #ffffff; text-anchor: middle; }
    ]]>
  </style>

  <rect width="900" height="${svgHeight}" fill="#0d1117" />
  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1c2128" stroke-width="1"/>
  </pattern>
  <rect width="900" height="${svgHeight}" fill="url(#grid)" />
  <text x="450" y="40" class="text-title">NEURAL OFFICE</text>

  ${agentsSvg}

  <rect x="0" y="${svgHeight - 40}" width="900" height="40" fill="#161b22" />
  <svg x="0" y="${svgHeight - 40}" width="900" height="40">
    <text x="0" y="25" class="text-ticker marquee-text">${state.ticker}</text>
  </svg>
</svg>`;

fs.writeFileSync(svgPath, svgContent);
console.log('SVG regenerated.');
