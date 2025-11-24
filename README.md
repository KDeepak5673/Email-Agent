# Prompt-Driven Email Agent

A lightweight email assistant web app that demonstrates an AI-driven agent for reading, summarizing, and drafting replies to emails. .

---

## Table of Contents

- [How to run the backend and UI](#how-to-run-the-backend-and-ui)
- [How to load the Mock Inbox (quick)](#how-to-load-the-mock-inbox-quick)
- [Prompt Brain (Prompts page)](#prompt-brain-prompts-page)
- [Usage examples](#usage-examples)
- [Tech used](#tech-used)
- [Environment & API keys (dotenv)](#environment--api-keys-dotenv)


## How to run the backend and UI
Start backend (Express) — default port 5000:

```powershell
cd "e:\Projects\Prompt-Driven Email Agent\server"
node server.js
```

Start frontend (Vite dev server) — default port 5173:

```powershell
cd "e:\Projects\Prompt-Driven Email Agent\client"
npm run dev
```

Open the UI in your browser:
- Agent: http://localhost:5173/agent
- Inbox: http://localhost:5173/inbox
- Prompts: http://localhost:5173/prompts


---

## How to load the Mock Inbox (quick)
- Edit `server/data/inbox.json` and add or modify email objects (fields: `id`, `sender`, `subject`, `body`, `timestamp` as ISO string).
- Restart `server.js` (or allow your dev server to pick up changes) and click `🔄 Reload` on the Inbox page (`/inbox`) or the Agent page sidebar to fetch fresh inbox data.

---

## Prompt Brain (Prompts page)
The Prompts page (`/prompts`) shows editable templates the AI uses for:
- Email Categorization
- Action Item Extraction
- Auto-Reply Drafting

Edit the textarea for a prompt and click `💾 Save Prompts` to persist changes. Use `🔄 Reload` to pull saved templates from the backend.

Placeholders you can use: `{{email_body}}`, `{{email_subject}}` — the client fills these when invoking the agent.

---

## Usage examples
- Summarize an email: `/agent` → select email → type `Summarize this email` → Send
- Extract action items: `What action items are in this email?`
- Draft reply: `Draft a reply in a friendly tone` → Save to Drafts if desired

---

## Tech used

- **Frontend:** React, Vite, modern JavaScript (ESM), CSS
- **Backend:** Node.js, Express
- **LLM / AI:** Google Generative AI (Gemini) via `@google/generative-ai` client (configurable; can be swapped for OpenAI)
- **HTTP:** native Fetch API (wrapped in `client/src/api.js`)
- **Data:** JSON files under `server/data` used as a simple local datastore for `inbox`, `drafts`, `prompts`, and `conversations`
- **Dev tooling:** npm, Vite dev server

Files of interest:
- Frontend entry: `client/src/main.jsx`
- Main pages: `client/src/pages/AgentPage.jsx`, `client/src/pages/InboxPage.jsx`, `client/src/pages/PromptsPage.jsx`
- Reusable components: `client/src/components/Dialog.jsx`
- Backend server: `server/server.js`
- LLM wrapper: `server/utils/llm.js`


## Environment & API keys (dotenv)
This project uses simple `.env` configuration for local development. The server's LLM helper (`server/utils/llm.js`) reads `process.env.GEMINI_API_KEY` via `dotenv`. The client reads `import.meta.env.VITE_API_BASE` for the API base URL.


Server (`server/.env`)
- Create `server/.env` with:

```text
# Google Generative AI (Gemini) key used by `server/utils/llm.js`
GEMINI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx


How to get a Gemini (Google) API key:
1. Create a Google Cloud project and enable the Generative AI API (or the provider you prefer).
2. Create an API key or service account credentials and copy the key string.
3. Place the key in `server/.env` as `GEMINI_API_KEY`.
```

Client (`client/.env`)
- The client only needs the API base URL. Create `client/.env` with:

```text
VITE_API_BASE=http://localhost:5000
```
