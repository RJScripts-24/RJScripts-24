const fs = require("fs");
const path = require("path");

const README_PATH = path.join(__dirname, "..", "README.md");
const USERNAME = "RJScripts-24";
const START = "<!-- STARRED_PROJECTS:START -->";
const END = "<!-- STARRED_PROJECTS:END -->";

async function fetchAllStarred(user) {
  const repos = [];
  let page = 1;
  while (true) {
    const url = `https://api.github.com/users/${user}/starred?per_page=100&page=${page}`;
    const res = await fetch(url, {
      headers: {
        "Accept": "application/vnd.github+json",
        "User-Agent": "neural-office-readme-sync",
      },
    });
    if (!res.ok) {
      throw new Error(`GitHub API failed: ${res.status} ${res.statusText}`);
    }
    const chunk = await res.json();
    if (!Array.isArray(chunk) || chunk.length === 0) break;
    repos.push(...chunk);
    page += 1;
  }
  return repos;
}

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function projectCell(repo) {
  const name = esc(repo.name);
  const url = esc(repo.html_url);
  const description = esc(repo.description || "No description provided.");
  const stars = Number(repo.stargazers_count || 0);
  const lang = esc(repo.language || "Mixed");

  return [
    `<td width="50%" valign="top">`,
    ``,
    `### 🚀 [${name}](${url})`,
    `> ${description}`,
    ``,
    `**Snapshot:**`,
    `- Language: ${lang}`,
    `- Stars: ${stars}`,
    `- Updated: ${new Date(repo.updated_at).toISOString().slice(0, 10)}`,
    ``,
    `[![Stars](https://img.shields.io/github/stars/${USERNAME}/${name}?style=social)](${url})`,
    ``,
    `</td>`,
  ].join("\n");
}

function buildTable(repos) {
  if (!repos.length) {
    return [
      START,
      `<p>No starred repositories found yet.</p>`,
      END,
    ].join("\n");
  }

  const cells = repos.map(projectCell);
  const rows = [];
  for (let i = 0; i < cells.length; i += 2) {
    const left = cells[i];
    const right = cells[i + 1] || `<td width="50%" valign="top" align="center"><br><br><em>More starred projects soon.</em></td>`;
    rows.push(`<tr>\n${left}\n${right}\n</tr>`);
  }

  return [
    START,
    `<table>`,
    rows.join("\n"),
    `</table>`,
    END,
  ].join("\n");
}

async function main() {
  const readme = fs.readFileSync(README_PATH, "utf8");
  const startIdx = readme.indexOf(START);
  const endIdx = readme.indexOf(END);
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    throw new Error("README markers for starred projects were not found.");
  }

  const starred = await fetchAllStarred(USERNAME);
  // Stable order for cleaner diffs: most recently starred first from API response.
  const replacement = buildTable(starred);
  const before = readme.slice(0, startIdx);
  const after = readme.slice(endIdx + END.length);
  const next = `${before}${replacement}${after}`;

  if (next !== readme) {
    fs.writeFileSync(README_PATH, next);
    console.log(`Updated starred projects section (${starred.length} repos).`);
  } else {
    console.log("No README changes needed.");
  }
}

main().catch((err) => {
  console.error("[sync-starred-projects] Failed:", err.message);
  process.exit(1);
});
