import { useEffect, useRef, useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';
import * as api from './api';
import './App.css';

export default function App() {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [exchanges, setExchanges] = useState([]);
  const [tones, setTones] = useState([]);
  const [tone, setTone] = useState('professional');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState('');
  const queueRef = useRef('');   // text waiting to be "typed"
  const abortRef = useRef(null); // for the Stop button

  const refreshList = () => api.getConversations().then(setConversations);
  useEffect(() => { refreshList(); api.getTones().then(setTones); }, []);

  // Typewriter effect: show queued text character by character
  useEffect(() => {
    const id = setInterval(() => {
      const q = queueRef.current;
      if (!q) return;
      const n = Math.max(1, Math.ceil(q.length / 60));
      queueRef.current = q.slice(n);
      setExchanges((prev) => {
        if (!prev.length) return prev;
        const copy = [...prev];
        const last = { ...copy[copy.length - 1] };
        last.response += q.slice(0, n);
        copy[copy.length - 1] = last;
        return copy;
      });
    }, 15);
    return () => clearInterval(id);
  }, []);

  const resetView = () => { queueRef.current = ''; setError(''); };

  const selectConversation = async (id) => {
    if (streaming) return;
    resetView();
    setActiveId(id);
    const c = await api.getConversation(id);
    setExchanges(c.exchanges || []);
  };

  const newChat = () => { if (streaming) return; resetView(); setActiveId(null); setExchanges([]); };

  const deleteChat = async (id) => {
    await api.deleteConversation(id);
    if (id === activeId) newChat();
    refreshList();
  };

  const send = async (prompt) => {
    setError('');
    setExchanges((prev) => [...prev, { prompt, response: '', tone, timestamp: new Date().toISOString() }]);
    setStreaming(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      await api.streamChat({
        conversationId: activeId, prompt, tone, signal: controller.signal,
        onEvent: (event, data) => {
          if (event === 'meta') setActiveId(data.conversationId);
          if (event === 'delta') queueRef.current += data.text;
          if (event === 'error') setError(data.error);
        },
      });
    } catch (e) {
      if (e.name === 'AbortError') {
        setExchanges((prev) => prev.map((ex, i) => (i === prev.length - 1 ? { ...ex, stopped: true } : ex)));
      } else {
        setError(e.message);
        setExchanges((prev) => prev.slice(0, -1));
      }
    } finally {
      setStreaming(false);
      setTimeout(refreshList, 800);
    }
  };

  return (
    <div className="app">
      <Sidebar conversations={conversations} activeId={activeId}
        onSelect={selectConversation} onNew={newChat} onDelete={deleteChat} />
      <ChatView exchanges={exchanges} tones={tones} tone={tone} setTone={setTone}
        streaming={streaming} onSend={send} onStop={() => abortRef.current?.abort()} error={error} />
    </div>
  );
}