import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import { TONES, buildSystemPrompt } from '../config/tones.js';
import { streamReply, generateTitle } from '../services/llm.js';

const MAX_PROMPT = 4000;
const HISTORY_LIMIT = 10;

export async function list(req, res) {
  const convos = await Conversation.find({}, 'title updatedAt').sort({ updatedAt: -1 });
  res.json(convos);
}

export async function getOne(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  const convo = await Conversation.findById(req.params.id);
  if (!convo) return res.status(404).json({ error: 'Not found' });
  res.json(convo);
}

export async function remove(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  await Conversation.findByIdAndDelete(req.params.id);
  res.status(204).end();
}

export async function chat(req, res) {
  const { conversationId, prompt, tone = 'professional' } = req.body;
  const text = typeof prompt === 'string' ? prompt.trim() : '';

  // Server-side validation
  if (!text) return res.status(400).json({ error: 'Prompt is required' });
  if (text.length > MAX_PROMPT) return res.status(400).json({ error: `Prompt exceeds ${MAX_PROMPT} characters` });
  if (!TONES[tone]) return res.status(400).json({ error: 'Invalid tone' });
  if (conversationId && !mongoose.isValidObjectId(conversationId))
    return res.status(400).json({ error: 'Invalid conversation id' });

  const convo = conversationId ? await Conversation.findById(conversationId) : new Conversation();
  if (!convo) return res.status(404).json({ error: 'Conversation not found' });
  const isNew = convo.isNew;
  if (isNew) await convo.save();

  // Previous messages as context
  const history = convo.exchanges.slice(-HISTORY_LIMIT).flatMap((e) => [
    { role: 'user', content: e.prompt },
    { role: 'assistant', content: e.response || '(no response)' },
  ]);
  const messages = [...history, { role: 'user', content: text }];

  // Server-Sent Events stream
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  send('meta', { conversationId: convo._id });

  const stream = streamReply({ system: buildSystemPrompt(tone), messages });
  let full = '';
  let stopped = false;

  // Extra feature 2: user clicked Stop -> abort AI call
  res.on('close', () => {
    if (!res.writableEnded) { stopped = true; stream.abort(); }
  });

  stream.on('text', (t) => { full += t; send('delta', { text: t }); });

  try {
    await stream.finalMessage();
  } catch (err) {
    if (!stopped) { console.error(err); send('error', { error: 'AI service error' }); }
  }

  // Save to MongoDB
  convo.exchanges.push({ prompt: text, response: full, tone, stopped });
  if (isNew) {
    convo.title = full
      ? await generateTitle(text, full).catch(() => text.slice(0, 40))
      : text.slice(0, 40);
  }
  await convo.save();

  if (!stopped) { send('done', { title: convo.title }); res.end(); }
}