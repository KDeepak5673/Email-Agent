const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

async function getJSON(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function postJSON(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function deleteJSON(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const api = {
  loadInbox: () => getJSON("/inbox"),
  loadPrompts: () => getJSON("/prompts"),
  savePrompts: (prompts) => postJSON("/prompts", prompts),
  agentQuery: (payload) => postJSON("/agent", payload),
  inboxAgentQuery: (payload) => postJSON("/inbox-agent", payload),
  loadDrafts: () => getJSON("/drafts"),
  saveDraft: (draft) => postJSON("/drafts", draft),
  deleteDraft: (id) => deleteJSON(`/drafts/${id}`),
  loadAgentResults: () => getJSON("/agent-results"),
  saveAgentResult: (result) => postJSON("/agent-results", result),
  deleteAgentResult: (id) => deleteJSON(`/agent-results/${id}`),
  loadConversations: () => getJSON("/conversations"),
  saveConversation: (conversation) => postJSON("/conversations", conversation),
  deleteConversation: (id) => deleteJSON(`/conversations/${id}`),
};
