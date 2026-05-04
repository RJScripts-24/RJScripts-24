const fs = require('fs');
const path = require('path');

const actionType = process.env.ACTION_TYPE || process.argv[2];
const payloadJson = process.env.STATE_PATCH || process.argv[3] || '{}';

const statePath  = path.join(__dirname, '../office/office-state.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
}

const state  = readJson(statePath);
let patch = {};
try {
  patch = JSON.parse(payloadJson);
} catch {
  console.error('[update-office-state] Invalid STATE_PATCH JSON; skipping patch.');
}

if (actionType === 'conversation_generated') {
  Object.assign(state.lastCommit, patch.lastCommit || {});
  state.conversation = patch.conversation || state.conversation;
  state.animationPlan = patch.animationPlan || state.animationPlan;
  state.ticker = patch.ticker || state.ticker;

  if (Array.isArray(state.conversationHistory)) {
    state.conversationHistory.unshift(state.conversation);
    state.conversationHistory = state.conversationHistory.slice(0, 12);
  } else {
    state.conversationHistory = [state.conversation];
  }

  const now = new Date().toISOString();
  for (const turn of state.conversation.turns || []) {
    if (!state.agents[turn.speakerId]) continue;
    state.agents[turn.speakerId].status = 'active';
    state.agents[turn.speakerId].lastLine = turn.text;
    state.agents[turn.speakerId].lastActive = now;
    state.agents[turn.speakerId].conversationsCount = Number(state.agents[turn.speakerId].conversationsCount || 0) + 1;
  }
}

state.lastUpdated = new Date().toISOString();
fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
console.log(`[update-office-state] State written for action: ${actionType}`);
