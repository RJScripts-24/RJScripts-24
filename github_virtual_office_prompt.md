# 🛸 ANTIGRAVITY MASTER PROMPT
## GitHub Profile: 2D Virtual AI Agent Office
### A Phase-Locked, Hallucination-Resistant Build Specification

---

> **HOW TO USE THIS PROMPT**
> Copy each Phase Block individually into your AI coding assistant (Cursor, Claude, Copilot, etc.).
> Complete and verify each phase before proceeding to the next.
> Never paste multiple phases together — this is intentional to prevent context drift and hallucination.

---

## 🧠 SYSTEM CONTEXT (Paste this before EVERY phase)

```
You are an expert full-stack engineer and pixel-art SVG designer specializing in GitHub Actions automation, LLM orchestration, and serverless architectures. You write clean, modular, production-grade code.

Your job is to build a 2D virtual AI agent office that lives entirely inside a GitHub Profile README.md. The system uses:
- GitHub Actions as the compute layer
- GitHub Issues REST API as the event/database layer
- Groq API (llama3-70b-8192 model) for ultra-fast LLM inference
- ChromaDB (local/serverless mode) for vector memory and RAG
- SVG with embedded CSS animations as the visual engine
- Node.js / TypeScript for all scripting

STRICT RULES YOU MUST FOLLOW:
1. Never fabricate API methods. Only use documented APIs.
2. Never skip error handling on any API call.
3. Every file you create must be placed in its exact specified path.
4. After each code block, write a one-line "✅ DONE CHECK" that tells me how to verify it works.
5. Do not proceed to the next task within a phase until I confirm the current one.
6. If you are uncertain about any implementation detail, say "UNCERTAIN:" and list the options instead of guessing.
```

---

## 📦 PHASE 1 — Static UI Foundation & Repository Scaffold

### Objective
Create the visual office SVG, repository file structure, and a basic GitHub Action that responds to issues with a hardcoded reply. No LLM calls yet. Verify the entire visual and event pipeline is working before touching AI.

---

### PHASE 1 — PROMPT BLOCK (Copy this exactly)

