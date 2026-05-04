const { generateResponse } = require("./groq-client");
const { personas } = require("./agent-personas");

const agentNames = {
  master: "Master Agent",
  frontend: "Frontend Agent",
  backend: "Backend Agent",
  database: "Database Agent",
  devops: "DevOps Agent"
};

async function routeQuery(issueTitle, issueBody, issueLabels) {
  let agentId = null;

  // 1. Check labels
  if (issueLabels && issueLabels.length > 0) {
    const labels = issueLabels.map(l => (typeof l === 'string' ? l : l.name));
    if (labels.includes("ask-master")) agentId = "master";
    else if (labels.includes("ask-frontend")) agentId = "frontend";
    else if (labels.includes("ask-backend")) agentId = "backend";
    else if (labels.includes("ask-database")) agentId = "database";
    else if (labels.includes("ask-devops")) agentId = "devops";
  }

  // Failure mode 2: no matching agent label → LLM classification, then fallback to master
  if (!agentId) {
    const classificationPrompt = `Analyze the following issue and classify it into exactly one of the following domains: "master", "frontend", "backend", "database", "devops".
Return ONLY the domain word, nothing else.`;
    const query = `Title: ${issueTitle}\n\nBody: ${issueBody}`;
    try {
      const result = await generateResponse(classificationPrompt, query);
      const cleanResult = result.trim().toLowerCase();
      if (agentNames[cleanResult]) {
        agentId = cleanResult;
      } else {
        agentId = "master";
      }
    } catch (e) {
      console.error("Classification failed, defaulting to master agent:", e.message);
      agentId = "master";
    }
  }

  if (!agentId) {
    console.warn("No agent label matched and classification unavailable — defaulting to master agent.");
    agentId = "master";
  }

  return {
    agentId: agentId,
    agentName: agentNames[agentId],
    systemPrompt: personas[agentId]
  };
}

module.exports = { routeQuery };
