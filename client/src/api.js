const BASE = 'http://localhost:5001/api';

export const getConversations = () => fetch(`${BASE}/conversations`).then((r) => r.json());
export const getConversation = (id) => fetch(`${BASE}/conversations/${id}`).then((r) => r.json());
export const deleteConversation = (id) => fetch(`${BASE}/conversations/${id}`, { method: 'DELETE' });
export const getTones = () => fetch(`${BASE}/tones`).then((r) => r.json());

export async function streamChat({ conversationId, prompt, tone, signal, onEvent }) {
  const res = await fetch(`${BASE}/conversations/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationId, prompt, tone }),
    signal,
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || 'Request failed');
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const parts = buf.split('\n\n');
    buf = parts.pop();
    for (const part of parts) {
      const event = part.match(/^event: (.*)$/m)?.[1];
      const data = part.match(/^data: (.*)$/m)?.[1];
      if (event && data) onEvent(event, JSON.parse(data));
    }
  }
}