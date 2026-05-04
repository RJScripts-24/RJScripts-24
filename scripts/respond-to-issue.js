const fs = require("fs");
const { routeQuery } = require("./intent-router");
const { generateResponse } = require("./groq-client");
const { queryMemory } = require("./vector-store");

async function main() {
  console.log(`[${new Date().toISOString()}] Started respond-to-issue workflow`);

  const issueNumber = process.env.ISSUE_NUMBER;
  const issueTitle = process.env.ISSUE_TITLE;
  const issueBody = process.env.ISSUE_BODY || "";
  let issueLabels = [];
  try {
    issueLabels = JSON.parse(process.env.ISSUE_LABELS || "[]");
  } catch (e) {
    console.error("Could not parse labels:", e);
  }
  const githubToken = process.env.GITHUB_TOKEN;
  const repoOwner = process.env.REPO_OWNER;
  const repoName = process.env.REPO_NAME;

  if (!githubToken || !issueNumber || !repoOwner || !repoName) {
    console.error("Missing required environment variables.");
    process.exit(1);
  }

  // Failure mode 1: GROQ_API_KEY missing — set a flag so we can post a graceful fallback comment
  const groqKeyMissing = !process.env.GROQ_API_KEY;

  // 1. Determine Agent
  console.log(`[${new Date().toISOString()}] Routing query...`);
  const agentInfo = await routeQuery(issueTitle, issueBody, issueLabels);
  console.log(`[${new Date().toISOString()}] Routed to: ${agentInfo.agentId}`);
  // Write to $GITHUB_ENV so the next workflow step can read RESOLVED_AGENT_ID and ISSUE_TITLE_SHORT
  process.env.RESOLVED_AGENT_ID = agentInfo.agentId;
  process.env.ISSUE_TITLE_SHORT = issueTitle.substring(0, 60);
  if (process.env.GITHUB_ENV) {
    fs.appendFileSync(process.env.GITHUB_ENV, `RESOLVED_AGENT_ID=${agentInfo.agentId}\n`);
    fs.appendFileSync(process.env.GITHUB_ENV, `ISSUE_TITLE_SHORT=${issueTitle.substring(0, 60)}\n`);
  }

  // 2. Fetch RAG Context
  console.log(`[${new Date().toISOString()}] Fetching RAG context...`);
  let contextStr = "";
  let contextCount = 0;
  try {
    const results = await queryMemory(`${issueTitle} ${issueBody}`, agentInfo.agentId, 5);
    if (results.length > 0) {
      contextCount = results.length;
      contextStr = "RELEVANT CODEBASE CONTEXT:\n" + results.map(r => `File: ${r.metadata.filePath}\n${r.text}`).join("\n---\n");
    }
  } catch (e) {
    console.error("Failed to fetch memory:", e);
  }

  // 3. Generate Response
  console.log(`[${new Date().toISOString()}] Generating AI response...`);
  let userQuery = `${issueTitle}\n\n${issueBody}`;
  if (contextStr) {
    userQuery = `${contextStr}\n\n${userQuery}`;
  }
  
  let systemPrompt = agentInfo.systemPrompt;
  systemPrompt += "\n\nYou have been given relevant code snippets from the developer's actual codebase. Reference them specifically in your answer when applicable.";

  let aiResponse = "";
  if (groqKeyMissing) {
    console.warn("GROQ_API_KEY is not set — posting graceful fallback comment.");
    aiResponse = "⚠️ This Neural Office instance is not yet configured. The repository owner needs to add the `GROQ_API_KEY` secret under **Settings → Secrets and variables → Actions**. Once added, reopen this issue and the agent will respond properly.";
  } else {
    try {
      aiResponse = await generateResponse(systemPrompt, userQuery);
    } catch (e) {
      console.error("Failed to generate response:", e);
      aiResponse = "I'm sorry, my neural circuits are currently experiencing interference. Please try again in a moment.";
    }
  }

  // 4. Format Comment
  const askAgainUrl = `https://github.com/${repoOwner}/${repoName}/issues/new?template=query_template.yml&labels=ask-agent&title=Query%3A%20`;
  const finalComment = `## 🤖 ${agentInfo.agentName} — Neural Office Response\n\n${aiResponse}\n\n---\n*Powered by [Groq](https://groq.com) (llama3-70b-8192) · [Ask another question](${askAgainUrl}) · [Neural Office](https://github.com/${repoOwner}/${repoName})*`;

  // 5. Post Comment
  const issueUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/issues/${issueNumber}`;
  const authHeaders = {
    "Authorization": `Bearer ${githubToken}`,
    "Accept": "application/vnd.github.v3+json",
    "Content-Type": "application/json"
  };
  console.log(`[${new Date().toISOString()}] Posting comment to GitHub...`);
  
  const commentRes = await fetch(`${issueUrl}/comments`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ body: finalComment })
  });
  
  if (!commentRes.ok) {
    const errText = await commentRes.text();
    console.error("Failed to post comment:", errText);
    process.exit(1);
  }

  // 6. Close Issue
  console.log(`[${new Date().toISOString()}] Closing issue...`);
  const closeRes = await fetch(issueUrl, {
    method: "PATCH",
    headers: authHeaders,
    body: JSON.stringify({ state: "closed" })
  });

  if (!closeRes.ok) {
    const errText = await closeRes.text();
    console.error("Failed to close issue:", errText);
    process.exit(1);
  }

  // Visual state update is handled by the next workflow step (update-office-state.js)
  // RESOLVED_AGENT_ID and ISSUE_TITLE_SHORT have been written to $GITHUB_ENV above.

  console.log(`[${new Date().toISOString()}] Workflow completed successfully!`);
}

main().catch(err => {
  console.error("Unhandled exception:", err);
  process.exit(1);
});
