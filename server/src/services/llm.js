import OpenAI from 'openai';

// Create the client lazily so .env is definitely loaded first
let client;
const getClient = () =>
  (client ??= new OpenAI({ apiKey: process.env.AI_API_KEY, baseURL: process.env.AI_BASE_URL }));

// Streams the AI reply. Returns { on('text'), finalMessage(), abort() }
export function streamReply({ system, messages }) {
  const controller = new AbortController();
  const listeners = [];

  const done = (async () => {
    const stream = await getClient().chat.completions.create(
      { model: process.env.MODEL, stream: true, messages: [{ role: 'system', content: system }, ...messages] },
      { signal: controller.signal }
    );
    for await (const chunk of stream) {
      const t = chunk.choices[0]?.delta?.content;
      if (t) listeners.forEach((fn) => fn(t));
    }
  })();

  return {
    on: (event, fn) => { if (event === 'text') listeners.push(fn); },
    finalMessage: () => done,
    abort: () => controller.abort(),
  };
}

// Extra feature 1: AI-generated conversation title
export async function generateTitle(prompt, response) {
  const r = await getClient().chat.completions.create({
    model: process.env.MODEL,
    max_tokens: 20,
    messages: [
      { role: 'system', content: 'Write a short title (max 5 words) for this conversation. Reply with the title only, no quotes.' },
      { role: 'user', content: `User: ${prompt}\nAssistant: ${response.slice(0, 500)}` },
    ],
  });
  return r.choices[0]?.message?.content?.trim().replace(/^"|"$/g, '').slice(0, 60) || prompt.slice(0, 40);
}