```
PHASE 1 TASK: Build the static foundation for a 2D GitHub Profile Virtual Office.

## Step 1.1 — Repository File Structure

Create the following file and folder structure. Output each file path as a header, then the full file content beneath it. Do not summarize — output the complete content of every file.

Required structure:
├── README.md                          (entry point — embeds the SVG)
├── office/
│   ├── base-office.svg                (the 2D pixel-art office — full SVG source)
│   ├── generate-svg.js                (Node.js script that programmatically rebuilds the SVG)
│   └── agent-config.json              (agent definitions: name, role, desk position, issue label)
├── .github/
│   └── workflows/
│       ├── respond-to-issue.yml       (triggers on issue opened)
│       └── update-svg.yml             (triggers on push to main)
└── scripts/
    └── post-comment.js                (uses GitHub REST API to comment on and close issues)

## Step 1.2 — SVG Office Design

Design the base-office.svg as a top-down 2D pixel-art office, 900px wide × 600px tall.

REQUIRED VISUAL ELEMENTS:
- Dark background (#0d1117 — GitHub dark mode)
- A grid floor pattern using subtle lines (#1c2128)
- 5 agent "desks" arranged in the office:
  - Master Agent (center, slightly larger desk, gold accent color #FFD700)
  - Frontend Agent (top-left, blue accent #61DAFB)
  - Backend Agent (top-right, green accent #68D391)
  - Database Agent (bottom-left, purple accent #B794F4)
  - DevOps Agent (bottom-right, orange accent #F6AD55)
- Each desk has:
  - A pixel-art desk rectangle
  - A pixel-art monitor (2 small stacked rectangles)
  - A pixel-art agent sprite (8x8 pixel character above the desk using SVG rect elements — no external images)
  - A name label below the sprite
  - The entire desk group wrapped in: <a xlink:href="https://github.com/YOUR_USERNAME/YOUR_REPO/issues/new?labels=AGENT_LABEL&template=query_template.md&title=Query+for+AGENT_NAME%3A+" target="_blank">
- A "NEURAL OFFICE" title at the top in monospace font
- A marquee-style ticker bar at the bottom (static text for now): "🤖 AI Agents Online | Ask me anything via the agent desks above"

ANIMATION REQUIREMENTS (CSS only, embedded in <style> tag inside SVG):
- Agent sprites must have a subtle floating animation (translateY -3px to 0, 2s ease-in-out infinite)
- Monitor screens must pulse with a soft glow (opacity 0.7 to 1.0, 1.5s ease-in-out infinite, each agent on different delay)
- Master agent desk must have a rotating golden ring around it (slow spin, 8s linear infinite)
- The ticker text must scroll left continuously (CSS marquee via translateX animation, 20s linear infinite)
- All animations must be paused when prefers-reduced-motion: reduce

PIXEL ART SPRITE DESIGN (SVG rect-based, for each agent):
- Body: 8px × 10px rect
- Head: 8px × 8px rect (lighter shade)
- Eyes: two 2px × 2px rects
- Color the body using the agent's accent color
- Add a small "antenna" (2px × 4px rect) on top of the head for the Master Agent only

## Step 1.3 — agent-config.json

Output this JSON file with all 5 agents defined:
{
  "agents": [
    {
      "id": "master",
      "name": "Master Agent",
      "role": "Orchestrator — routes queries, synthesizes cross-domain answers",
      "issueLabel": "ask-master",
      "accentColor": "#FFD700",
      "deskPosition": { "x": 380, "y": 250 },
      "status": "idle",
      "lastActivity": null
    },
    ... (define all 5 agents)
  ]
}

## Step 1.4 — GitHub Action: respond-to-issue.yml

Write a GitHub Actions workflow that:
- Triggers on: issues: types: [opened]
- Runs on ubuntu-latest
- Checks out the repo
- Reads the issue title and body using the GitHub context
- Reads the issue labels to determine which agent was targeted
- Posts a HARDCODED reply comment to the issue using the GitHub REST API (curl command with $GITHUB_TOKEN)
- The hardcoded reply must say: "🤖 [AGENT_NAME] received your query. The AI response system is initializing. This message confirms your GitHub Actions pipeline is working correctly."
- Closes the issue after commenting
- DO NOT use any third-party actions other than actions/checkout

## Step 1.5 — README.md

Write the README.md that:
- Has a centered H1 title: "🤖 Neural Office — AI Agent Swarm"
- Embeds the SVG using an HTML img tag pointing to the raw GitHub URL of base-office.svg (use YOUR_USERNAME placeholder)
- Has a brief instruction section below explaining how to click an agent and ask a question
- Has a "Recent Activity" section with a placeholder comment: <!-- ACTIVITY_LOG -->

After outputting all files, write:
✅ DONE CHECK: Open a GitHub Issue on your repo with any label matching one of the agents. Within 60 seconds, the Action should comment and close it. The SVG should render on your profile README.
```

---

## 🧠 PHASE 2 — Groq API Integration & Agent Orchestration

### Objective
Replace the hardcoded reply with real LLM inference via Groq. Build the orchestrator that routes questions to the correct domain agent persona and generates expert responses.

> ⚠️ **PREREQUISITE:** Phase 1 must be fully working. GitHub Actions must be successfully commenting on and closing issues before starting Phase 2.

---

### PHASE 2 — PROMPT BLOCK (Copy this exactly)

