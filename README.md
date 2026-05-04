<div align="center">

# Neural Office — Commit Choreography

**A living SVG office where specialist agents review every latest commit together.**

[![Open Interactive Office](https://img.shields.io/badge/Open_Interactive_Office-Live_Conversation_View-0ea5e9?style=for-the-badge&logo=github)](https://rjscripts-24.github.io/RJScripts-24/office/interactive-office.html)

<a href="https://rjscripts-24.github.io/RJScripts-24/office/interactive-office.html">
  <img src="office/base-office.svg" alt="Neural Office commit conversation SVG preview" width="100%">
</a>

*The SVG above updates from GitHub Actions after new commits land on `main`.*

</div>

---

## What Changed

- Removed the issue-query chatbox path as the primary interaction.
- Agents now auto-discuss the **latest commit** (files changed + diff context).
- The center desk is removed from the scene; agents walk to a sync zone, talk, and return.
- Conversation and animation plans are stored in `office/office-state.json`.

---

## Architecture

```text
push to main
   ↓
update-svg.yml workflow runs
   ↓
ingest-codebase.js updates memory store
   ↓
generate-conversation.js builds commit discussion
   ├─ template fallback (always)
   └─ Groq enhancement (if GROQ_API_KEY exists)
   ↓
update-office-state.js writes state schema
   ↓
generate-svg.js renders animated office/base-office.svg
   ↓
workflow commits state + svg with [skip ci]
   ↓
GitHub Pages shows interactive-office.html
```

---

## Runtime Notes

- Conversation mode is hybrid:
  - **Template mode** when no API key is available.
  - **Groq mode** when `GROQ_API_KEY` is configured.
- SVG links now route to the interactive office page, not issue templates.
- To run locally:
  - `npm run generate:conversation`
  - `npm run generate:office`

---

## Pages Setup

If `interactive-office.html` shows 404:

1. Repository **Settings → Pages**  
2. **Build and deployment → Source: GitHub Actions**  
3. Run the **Deploy Interactive Office** workflow once

---

### Recent Activity
<!-- ACTIVITY_LOG -->
