import React, { useEffect, useState } from "react";
import { api } from "../api";
import "./DraftsPage.css";

export default function DraftsPage() {
  const [drafts, setDrafts] = useState([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const d = await api.loadDrafts();
      setDrafts(d);
    } catch (e) {
      alert("Failed to load drafts: " + e.message);
    }
  }

  async function save() {
    if (!subject.trim() || !body.trim()) {
      alert("Please fill in both subject and body.");
      return;
    }

    setSaving(true);
    try {
      const data = {
        id: Date.now().toString(),
        subject: subject.trim(),
        body: body.trim(),
        created: new Date().toISOString()
      };
      await api.saveDraft(data);
      setSubject("");
      setBody("");
      load();
      alert("✅ Draft saved successfully!");
    } catch (e) {
      alert("❌ Save failed: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="drafts-page-container">
      <div className="drafts-header">
        <h1 className="drafts-title">📝 Email Drafts</h1>
        <p className="drafts-subtitle">
          Create and manage email drafts. These are stored locally and never sent automatically.
        </p>
      </div>

      <div className="drafts-stats">
        <div className="drafts-stat-card">
          <div className="drafts-stat-number">{drafts.length}</div>
          <div className="drafts-stat-label">Total Drafts</div>
        </div>
        <div className="drafts-stat-card">
          <div className="drafts-stat-number">
            {drafts.filter(d => {
              const today = new Date();
              const draftDate = new Date(d.created);
              return draftDate.toDateString() === today.toDateString();
            }).length}
          </div>
          <div className="drafts-stat-label">Created Today</div>
        </div>
        <div className="drafts-stat-card">
          <div className="drafts-stat-number">
            {drafts.length > 0 ? Math.round(drafts.reduce((sum, d) => sum + d.body.length, 0) / drafts.length) : 0}
          </div>
          <div className="drafts-stat-label">Avg Length</div>
        </div>
      </div>

      <div className="drafts-content">
        {/* New Draft Form */}
        <div className="drafts-list-section">
          <div className="drafts-list-header">
            <h3 className="drafts-list-title">✍️ Compose New Draft</h3>
          </div>
          <div className="drafts-list-container">
            <div style={{ padding: 'var(--space-lg)' }}>
              <div className="mb-md">
                <label className="block text-sm font-medium mb-sm">Subject</label>
                <input
                  type="text"
                  placeholder="Enter email subject..."
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="mb-md">
                <label className="block text-sm font-medium mb-sm">Message</label>
                <textarea
                  placeholder="Write your email message here..."
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  rows="6"
                  className="w-full"
                />
              </div>

              <div className="flex justify-end gap-sm">
                <button onClick={load} className="bg-bg-accent text-text-primary hover:bg-bg-hover">
                  🔄 Reload
                </button>
                <button onClick={save} disabled={saving || !subject.trim() || !body.trim()}>
                  {saving ? "⏳ Saving..." : "💾 Save Draft"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Saved Drafts */}
        <div className="drafts-detail-section">
          <div className="drafts-detail-header">
            <h3 className="drafts-detail-title">📚 Saved Drafts ({drafts.length})</h3>
          </div>
          <div className="drafts-detail-content">
            {drafts.length === 0 ? (
              <div className="drafts-empty">
                <div className="drafts-empty-icon">📭</div>
                <h4 className="drafts-empty-title">No Drafts Yet</h4>
                <p className="drafts-empty-text">Create your first draft using the form above!</p>
              </div>
            ) : (
              <div className="space-y-md">
                {drafts.map(d => (
                  <div key={d.id} className="draft-item">
                    <div className="draft-item-header">
                      <h4 className="draft-subject">{d.subject}</h4>
                      <span className="draft-timestamp">
                        {new Date(d.created).toLocaleDateString()} {new Date(d.created).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="draft-preview">{d.body}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
