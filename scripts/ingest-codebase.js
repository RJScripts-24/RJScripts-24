const fs = require("fs");
const path = require("path");
const { execSync } = require('child_process');
const { upsertChunks } = require("./vector-store");
const { generateResponse } = require("./groq-client");

async function main() {
  const diffFilesJson = process.env.DIFF_FILES;
  if (!diffFilesJson) {
    console.log("No DIFF_FILES provided, skipping ingestion.");
    return;
  }

  let files = [];
  try {
    files = JSON.parse(diffFilesJson);
  } catch (e) {
    console.error("Failed to parse DIFF_FILES");
    return;
  }

  let totalUpserted = 0;
  const perAgentCounts = {
    frontend: 0,
    backend: 0,
    database: 0,
    devops: 0,
    master: 0
  };

  const chunks = [];

  for (const file of files) {
    if (!fs.existsSync(file)) continue;

    const content = fs.readFileSync(file, "utf8");
    const ext = path.extname(file).toLowerCase();
    
    let agentId = "master";
    if ([".tsx", ".jsx", ".css", ".html"].includes(ext)) agentId = "frontend";
    else if ([".ts", ".js"].includes(ext) || file.includes("api/") || file.includes("routes/")) agentId = "backend";
    else if ([".sql"].includes(ext) || file.includes("migrations/") || file.includes("schema/")) agentId = "database";
    else if ([".yml", ".yaml"].includes(ext) || file.includes("Dockerfile") || file.includes("terraform/")) agentId = "devops";

    const lines = content.split("\n");
    let currentChunk = "";
    let chunkIndex = 0;
    
    for (let i = 0; i < lines.length; i++) {
      currentChunk += lines[i] + "\n";
      if ((i + 1) % 50 === 0 || i === lines.length - 1) {
        chunks.push({
          id: `${file}-chunk-${chunkIndex}`,
          text: currentChunk,
          metadata: {
            agentId,
            filePath: file,
            language: ext.replace(".", ""),
            timestamp: new Date().toISOString()
          }
        });
        perAgentCounts[agentId]++;
        chunkIndex++;
        currentChunk = "";
      }
    }
  }

  if (chunks.length > 0) {
    await upsertChunks(chunks);
    totalUpserted = chunks.length;
  }

  // 4.4 Auto-spawn detection
  const unknownCount = Object.keys(perAgentCounts)
    .filter(k => k !== 'frontend' && k !== 'backend' && k !== 'database' && k !== 'devops' && k !== 'master')
    .reduce((sum, k) => sum + perAgentCounts[k], 0);

  // Simple heuristic: if we have lots of master chunks (default for unknowns), analyze them
  if (perAgentCounts.master > 20) {
    try {
      console.log("Analyzing for new agent spawn...");
      const extensions = Array.from(new Set(files.map(f => path.extname(f))));
      const dirs = Array.from(new Set(files.map(f => path.dirname(f))));
      const prompt = `Given these file extensions and directory names: [${extensions.join(',')}], [${dirs.join(',')}], what single software engineering domain does this represent? Respond with ONLY: domain_name|AgentName|AccentHexColor`;
      
      const response = await generateResponse("You classify technical domains.", prompt);
      const [domainId, agentName, color] = response.split('|').map(s => s.trim());
      
      if (domainId && agentName && color && !Object.keys(perAgentCounts).includes(domainId)) {
        console.log(`Spawning new agent: ${agentName} (${domainId})`);
        
        const configPath = path.join(__dirname, '../office/agent-config.json');
        const statePath = path.join(__dirname, '../office/office-state.json');
        
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
        
        const baseCount = config.agents.length;
        const newX = 50 + ((baseCount - 5) * 180);
        const newY = 480;
        
        config.agents.push({
          id: domainId,
          name: agentName,
          role: `${agentName} specialist`,
          issueLabel: `ask-${domainId}`,
          accentColor: color,
          deskPosition: { x: newX, y: newY },
          status: "idle",
          lastActivity: null
        });
        
        state.agents[domainId] = {
          status: "idle",
          lastQuery: null,
          lastActive: null,
          queriesResolved: 0
        };
        
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
        
        execSync(`node scripts/update-office-state.js agent_spawned ${domainId} ""`, { stdio: 'inherit' });
      }
    } catch (e) {
      console.error("Auto-spawn failed:", e.message);
    }
  }

  console.log(`Total files processed: ${files.length}`);
  console.log(`Total chunks upserted: ${totalUpserted}`);
  console.log(`Per-agent chunk counts:`, perAgentCounts);
}

main().catch(console.error);
