import { useEffect, useRef, useState } from 'react';

export default function ChatView({ exchanges, tones, tone, setTone, streaming, onSend, onStop, error }) {
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [exchanges]);

  const submit = (e) => {
    e.preventDefault();
    if (!input.trim() || streaming) return;
    onSend(input);
    setInput('');
  };

  return (
    <main className="chat">
      <header className="chat-header">
        <span>Tone:</span>
        <div className="tone-toggle">
          {tones.map((t) => (
            <button key={t} className={t === tone ? 'active' : ''} onClick={() => setTone(t)}>{t}</button>
          ))}
        </div>
      </header>

      <div className="messages">
        {exchanges.length === 0 && <p className="empty">Start a conversation…</p>}
        {exchanges.map((ex, i) => (
          <div key={i}>
            <div className="bubble user">{ex.prompt}</div>
            <div className="bubble ai">
              {ex.response || (streaming && i === exchanges.length - 1 ? <span>…</span> : '')}
              {ex.stopped && <em className="stopped"> (stopped)</em>}
              <div className="meta">{ex.tone} · {new Date(ex.timestamp).toLocaleTimeString()}</div>
            </div>
          </div>
        ))}
        {error && <div className="error">{error}</div>}
        <div ref={bottomRef} />
      </div>

      <form className="composer" onSubmit={submit}>
        <textarea rows={2} value={input} placeholder="Type a message… (Enter to send)"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) submit(e); }} />
        {streaming
          ? <button type="button" className="stop" onClick={onStop}>Stop</button>
          : <button type="submit">Send</button>}
      </form>
    </main>
  );
}