# AI Chat Assistant

Full-stack AI chat app: React (Vite) + Node/Express + MongoDB + OpenAI-compatible API (Groq).

## Features
- Scrollable chat with distinct user/AI bubbles
- Real-time streaming (Server-Sent Events) shown character-by-character
- History sidebar: conversations saved in MongoDB (new / open / delete)
- Tone Toggle: Professional / Casual / Concise, sent to the AI as a system instruction (server-side)
- **Extra 1 – AI auto-titles:** each new conversation gets a short AI-generated title
- **Extra 2 – Stop generation:** stops the AI mid-response; partial reply is saved

## Architecture
- server/src: routes → controllers (validation + business logic) → services/llm.js (AI API) → models (MongoDB)
- server/src/config/tones.js: tone presets → system prompt
- client/src: api.js (HTTP + stream reader), components/Sidebar, components/ChatView, App.jsx (state)

## Setup
1. `cd server && npm i`, create `.env`:
   AI_API_KEY, AI_BASE_URL=https://api.groq.com/openai/v1, MODEL, MONGODB_URI, PORT=5001
2. `npm run dev` (server on port 5001)
3. `cd client && npm i && npm run dev` (open localhost:5173)