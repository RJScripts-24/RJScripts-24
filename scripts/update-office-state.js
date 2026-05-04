const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const actionType = process.env.ACTION_TYPE || process.argv[2];
const agentId    = process.env.AGENT_ID    || process.argv[3];
const querySummary = process.env.QUERY_SUMMARY || process.argv[4] || '';

const statePath  = path.join(__dirname, '../office/office-state.json');
const configPath = path.join(__dirname, '../office/agent-config.json');
const svgScript  = path.join(__dirname, '../office/generate-svg.js');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
}

const state  = readJson(statePath);
const config = readJson(configPath);

const agentConfig = config.agents.find(a => a.id === agentId);
const agentName   = agentConfig?.name || agentId || 'Agent';

if (actionType === 'query_resolved') {
  if (!state.agents[agentId]) {
    state.agents[agentId] = { status: 'idle', lastQuery: '', lastQueryShort: '', lastActive: null, queriesResolved: 0, showBubble: false };
  }

  const agent = state.agents[agentId];
  const short = querySummary.length > 45 ? querySummary.slice(0, 42) + '...' : querySummary;

  agent.status         = 'completed';
  agent.lastQuery      = querySummary;
  agent.lastQueryShort = short;
  agent.lastActive     = new Date().toISOString();
  agent.queriesResolved = (agent.queriesResolved || 0) + 1;
  agent.showBubble     = true;

  state.ticker = `🤖 ${agentName} resolved: "${short}" · ${agent.queriesResolved} queries total`;

} else if (actionType === 'push_ingested') {
  state.ticker = `${agentName} ingested new code chunks`;
} else if (actionType === 'agent_spawned') {
  state.ticker = `New agent spawned: ${agentName}`;
}

state.lastUpdated = new Date().toISOString();
fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
console.log(`[update-office-state] State written for action: ${actionType}`);

// Failure mode 3: generate-svg.js error — catch and log, never fail the whole workflow
try {
  execSync(`node "${svgScript}"`, { stdio: 'inherit' });
} catch (e) {
  console.error('[update-office-state] generate-svg.js threw an error (non-fatal, state JSON was saved):', e.message);
  console.error('[update-office-state] SVG will regenerate on next push.');
}

if (process.env.GITHUB_ACTIONS) {
  try {
    execSync('git config --global user.name "Neural Office Bot"');
    execSync('git config --global user.email "bot@neural-office"');
    execSync('git add office/office-state.json office/base-office.svg');
    execSync(`git commit -m "chore(office): ${agentName} resolved query [skip ci]"`, {
      env: { ...process.env, GIT_AUTHOR_NAME: 'Neural Office Bot', GIT_AUTHOR_EMAIL: 'bot@neural-office' }
    });
    const remote = `https://${process.env.GITHUB_ACTOR}:${process.env.GITHUB_TOKEN}@github.com/${process.env.GITHUB_REPOSITORY}.git`;
    execSync(`git push "${remote}"`);
    console.log('[update-office-state] Committed and pushed SVG + state.');
  } catch (e) {
    console.error('[update-office-state] Git step failed (possibly no changes):', e.message);
  }
}