```
PHASE 2 TASK: Integrate Groq API for live AI inference in the GitHub Issue response pipeline.

CONTEXT: Phase 1 is complete. GitHub Actions can read issues, comment, and close them. Now replace the hardcoded reply with Groq-powered LLM responses.

## Step 2.1 — Groq Client Module

Create: scripts/groq-client.js

Requirements:
- Use the native fetch API (Node.js 18+, no npm packages for HTTP)
- Read GROQ_API_KEY from environment variables — never hardcode it
- Use model: "llama3-70b-8192"
- max_tokens: 1500
- temperature: 0.3 (precise, technical responses)
- Export a single async function: generateResponse(systemPrompt, userQuery)
- Include retry logic: 3 attempts with exponential backoff (1s, 2s, 4s)
- On error, throw a descriptive error message that includes the HTTP status code
- Log token usage to console for monitoring

The Groq API endpoint is: https://api.groq.com/openai/v1/chat/completions
It uses the OpenAI-compatible chat format.

## Step 2.2 — Agent Persona System Prompts

Create: scripts/agent-personas.js

Define and export a JavaScript object containing system prompts for each of the 5 agents:

MASTER AGENT system prompt must instruct it to:
- Identify itself as the Master Orchestrator
- Answer cross-domain questions by synthesizing knowledge across Frontend, Backend, Database, and DevOps
- Be direct, technical, and concise
- Reference specific technologies, patterns, and architectural decisions
- End responses with: "— Master Agent | Neural Office"

FRONTEND AGENT system prompt must instruct it to:
- Identify itself as a Frontend specialist
- Speak authoritatively about React, TypeScript, CSS, performance, accessibility, and UI/UX patterns
- Reference real tools: Vite, TailwindCSS, React Query, Zustand, Storybook, Playwright
- End responses with: "— Frontend Agent | Neural Office"

BACKEND AGENT system prompt must instruct it to:
- Identify itself as a Backend/API specialist  
- Speak authoritatively about Node.js, REST APIs, GraphQL, authentication, BYOK architectures, microservices
- Reference real tools: Express, Fastify, Prisma, Redis, JWT, OAuth2
- End responses with: "— Backend Agent | Neural Office"

DATABASE AGENT system prompt must instruct it to:
- Identify itself as a Database/Data specialist
- Speak authoritatively about SQL, NoSQL, query optimization, indexing, migrations, RBAC
- Reference real tools: PostgreSQL, Supabase, Redis, ChromaDB, pgvector, Prisma
- End responses with: "— Database Agent | Neural Office"

DEVOPS AGENT system prompt must instruct it to:
- Identify itself as a DevOps/Infrastructure specialist
- Speak authoritatively about CI/CD, containers, IaC, monitoring, GitHub Actions, cloud platforms
- Reference real tools: Docker, Kubernetes, Terraform, GitHub Actions, Vercel, AWS, Datadog
- End responses with: "— DevOps Agent | Neural Office"

## Step 2.3 — Intent Router

Create: scripts/intent-router.js

Export an async function: routeQuery(issueTitle, issueBody, issueLabels)

Logic:
1. First, check issueLabels array. If it contains "ask-master", "ask-frontend", "ask-backend", "ask-database", or "ask-devops" → route directly to that agent
2. If no label match, use Groq API to classify the query:
   - Send a classification prompt asking the model to return ONLY one of: "master", "frontend", "backend", "database", "devops"
   - Parse the response and map to an agent ID
   - If parsing fails, default to "master"
3. Return: { agentId: string, agentName: string, systemPrompt: string }

## Step 2.4 — Update respond-to-issue.yml

Update the GitHub Actions workflow to:
- Add GROQ_API_KEY to env vars (must be stored as a GitHub Secret named GROQ_API_KEY)
- Install Node.js 20 using actions/setup-node@v4
- Run: node scripts/respond-to-issue.js
- Pass the following as environment variables to the script:
  - ISSUE_NUMBER, ISSUE_TITLE, ISSUE_BODY, ISSUE_LABELS (as JSON string), GITHUB_TOKEN, REPO_OWNER, REPO_NAME

Create: scripts/respond-to-issue.js

This script must:
1. Read all env vars
2. Call routeQuery() to determine the correct agent
3. Call generateResponse(systemPrompt, issueTitle + "\n\n" + issueBody)
4. Format the final GitHub comment as markdown:
   - Start with: "## 🤖 [AGENT_NAME] Response"
   - Include the LLM response body
   - Add a footer: "---\n*Powered by Groq (llama3-70b-8192) | [Neural Office](README link)*"
5. POST the comment to the GitHub Issues API using fetch + GITHUB_TOKEN
6. PATCH the issue status to "closed"
7. Log every step with timestamps

✅ DONE CHECK: Open a GitHub Issue labeled "ask-backend" with a real technical question. Within 90 seconds, the Backend Agent should post a detailed, technical AI-generated response and close the issue.
```

