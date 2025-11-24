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

export const api = {
  loadInbox: () => getJSON("/inbox"),
  loadPrompts: () => getJSON("/prompts"),
  savePrompts: (prompts) => postJSON("/prompts", prompts),
  agentQuery: (payload) => postJSON("/agent", payload),
  loadDrafts: () => getJSON("/drafts"),
  saveDraft: (draft) => postJSON("/drafts", draft),
  deleteDraft: (id) => {
    return fetch(`${API_BASE}/drafts/${id}`, {
      method: "DELETE",
    }).then(res => {
      if (!res.ok) throw new Error("Failed to delete draft");
      return res.json();
    });
  },
};
