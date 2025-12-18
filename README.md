# Prompt-Driven Email Agent

A prompt-driven email assistant that uses a Large Language Model (LLM) to understand natural-language instructions and generate, refine, and manage email content conversationally.

---

## Live Deployments

- **Frontend (Vercel):** https://email-agent-beige.vercel.app/  
- **Backend (Render):** configure `VITE_API_BASE` to point to your Render backend URL, e.g.  
  `VITE_API_BASE=https://your-backend.onrender.com`

The deployed frontend already uses the hosted backend when `VITE_API_BASE` is set accordingly.

---

## Features

- View a mock inbox and inspect full email content.
- Summarize long emails to concise bullet points.
- Categorize emails (e.g., sales, support, internal, notification).
- Extract action items and deadlines from email bodies.
- Draft context-aware replies in different tones.
- Ask follow-up questions in a conversation for the same email.
- Edit “Prompt Brain” templates that control how the LLM behaves.

---

## Tech Stack

### Frontend (client)

- **Hosting:** Vercel
- **Framework:** React (SPA)
- **Bundler / Dev server:** Vite
- **Language:** JavaScript (ES modules)
- **HTTP client:** `fetch` via a small API wrapper
- **Routing / Pages:** Agent, Inbox, Prompts views

### Backend (server)

- **Hosting:** Render
- **Runtime:** Node.js
- **Framework:** Express
- **Data storage:** MongoDB (inbox, drafts, prompts, conversations)
- **API responsibilities:**
  - Inbox / email retrieval
  - Drafts and conversations
  - Prompt templates CRUD
  - LLM interaction endpoint

### LLM / AI (Conversation Engine)

- **Provider:** Google Generative AI (Gemini)
- **Node client:** `@google/generative-ai`
- **Model (LLM) used in code for conversation:** configured in a server utility (e.g. `gemini-1.5-pro` or similar).
- Used for:
  - Summarization, categorization, and action item extraction
  - Drafting replies and rewriting in different tones
  - Maintaining conversational context within a thread

---

## Project Structure

```text
e:\Projects\Prompt-Driven Email Agent
├─ client/                 # Frontend (Vite + React SPA)
│  ├─ public/              # Static assets
│  ├─ src/
│  │  ├─ components/       # Reusable UI components
│  │  ├─ pages/            # Agent, Inbox, Prompts views
│  │  ├─ api/              # Small API wrapper around fetch
│  │  ├─ hooks/            # Custom React hooks (if any)
│  │  ├─ styles/           # Global / shared styles
│  │  └─ main.jsx          # App entry
│  ├─ index.html
│  ├─ vite.config.*        # Vite config
│  └─ package.json
│
├─ server/                 # Backend (Node + Express)
│  ├─ data/                # JSON data: inbox, drafts, prompts, conversations
│  ├─ routes/              # Express route definitions
│  ├─ services/            # LLM / business logic helpers
│  ├─ utils/               # Utility modules (e.g. Gemini client config)
│  ├─ server.js            # Express app entry
│  └─ package.json
│
├─ README.md
└─ .gitignore
```

---

## Getting Started (Local)

```bash
# backend
cd server
npm install
npm run dev   # or: node server.js

# frontend
cd client
npm install
npm run dev
```

Then open:

- https://email-agent-beige.vercel.app/agent  
- https://email-agent-beige.vercel.app/inbox  
- https://email-agent-beige.vercel.app/prompts  

---

## Environment & Configuration

### Server (`server/.env`)

```text
GEMINI_API_KEY=your-google-gemini-api-key
```

### Client (`client/.env`)

For local dev:

```text
VITE_API_BASE=http://localhost:5000
```

For production / Render backend:

```text
VITE_API_BASE=https://your-backend.onrender.com
```

---

## Usage

- Select an email in the Agent or Inbox view.
- Ask the agent to summarize, categorize, extract actions, or draft a reply.
- Adjust prompt templates on the Prompts page to tune behavior.
- Conversations for each email are stored so you can ask follow-up questions.