---

## 🗃️ PHASE 3 — RAG Memory Pipeline (Vector DB + Knowledge Ingestion)

### Objective
Give the agents real memory. Every time you push code, GitHub Actions will extract the diff, embed it, and upsert it into ChromaDB. When a recruiter asks a question, the system retrieves relevant context before calling Groq.

> ⚠️ **PREREQUISITE:** Phase 2 must be working. Agents must be responding to issues with live Groq-generated answers.

---

### PHASE 3 — PROMPT BLOCK (Copy this exactly)

```
PHASE 3 TASK: Build the RAG (Retrieval-Augmented Generation) memory pipeline using ChromaDB.

CONTEXT: Groq inference is working. Now give agents persistent memory of the codebase using vector embeddings.

## Step 3.1 — ChromaDB Setup

We use chromadb in local/serverless mode (no external server). The DB will be persisted as a file on the GitHub Actions runner and cached between runs using GitHub Actions cache.

Create: scripts/vector-store.js

Install in package.json (create if not exists):
- chromadb: ^1.8.1
- @xenova/transformers: ^2.17.0 (for local embedding generation — no OpenAI key required)

The vector-store.js module must export:
1. initDB() — initializes ChromaDB with persistent storage at ./chroma-db/
2. upsertChunks(chunks) — takes array of { id, text, metadata } and upserts into collection "neural-office-memory"
3. queryMemory(queryText, agentId, topK = 5) — embeds the query text locally, searches the collection filtered by metadata.agentId, returns top K results as an array of { text, metadata, distance }

Embedding strategy: Use @xenova/transformers with model "Xenova/all-MiniLM-L6-v2" for local inference. No API keys needed.

## Step 3.2 — Code Ingestion Pipeline

Create: scripts/ingest-codebase.js

This script runs when triggered by a push to main. It must:
1. Accept a DIFF_FILES env var (JSON array of changed file paths)
2. For each file:
   a. Read the file content
   b. Determine the agent domain by file extension and path:
      - .tsx, .jsx, .css, .html → frontend
      - .ts, .js, api/, routes/ → backend
      - .sql, migrations/, schema/ → database
      - .yml, .yaml, Dockerfile, terraform/ → devops
      - Everything else → master
   c. Chunk the file content into segments of ~500 tokens (split on function boundaries if possible, otherwise on newlines every 50 lines)
   d. For each chunk, create: { id: "filepath-chunk-N", text: chunk, metadata: { agentId, filePath, language, timestamp } }
3. Call upsertChunks() with all generated chunks
4. Log: total files processed, total chunks upserted, per-agent chunk counts

## Step 3.3 — Update update-svg.yml to Run Ingestion

Update .github/workflows/update-svg.yml:
- Trigger: on push to main
- Steps:
  1. Checkout with fetch-depth: 2 (to get the diff)
  2. Get changed files: git diff --name-only HEAD~1 HEAD → store as JSON
  3. Setup Node.js 20
  4. Restore ChromaDB cache: actions/cache@v4 with key "chroma-db-${{ runner.os }}"
  5. npm install
  6. Run: node scripts/ingest-codebase.js with DIFF_FILES env var
  7. Save ChromaDB cache

## Step 3.4 — Connect RAG to Response Pipeline

Update scripts/respond-to-issue.js to:
1. After routing the query to an agent, call: queryMemory(issueTitle + " " + issueBody, agentId, 5)
2. Format the retrieved context as a string:
   "RELEVANT CODEBASE CONTEXT:\n" + results.map(r => `File: ${r.metadata.filePath}\n${r.text}`).join("\n---\n")
3. Prepend this context to the user message sent to Groq
4. Update the system prompt to instruct the agent: "You have been given relevant code snippets from the developer's actual codebase. Reference them specifically in your answer when applicable."
5. Add to the GitHub comment footer: "*Context retrieved from [N] codebase chunks via RAG*"

✅ DONE CHECK: Push any code file to main. Check the Action logs — you should see "X chunks upserted" for the correct agent domain. Then open an issue asking about that code. The agent's response should reference actual file names or code patterns from your push.
```

