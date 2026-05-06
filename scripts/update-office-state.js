const fs          = require("fs");
const path        = require("path");
const { execSync } = require("child_process");

const { getCommitSummary }  = require("./git-commit-summary");
const { generateResponse }  = require("./groq-client");

const statePath  = path.join(__dirname, "../office/office-state.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function clamp(str, max = 34) {
  if (!str || typeof str !== "string") return "Reviewing commit...";
  return str.length > max ? str.slice(0, max - 1) + "\u2026" : str;
}

async function generateAgentSpeechLines(commit) {
  const systemPrompt = `You are a script writer for a pixel-art office animation on a GitHub profile.
Generate SHORT speech lines for 4 software agents reacting to a git commit.
Rules:
- Each line must be 34 characters or fewer
- Lines must sound like office colleagues talking
- The "${commit.domain}" agent is the PRIMARY speaker (they made the commit)
- Other agents react to the news
- Output ONLY valid JSON, no markdown fences, no explanation:
{
  "frontend": "<line>",
  "backend": "<line>",
  "database": "<line>",
  "devops": "<line>"
}`;

  const userPrompt = `Commit by ${commit.author}: "${commit.message}" (domain: ${commit.domain})`;

  let raw;
  try {
    raw = await generateResponse(systemPrompt, userPrompt);
  } catch (err) {
    console.error("[update-office-state] Groq call failed:", err.message);
    return null;
  }

  // Strip accidental markdown fences
  const cleaned = raw.replace(/```[a-z]*\n?/gi, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    console.error("[update-office-state] Failed to parse Groq response as JSON:", cleaned);
    return null;
  }

  const roles = ["frontend", "backend", "database", "devops"];
  const result = {};
  for (const role of roles) {
    result[role] = clamp(parsed[role] || `${role} reviewing commit`);
  }
  return result;
}

async function main() {
  const commit = getCommitSummary();
  console.log(`[update-office-state] Commit: ${commit.sha} by ${commit.author} (domain: ${commit.domain})`);
  console.log(`[update-office-state] Message: "${commit.message}"`);

  const state = readJson(statePath);

  const speechLines = await generateAgentSpeechLines(commit);

  if (speechLines) {
    console.log("[update-office-state] Speech lines generated:", JSON.stringify(speechLines));
    state.agents = speechLines;
  } else {
    // Fallback: keep existing agents or use defaults
    console.warn("[update-office-state] Using fallback speech lines.");
    state.agents = {
      frontend: clamp(typeof state.agents?.frontend === "string" ? state.agents.frontend : "CI pipeline green"),
      backend:  clamp(typeof state.agents?.backend  === "string" ? state.agents.backend  : "API schema updated"),
      database: clamp(typeof state.agents?.database === "string" ? state.agents.database : "Migration complete"),
      devops:   clamp(typeof state.agents?.devops   === "string" ? state.agents.devops   : "Deploy to prod done"),
    };
  }

  state.lastCommit = {
    sha:     commit.sha,
    author:  commit.author,
    message: commit.message,
  };
  state.lastActivity = new Date().toISOString();
  state.lastUpdated  = state.lastActivity;

  // Update ticker
  state.ticker = `Agents reviewed ${commit.sha}: ${commit.message}`;

  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  console.log("[update-office-state] State written to", statePath);

  execSync("node office/generate-svg.js", { stdio: "inherit", cwd: path.join(__dirname, "..") });
}

main().catch(err => {
  console.error("[update-office-state] Fatal error:", err);
  process.exit(1);
});
