const { routeQuery } = require("./intent-router");
const { generateResponse } = require("./groq-client");
const { queryMemory } = require("./vector-store");
const { execFileSync } = require("child_process");

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

  // 1. Determine Agent
  console.log(`[${new Date().toISOString()}] Routing query...`);
  const agentInfo = await routeQuery(issueTitle, issueBody, issueLabels);
  console.log(`[${new Date().toISOString()}] Routed to: ${agentInfo.agentId}`);

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
  try {
    aiResponse = await generateResponse(systemPrompt, userQuery);
  } catch (e) {
    console.error("Failed to generate response:", e);
    aiResponse = "I'm sorry, my neural circuits are currently experiencing interference and I could not process your request.";
  }

  // 4. Format Comment
  const finalComment = `## 🤖 ${agentInfo.agentName} Response\n\n${aiResponse}\n\n---\n*Powered by Groq (llama3-70b-8192) | [Neural Office](https://github.com/${repoOwner}/${repoName})*\n*Context retrieved from ${contextCount} codebase chunks via RAG*`;

  // 4. Post Comment
  const issueUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/issues/${issueNumber}`;
  console.log(`[${new Date().toISOString()}] Posting comment to GitHub...`);
  
  const commentRes = await fetch(`${issueUrl}/comments`, {
    method: "POST",
    headers: {
      "Authorization": `token ${githubToken}`,
      "Accept": "application/vnd.github.v3+json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ body: finalComment })
  });
  
  if (!commentRes.ok) {
    const errText = await commentRes.text();
    console.error("Failed to post comment:", errText);
    process.exit(1);
  }

  // 5. Close Issue
  console.log(`[${new Date().toISOString()}] Closing issue...`);
  const closeRes = await fetch(issueUrl, {
    method: "PATCH",
    headers: {
      "Authorization": `token ${githubToken}`,
      "Accept": "application/vnd.github.v3+json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ state: "closed" })
  });

  if (!closeRes.ok) {
    const errText = await closeRes.text();
    console.error("Failed to close issue:", errText);
    process.exit(1);
  }

  // 6. Update SVG State
  console.log(`[${new Date().toISOString()}] Updating office state...`);
  try {
    const summary = issueTitle.substring(0, 60);
    execFileSync("node", ["scripts/update-office-state.js", "query_resolved", agentInfo.agentId, summary], { stdio: "inherit" });
  } catch (e) {
    console.error("Failed to update office state:", e.message);
  }

  console.log(`[${new Date().toISOString()}] Workflow completed successfully!`);
}

main().catch(err => {
  console.error("Unhandled exception:", err);
  process.exit(1);
});