---

## 🎨 PHASE 4 — Dynamic SVG Manipulation & Agent Activity Visualization

### Objective
Make the SVG office react to real events. When an agent resolves a query, their sprite gets an animated "active" indicator. The ticker updates with the latest activity. New agents auto-spawn when new tech domains are detected.

> ⚠️ **PREREQUISITE:** Phases 1–3 must all be working end-to-end.

---

### PHASE 4 — PROMPT BLOCK (Copy this exactly)

```
PHASE 4 TASK: Build the dynamic SVG engine that makes the virtual office visually reflect real agent activity.

CONTEXT: The full pipeline (Issues → Groq → RAG → GitHub Comment) is working. Now make the SVG update to show agent activity, creating a living visual dashboard.

## Step 4.1 — SVG State Schema

Create: office/office-state.json

This file tracks the current visual state of the office. The GitHub Action updates it on every resolved issue and every push. Structure:

{
  "lastUpdated": "ISO timestamp",
  "ticker": "Latest activity message string (max 120 chars)",
  "agents": {
    "master": {
      "status": "idle | active | thinking | completed",
      "lastQuery": "short summary of last question (max 60 chars)",
      "lastActive": "ISO timestamp",
      "queriesResolved": 0
    },
    "frontend": { ... },
    "backend": { ... },
    "database": { ... },
    "devops": { ... }
  }
}

## Step 4.2 — SVG Generator Script

Create: office/generate-svg.js (replacing the static base-office.svg with a generated one)

This Node.js script must:
1. Read office/office-state.json
2. Read office/agent-config.json
3. Programmatically construct the full SVG string (900×600px) using template literals
4. For each agent, conditionally render visual state indicators:

   STATUS INDICATORS (rendered as SVG elements inside each agent's desk group):
   - "idle": Soft pulsing ring in agent's accent color (opacity 0.3–0.6, 2s cycle)
   - "thinking": Animated ellipsis (three dots that appear sequentially using CSS animation)
   - "active": Bright glowing aura (drop-shadow filter + animated opacity 0.7–1.0, 0.5s cycle — fast pulse)
   - "completed": Green checkmark badge (✓ text in a green circle) with a 30-second fade-out animation

5. Update the ticker bar with the current state's ticker message using CSS scroll animation
6. Render a "Queries Resolved: N" counter badge above each agent's desk
7. For each agent with lastActive within the past 1 hour, render a speech bubble with lastQuery text
8. Write the final SVG string to office/base-office.svg

SVG CSS ANIMATIONS TO IMPLEMENT (all embedded in <style> tag):
- @keyframes float: translateY(0px) → translateY(-4px) → translateY(0px), 2.5s ease-in-out infinite
- @keyframes pulse-idle: opacity 0.3 → 0.6 → 0.3, 2s ease-in-out infinite
- @keyframes pulse-active: opacity 0.7 → 1.0 → 0.7, 0.5s ease-in-out infinite
- @keyframes thinking-dot: opacity 0 → 1 → 0, 1.5s ease-in-out infinite (dot1: 0s delay, dot2: 0.3s delay, dot3: 0.6s delay)
- @keyframes ticker-scroll: transform translateX(900px) → translateX(-100%), 25s linear infinite
- @keyframes golden-spin: rotate(0deg) → rotate(360deg), 8s linear infinite (for Master Agent ring)
- @keyframes badge-fadeout: opacity 1 → 1 → 0, 30s linear forwards (for completed indicator)
- @keyframes glow-pulse: filter drop-shadow(0 0 4px COLOR) → drop-shadow(0 0 12px COLOR), 0.5s ease-in-out alternate infinite

## Step 4.3 — State Updater Script

Create: scripts/update-office-state.js

This script accepts CLI arguments or environment variables:
- ACTION_TYPE: "query_resolved" | "push_ingested" | "agent_spawned"
- AGENT_ID: target agent
- QUERY_SUMMARY: short description (for query_resolved)

Logic:
- Read office-state.json
- Update the target agent's status, lastActive, and queriesResolved
- Update the global ticker message based on action type:
  - query_resolved: "🤖 [Agent Name] just resolved: '[query summary]'"
  - push_ingested: "📚 [Agent Name] ingested [N] new code chunks"
  - agent_spawned: "🌱 New agent spawned: [Agent Name]"
- Write updated office-state.json
- Run node office/generate-svg.js to regenerate the SVG
- Stage and commit both files using git with message: "chore(office): update agent state [skip ci]"
- Push to main using GITHUB_TOKEN

## Step 4.4 — Auto-Spawn New Agents

Update scripts/ingest-codebase.js to include auto-spawn detection:

After ingestion, count chunks per technology tag:
- If any unrecognized technology accumulates > 20 chunks in a single push (e.g., many .rs Rust files, .go Go files, .py Python files):
  1. Call Groq API with classification prompt: "Given these file extensions and directory names: [list], what single software engineering domain does this represent? Respond with ONLY: domain_name|AgentName|AccentHexColor"
  2. Parse the response
  3. Append the new agent to agent-config.json
  4. Add the new agent to office-state.json with status "idle"
  5. Call generate-svg.js — the generator must handle N agents dynamically by arranging extra desks in a grid
  6. Log: "🌱 New agent spawned: [name]"

Dynamic desk positioning algorithm for N agents:
- Pre-defined positions for 5 base agents (as in Phase 1)
- Additional agents: arrange in a row at y=480, starting at x=50, spacing x+180 per agent
- Maximum 8 agents before triggering a "office expansion" that increases SVG height to 800px

## Step 4.5 — Wire State Updates into Pipeline

Update respond-to-issue.js:
- After posting the GitHub comment, run: node scripts/update-office-state.js with ACTION_TYPE=query_resolved, AGENT_ID=[agentId], QUERY_SUMMARY=[first 60 chars of issue title]

Update update-svg.yml:
- After ingest-codebase.js completes, run update-office-state.js with ACTION_TYPE=push_ingested

## Step 4.6 — Issue Template

Create: .github/ISSUE_TEMPLATE/query_template.md

This is the pre-filled template that opens when a recruiter clicks an agent sprite:

---
name: Agent Query
about: Ask an AI agent a technical question
title: 'Query for [Agent Name]: '
labels: ask-agent
body:
  - type: markdown
    attributes:
      value: "## 🤖 Ask the Neural Office AI Agents\nYour question will be answered within 60 seconds by the AI agent. The response will appear as a comment below."
  - type: input
    id: question
    attributes:
      label: Your Question
      placeholder: "How does the authentication system work? What tech stack is used?"
    validations:
      required: true
  - type: dropdown
    id: agent
    attributes:
      label: Which agent should answer?
      options:
        - Master Agent (general / cross-domain)
        - Frontend Agent (React, UI, CSS)
        - Backend Agent (APIs, auth, server)
        - Database Agent (SQL, queries, schema)
        - DevOps Agent (CI/CD, Docker, cloud)
    validations:
      required: true
---

✅ DONE CHECK: 
1. Open a GitHub Issue. Within 90 seconds, the agent should respond AND the office-state.json and base-office.svg should be committed to your repo with the agent in "completed" state.
2. Visit your GitHub profile — the SVG should show the agent's completed badge and the ticker should display the latest activity.
3. Push 25+ Rust (.rs) files to your repo — a new "Systems Agent" should auto-spawn and appear in the SVG.
```

