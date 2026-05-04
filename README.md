<div align="center">

# 🤖 Neural Office — AI Agent Swarm

**A fully autonomous AI assistant that lives on my GitHub profile.**

[![Launch Interactive Office](https://img.shields.io/badge/Launch_Interactive_Office-Open_Chat_Room-0ea5e9?style=for-the-badge&logo=github)](https://rjscripts-24.github.io/RJScripts-24/office/interactive-office.html)

<img src="office/base-office.svg" alt="Neural Office — animated preview (use Ask links below; SVG links do not work inside README images)" width="100%">

*↑ Live animated SVG preview. Profile READMEs cannot make in-image clicks hit different URLs — use the **Ask →** links in the table below (always works), or the badge once GitHub Pages is enabled.*

> **GitHub Pages:** If the badge shows “404 — There isn't a GitHub Pages site here”, enable Pages on this repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**, then run the “Deploy Interactive Office” workflow (or push to `main`). First deploy may need approval under **Actions → Deploy Interactive Office**.

</div>

---

## 💬 How to Ask an Agent a Question

> GitHub profile READMEs can't run JavaScript, so the animated SVG above is only a preview.
> On GitHub Pages, the interactive room lets you click desks on the image.

**Option A — Use the interactive room** (after Pages is live):
[Launch Interactive Office →](https://rjscripts-24.github.io/RJScripts-24/office/interactive-office.html)

**Option B — Direct agent links:**

| Agent | Specialty | Ask Now |
|-------|-----------|---------|
| 🎯 Master Agent | Architecture, cross-domain questions | [Ask →](https://github.com/RJScripts-24/RJScripts-24/issues/new?template=query_template.yml&labels=ask-agent,ask-master&title=Query%20for%20Master%20Agent%3A%20) |
| 🎨 Frontend Agent | React, TypeScript, CSS, UI/UX | [Ask →](https://github.com/RJScripts-24/RJScripts-24/issues/new?template=query_template.yml&labels=ask-agent,ask-frontend&title=Query%20for%20Frontend%20Agent%3A%20) |
| ⚙️ Backend Agent | APIs, authentication, server logic | [Ask →](https://github.com/RJScripts-24/RJScripts-24/issues/new?template=query_template.yml&labels=ask-agent,ask-backend&title=Query%20for%20Backend%20Agent%3A%20) |
| 🗃️ Database Agent | SQL, schema design, queries | [Ask →](https://github.com/RJScripts-24/RJScripts-24/issues/new?template=query_template.yml&labels=ask-agent,ask-database&title=Query%20for%20Database%20Agent%3A%20) |
| 🚀 DevOps Agent | CI/CD, Docker, cloud, GitHub Actions | [Ask →](https://github.com/RJScripts-24/RJScripts-24/issues/new?template=query_template.yml&labels=ask-agent,ask-devops&title=Query%20for%20DevOps%20Agent%3A%20) |

> ⏱️ **Response time: ~60 seconds** · Powered by Groq (llama3-70b-8192) · Responses are AI-generated

---

## 🏗️ How It Works (Technical)

```
Recruiter clicks agent
       ↓
GitHub Issues page opens (pre-filled as chatbox)
       ↓
Recruiter submits question
       ↓
GitHub Actions trigger (respond-to-issue.yml)
       ↓
Intent router reads issue labels → selects agent persona
       ↓
Groq API called (llama3-70b-8192, ~800ms inference)
       ↓
Agent posts formatted reply as issue comment
       ↓
Issue closed automatically
       ↓
office-state.json updated → SVG regenerated → committed
       ↓
Profile README shows updated speech bubble + ticker
```

**Stack:** GitHub Actions · Groq API · ChromaDB (RAG) · Programmatic SVG · Node.js

---

### Recent Activity
<!-- ACTIVITY_LOG -->
