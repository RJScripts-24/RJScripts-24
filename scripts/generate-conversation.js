const { spawnSync } = require("child_process");
const { generateResponse } = require("./groq-client");
const { getLatestCommitSummary } = require("./git-commit-summary");

const AGENT_NAMES = {
  frontend: "Frontend Agent",
  backend: "Backend Agent",
  database: "Database Agent",
  devops: "DevOps Agent",
};

function short(text, max = 92) {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

function buildTemplateConversation(commit) {
  const changed = commit.changedFiles;
  const list = changed.slice(0, 4).join(", ") || "no file paths were captured";
  const domains = commit.summaryByDomain;

  const firstSpeaker =
    Object.entries({ frontend: domains.frontend, backend: domains.backend, database: domains.database, devops: domains.devops })
      .sort((a, b) => b[1] - a[1])[0][0] || "backend";

  const ordered = ["frontend", "backend", "database", "devops"];
  const rotateStart = ordered.indexOf(firstSpeaker);
  const speakers = ordered.slice(rotateStart).concat(ordered.slice(0, rotateStart));

  const turns = [
    {
      speakerId: speakers[0],
      speakerName: AGENT_NAMES[speakers[0]],
      text: `I reviewed commit ${commit.shortSha}. Main files touched: ${short(list, 78)}.`,
    },
    {
      speakerId: speakers[1],
      speakerName: AGENT_NAMES[speakers[1]],
      text: `Commit message says: "${short(commit.message, 62)}". I'll validate runtime impact and integration paths.`,
    },
    {
      speakerId: speakers[2],
      speakerName: AGENT_NAMES[speakers[2]],
      text: `Data implications look manageable. We should track migrations and query hotspots in the next push.`,
    },
    {
      speakerId: speakers[3],
      speakerName: AGENT_NAMES[speakers[3]],
      text: `CI/CD note: I'll monitor workflow stability and deployment drift after this change lands.`,
    },
  ];

  const routeA = `${145} ${150}; ${430} ${290}; ${145} ${150}`;
  const routeB = `${790} ${150}; ${430} ${290}; ${790} ${150}`;
  return {
    mode: "template",
    headline: `Agents reviewed ${commit.shortSha}: ${short(commit.message, 64)}`,
    turns,
    animationPlan: {
      meetingSpot: { x: 430, y: 290 },
      walkerRoutes: [
        { agentId: speakers[0], pathValues: routeA, dur: "14s", delay: "0s", targetDeskId: speakers[1] },
        { agentId: speakers[1], pathValues: routeB, dur: "15s", delay: "1s", targetDeskId: speakers[0] },
      ],
      spotlightDeskIds: [speakers[0], speakers[1]],
    },
  };
}

function extractJson(text) {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : text;
  return JSON.parse(raw);
}

async function buildGroqConversation(commit, templateConversation) {
  const prompt = [
    "Create a concise 4-turn technical dialogue between these speakers only: frontend, backend, database, devops.",
    "Output valid JSON ONLY with shape:",
    '{"headline":"...","turns":[{"speakerId":"frontend|backend|database|devops","text":"..."}]}',
    "Each turn text must be <= 95 chars and technically grounded in commit info.",
  ].join("\n");

  const context = JSON.stringify(
    {
      commit: {
        sha: commit.shortSha,
        message: commit.message,
        author: commit.author,
        changedFiles: commit.changedFiles.slice(0, 12),
        diffStats: commit.diffStats,
      },
      baseline: templateConversation.turns,
    },
    null,
    2
  );

  const llm = await generateResponse(prompt, context);
  const parsed = extractJson(llm);
  if (!parsed || !Array.isArray(parsed.turns) || parsed.turns.length < 2) throw new Error("Invalid LLM dialogue JSON");

  const turns = parsed.turns.slice(0, 4).map((t) => ({
    speakerId: AGENT_NAMES[t.speakerId] ? t.speakerId : "backend",
    speakerName: AGENT_NAMES[t.speakerId] || AGENT_NAMES.backend,
    text: short(String(t.text || "").trim(), 95),
  }));

  return {
    mode: "groq",
    headline: short(parsed.headline || templateConversation.headline, 90),
    turns,
    animationPlan: templateConversation.animationPlan,
  };
}

async function main() {
  const commit = getLatestCommitSummary();
  if (!commit.sha) {
    console.log("[generate-conversation] No commit information available, skipping.");
    process.exit(0);
  }

  const templateConversation = buildTemplateConversation(commit);
  let conversation = templateConversation;
  if (process.env.GROQ_API_KEY) {
    try {
      conversation = await buildGroqConversation(commit, templateConversation);
    } catch (err) {
      console.error("[generate-conversation] Groq enhancement failed, using template fallback:", err.message);
    }
  }

  const patch = {
    lastCommit: {
      sha: commit.sha,
      author: commit.author,
      message: commit.message,
      url: commit.url,
      timestamp: commit.timestamp,
    },
    conversation: {
      id: `${commit.shortSha}-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      mode: conversation.mode,
      headline: conversation.headline,
      turns: conversation.turns,
    },
    animationPlan: conversation.animationPlan,
    ticker: `${conversation.headline} | ${commit.diffStats || "diff summary unavailable"}`,
  };

  const child = spawnSync(
    process.execPath,
    ["scripts/update-office-state.js", "conversation_generated", JSON.stringify(patch)],
    { stdio: "inherit", env: process.env }
  );
  if (child.status !== 0) process.exit(child.status || 1);
}

main().catch((err) => {
  console.error("[generate-conversation] Fatal:", err.message);
  process.exit(1);
});