---

## 🔐 ENVIRONMENT & SECRETS REFERENCE

Create these GitHub Secrets in your repository settings before running any phase:

| Secret Name | Value | Used In |
|---|---|---|
| `GROQ_API_KEY` | Your Groq API key from console.groq.com | Phase 2+ |
| `GITHUB_TOKEN` | Auto-provided by GitHub Actions | All phases |

---

## 📋 PHASE COMPLETION CHECKLIST

Use this to track progress before moving to the next phase:

### Phase 1 ✅
- [ ] SVG renders correctly in README.md on GitHub profile
- [ ] All 5 agent sprites are visible with pixel-art design
- [ ] Clicking a sprite opens a pre-filled GitHub Issue
- [ ] GitHub Action triggers on issue open
- [ ] Hardcoded comment posted and issue closed automatically

### Phase 2 ✅
- [ ] GROQ_API_KEY secret added to repository
- [ ] Issue routing works via labels
- [ ] Groq API returns a response (check Action logs)
- [ ] Agent-persona system prompt reflected in response tone
- [ ] Comment is properly formatted markdown

### Phase 3 ✅
- [ ] ChromaDB initializes without error in Action logs
- [ ] Code push triggers ingestion (see "X chunks upserted" in logs)
- [ ] RAG context appears in agent response (check for file references)
- [ ] Cache hits on subsequent runs (ChromaDB not rebuilt from scratch)

