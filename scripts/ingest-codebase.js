const fs = require("fs");
const path = require("path");
const { upsertChunks } = require("./vector-store");

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

  console.log(`Total files processed: ${files.length}`);
  console.log(`Total chunks upserted: ${totalUpserted}`);
  console.log(`Per-agent chunk counts:`, perAgentCounts);
}

main().catch(console.error);
