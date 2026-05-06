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

  const files = Array.isArray(commit.filesChanged) ? commit.filesChanged.slice(0, 10) : [];
  const filesText = files.length ? files.join(", ") : "n/a";
  const userPrompt = `Commit by ${commit.author}: "${commit.message}"\nDomain: ${commit.domain}\nFiles: ${filesText}\nWrite 4 short office reactions.`;

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
    result[role] = clamp(parsed[role] || `${role} reviewing changes`);
  }
  return result;
}

function buildFallbackLines(commit) {
  const msg = clamp(String(commit.message || "Update shipped"), 34);
  const domain = commit.domain || "general";
  const templates = {
    frontend: domain === "frontend" ? `UI shipped: ${msg}` : "UI ready for review",
    backend:  domain === "backend"  ? `API update: ${msg}` : "API looks stable",
    database: domain === "database" ? `DB change: ${msg}` : "DB checks passed",
    devops:   domain === "devops"   ? `CI tweak: ${msg}` : "Pipeline green",
  };
  return {
    frontend: clamp(templates.frontend),
    backend:  clamp(templates.backend),
    database: clamp(templates.database),
    devops:   clamp(templates.devops),
  };
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
    // Fallback: deterministic lines (commit-aware) or keep existing strings
    console.warn("[update-office-state] Using fallback speech lines.");
    const existingOk =
      state.agents &&
      typeof state.agents.frontend === "string" &&
      typeof state.agents.backend === "string" &&
      typeof state.agents.database === "string" &&
      typeof state.agents.devops === "string";
    state.agents = existingOk ? {
      frontend: clamp(state.agents.frontend),
      backend:  clamp(state.agents.backend),
      database: clamp(state.agents.database),
      devops:   clamp(state.agents.devops),
    } : buildFallbackLines(commit);
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
