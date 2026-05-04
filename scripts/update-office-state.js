const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const actionType = process.env.ACTION_TYPE || process.argv[2];
const agentId = process.env.AGENT_ID || process.argv[3];
const querySummary = process.env.QUERY_SUMMARY || process.argv[4] || '';

const statePath = path.join(__dirname, '../office/office-state.json');
const configPath = path.join(__dirname, '../office/agent-config.json');
const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const agentName = config.agents.find(a => a.id === agentId)?.name || agentId;

if (actionType === 'query_resolved') {
  if (state.agents[agentId]) {
    state.agents[agentId].status = 'completed';
    state.agents[agentId].lastQuery = querySummary.substring(0, 60);
    state.agents[agentId].lastActive = new Date().toISOString();
    state.agents[agentId].queriesResolved += 1;
  }
  state.ticker = `🤖 ${agentName} just resolved: '${querySummary.substring(0, 60)}'`;
} else if (actionType === 'push_ingested') {
  state.ticker = `📚 ${agentName || 'Agents'} ingested new code chunks`;
} else if (actionType === 'agent_spawned') {
  state.ticker = `🌱 New agent spawned: ${agentName}`;
}

state.lastUpdated = new Date().toISOString();
fs.writeFileSync(statePath, JSON.stringify(state, null, 2));

// Run SVG generator
execSync('node office/generate-svg.js', { stdio: 'inherit' });

// Commit to git if running in Actions
if (process.env.GITHUB_ACTIONS) {
  try {
    execSync('git config --global user.name "github-actions[bot]"');
    execSync('git config --global user.email "github-actions[bot]@users.noreply.github.com"');
    execSync('git add office/office-state.json office/base-office.svg office/agent-config.json');
    execSync('git commit -m "chore(office): update agent state [skip ci]"');
    execSync(`git push "https://${process.env.GITHUB_ACTOR}:${process.env.GITHUB_TOKEN}@github.com/${process.env.GITHUB_REPOSITORY}.git"`);
    console.log('State committed and pushed to repo.');
  } catch (e) {
    console.error('Git push failed (possibly no changes or permission issue):', e.message);
  }
}
