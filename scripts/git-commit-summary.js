const { execSync } = require("child_process");

function safeExec(command, fallback = "") {
  try {
    return execSync(command, { encoding: "utf8" }).trim();
  } catch {
    return fallback;
  }
}

function detectDomain(files) {
  const rules = [
    { domain: "frontend",  patterns: ["frontend/", "components/", ".tsx", ".jsx", ".css", ".html", "ui/", "public/"] },
    { domain: "backend",   patterns: ["backend/", "api/", "server/", "routes/", ".py", "controllers/"] },
    { domain: "database",  patterns: ["migrations/", "schema", "prisma/", "models/", ".sql", "db/"] },
    { domain: "devops",    patterns: [".github/", "Dockerfile", "docker-compose", ".yml", ".yaml", "nginx/", "k8s/"] },
  ];
  for (const { domain, patterns } of rules) {
    if (files.some(f => patterns.some(p => f.includes(p)))) return domain;
  }
  return "general";
}

function getCommitSummary() {
  const sha     = safeExec("git rev-parse --short HEAD") || "unknown";
  const message = safeExec("git log -1 --pretty=%s")    || "No commit message";
  const author  = safeExec("git log -1 --pretty=%an")   || "unknown";

  let filesChanged = [];
  let domain       = "general";
  try {
    const raw = execSync("git diff --name-only HEAD~1 HEAD", { encoding: "utf8" }).trim();
    filesChanged = raw ? raw.split("\n").filter(Boolean) : [];
    domain       = detectDomain(filesChanged);
  } catch {
    // initial commit or shallow clone — no parent to diff against
    domain = "general";
  }

  return { sha, message, author, filesChanged, domain };
}

// Legacy export kept for any existing callers
function summarizeChangedFiles(files) {
  const categories = { frontend: 0, backend: 0, database: 0, devops: 0, other: 0 };
  for (const file of files) {
    const f = file.toLowerCase();
    if (/\.(tsx|jsx|css|scss|html)$/.test(f)) categories.frontend += 1;
    else if (/\.(sql)$/.test(f) || f.includes("schema") || f.includes("migration")) categories.database += 1;
    else if (/\.(ya?ml)$/.test(f) || f.includes("docker") || f.includes("terraform") || f.includes(".github/workflows")) categories.devops += 1;
    else if (/\.(js|ts|mjs|cjs)$/.test(f) || f.includes("api") || f.includes("server")) categories.backend += 1;
    else categories.other += 1;
  }
  return categories;
}

function getLatestCommitSummary() {
  const sha       = safeExec("git rev-parse HEAD");
  const shortSha  = safeExec("git rev-parse --short HEAD");
  const message   = safeExec("git log -1 --pretty=%s");
  const author    = safeExec("git log -1 --pretty=%an");
  const timestamp = safeExec("git log -1 --pretty=%cI");
  const changedRaw = safeExec("git diff-tree --no-commit-id --name-only -r HEAD");
  const changedFiles = changedRaw ? changedRaw.split("\n").filter(Boolean) : [];
  const diffStats = safeExec("git diff --shortstat HEAD~1 HEAD");
  const remote    = safeExec("git config --get remote.origin.url");

  let repoOwner = "";
  let repoName  = "";
  if (remote.includes("github.com")) {
    const normalized = remote.replace(".git", "");
    const m = normalized.match(/github\.com[:/](.+?)\/(.+)$/);
    if (m) { repoOwner = m[1]; repoName = m[2]; }
  }

  const url = repoOwner && repoName && sha
    ? `https://github.com/${repoOwner}/${repoName}/commit/${sha}`
    : "";
  const summaryByDomain = summarizeChangedFiles(changedFiles);

  return { sha, shortSha, message, author, timestamp, url, changedFiles, diffStats, summaryByDomain };
}

module.exports = { getCommitSummary, getLatestCommitSummary, summarizeChangedFiles, detectDomain };
