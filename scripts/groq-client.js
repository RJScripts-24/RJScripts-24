const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
  console.error("Missing GROQ_API_KEY environment variable.");
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function generateResponse(systemPrompt, userQuery) {
  const url = "https://api.groq.com/openai/v1/chat/completions";
  
  const payload = {
    model: "llama3-70b-8192",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userQuery }
    ],
    max_tokens: 1500,
    temperature: 0.3
  };

  const backoffDelays = [1000, 2000, 4000];
  
  for (let attempt = 0; attempt <= backoffDelays.length; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Groq API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`Token usage: ${JSON.stringify(data.usage)}`);
      return data.choices[0].message.content;
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed: ${error.message}`);
      if (attempt < backoffDelays.length) {
        console.log(`Retrying in ${backoffDelays[attempt]}ms...`);
        await sleep(backoffDelays[attempt]);
      } else {
        throw new Error(`All attempts to call Groq API failed. Last error: ${error.message}`);
      }
    }
  }
}

module.exports = { generateResponse };
