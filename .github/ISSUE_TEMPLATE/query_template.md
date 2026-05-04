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
