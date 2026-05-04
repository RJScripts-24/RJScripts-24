require('dotenv').config();

const { routeQuery } = require('./intent-router');
const { generateResponse } = require('./groq-client');

const FAKE_ISSUE = {
  title: 'Query for Backend Agent: How does routing work?',
  body: 'I want to understand how the intent-router selects the right agent from the issue labels.',
  labels: ['ask-agent', 'ask-backend']
};

async function main() {
  console.log('--- test-pipeline.js ---');
  console.log('Simulating issue:', FAKE_ISSUE.title);
  console.log('Labels:', FAKE_ISSUE.labels);

  if (!process.env.GROQ_API_KEY) {
    console.error('ERROR: GROQ_API_KEY is not set. Add it to a .env file.');
    process.exit(1);
  }

  console.log('\n[1] Routing query...');
  const agentInfo = await routeQuery(FAKE_ISSUE.title, FAKE_ISSUE.body, FAKE_ISSUE.labels);
  console.log(`    → Routed to: ${agentInfo.agentId} (${agentInfo.agentName})`);

  console.log('\n[2] Calling Groq API...');
  const userQuery = `${FAKE_ISSUE.title}\n\n${FAKE_ISSUE.body}`;
  const aiResponse = await generateResponse(agentInfo.systemPrompt, userQuery);

  const askAgainUrl =
    'https://github.com/RJScripts-24/RJScripts-24/issues/new?template=query_template.yml&labels=ask-agent&title=Query%3A%20';
  const formatted =
    `## 🤖 ${agentInfo.agentName} — Neural Office Response\n\n` +
    `${aiResponse}\n\n---\n` +
    `*Powered by [Groq](https://groq.com) (llama3-70b-8192) · ` +
    `[Ask another question](${askAgainUrl}) · ` +
    `[Neural Office](https://github.com/RJScripts-24/RJScripts-24)*`;

  console.log('\n[3] Formatted response (would post to GitHub Issues):\n');
  console.log('─'.repeat(60));
  console.log(formatted);
  console.log('─'.repeat(60));
  console.log('\n✅ Pipeline test passed. No GitHub API calls were made.');
}

main().catch(err => {
  console.error('\n❌ Pipeline test FAILED:', err.message);
  process.exit(1);
});
