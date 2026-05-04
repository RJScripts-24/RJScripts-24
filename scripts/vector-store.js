const { ChromaClient } = require("chromadb");
const { pipeline } = require("@xenova/transformers");

let client = null;
let collection = null;
let embedder = null;

async function initDB() {
  if (!client) {
    // Note: Node.js chromadb client expects a running server. We initialize with defaults.
    // In a real local GitHub action, you'd run a chroma docker container as a service.
    client = new ChromaClient();
    
    try {
      collection = await client.getOrCreateCollection({
        name: "neural-office-memory",
      });
    } catch (e) {
      console.error("Failed to init collection:", e);
    }
  }

  if (!embedder) {
    embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }

  return { client, collection, embedder };
}

async function getEmbeddings(texts) {
  const output = await embedder(texts, { pooling: "mean", normalize: true });
  return output.tolist();
}

async function upsertChunks(chunks) {
  await initDB();
  
  const ids = chunks.map(c => c.id);
  const documents = chunks.map(c => c.text);
  const metadatas = chunks.map(c => c.metadata);
  
  const embeddings = await getEmbeddings(documents);

  await collection.upsert({
    ids: ids,
    embeddings: embeddings,
    metadatas: metadatas,
    documents: documents
  });
}

async function queryMemory(queryText, agentId, topK = 5) {
  await initDB();
  
  const queryEmbedding = await getEmbeddings([queryText]);
  
  const results = await collection.query({
    queryEmbeddings: queryEmbedding,
    nResults: topK,
    where: { agentId: agentId }
  });

  const formattedResults = [];
  if (results && results.documents && results.documents[0]) {
    for (let i = 0; i < results.documents[0].length; i++) {
      formattedResults.push({
        text: results.documents[0][i],
        metadata: results.metadatas[0][i],
        distance: results.distances[0][i]
      });
    }
  }
  
  return formattedResults;
}

module.exports = { initDB, upsertChunks, queryMemory };