### Phase 4 ✅
- [ ] office-state.json updates after each issue resolution
- [ ] base-office.svg regenerates and commits automatically
- [ ] Agent status indicator changes are visible in SVG
- [ ] Ticker message updates with latest activity
- [ ] Auto-spawn triggers correctly for new technology domains

---

## 🚨 TROUBLESHOOTING PROMPTS

If an agent gives you incorrect output during any phase, use these correction prompts:

**If SVG doesn't render on GitHub:**
> "The SVG is not rendering in the GitHub README. GitHub sanitizes SVGs — remove all `<script>` tags, `foreignObject` elements, and external `xlink:href` references pointing outside the repo. Use only CSS animations, no JavaScript in the SVG."

**If GitHub Action fails with permission errors:**
> "The GitHub Action is failing with a 403 permission error. Add `permissions: issues: write` and `contents: write` at the top of the workflow YAML. Also ensure the workflow uses `${{ secrets.GITHUB_TOKEN }}` not a personal access token."

**If Groq API returns timeout:**
> "Groq API is timing out. Switch model from llama3-70b-8192 to llama3-8b-8192 for faster inference. Also reduce max_tokens from 1500 to 800 for speed."

**If ChromaDB fails in GitHub Actions:**
> "ChromaDB is failing to initialize in the GitHub Actions environment. Use chromadb's EphemeralClient instead of PersistentClient for the Actions runner, and save/restore the embedding data manually as a JSON file using the GitHub Actions cache."

**If SVG animations don't work:**
> "GitHub's SVG renderer strips keyframe animations with certain timing functions. Replace all `ease-in-out` with `linear` in @keyframes blocks. Also wrap all animation styles in a `<![CDATA[...]]>` block inside the `<style>` tag."

---

*Built for: GitHub Profile README — Serverless AI Agent Virtual Office*
*Stack: GitHub Actions · Groq API · ChromaDB · SVG · Node.js*
*Prompt version: 1.0 — Antigravity Edition*
