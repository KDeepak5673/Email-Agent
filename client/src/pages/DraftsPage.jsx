import React, { useEffect, useState } from "react";
import { api } from "../api";
import "./DraftsPage.css";

export default function DraftsPage() {
  const [drafts, setDrafts] = useState([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [editingDraft, setEditingDraft] = useState(null);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");

  const showDialog = (type, title, message) => {
    setDialog({ type, title, message });
  };

  const closeDialog = () => {
    setDialog(null);
  };

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const d = await api.loadDrafts();
      // Filter to only show manual email drafts (not agent results or conversations)
      const manualDrafts = d.filter(draft => !draft.type || draft.type === undefined);
      setDrafts(manualDrafts);
    } catch (e) {
      showDialog("error", "Load Failed", "Failed to load drafts: " + e.message);
    }
  }

  async function save() {
    if (!subject.trim() || !body.trim()) {
      showDialog("warning", "Input Required", "Please fill in both subject and body.");
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
      showDialog("success", "Saved", "Draft saved successfully!");
    } catch (e) {
      showDialog("error", "Save Failed", "Save failed: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function startEdit(draft) {
    setEditingDraft(draft);
    setEditSubject(draft.subject);
    setEditBody(draft.body);
  }

  async function saveEdit() {
    if (!editingDraft) return;

    if (!editSubject.trim() || !editBody.trim()) {
      showDialog("warning", "Input Required", "Please fill in both subject and body.");
      return;
    }

    try {
      const updatedDraft = {
        ...editingDraft,
        subject: editSubject.trim(),
        body: editBody.trim(),
        created: new Date().toISOString()
      };

      await api.deleteDraft(editingDraft.id);
      await api.saveDraft(updatedDraft);

      setEditingDraft(null);
      setEditSubject("");
      setEditBody("");
      load();
      showDialog("success", "Updated", "Draft updated successfully!");
    } catch (e) {
      showDialog("error", "Update Failed", "Failed to update draft: " + e.message);
    }
  }

  async function cancelEdit() {
    setEditingDraft(null);
    setEditSubject("");
    setEditBody("");
  }

  async function deleteDraft(id) {
    try {
      await api.deleteDraft(id);
      load();
      showDialog("success", "Deleted", "Draft deleted successfully!");
    } catch (e) {
      showDialog("error", "Delete Failed", "Failed to delete draft: " + e.message);
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
                      <div className="draft-actions">
                        {!(typeof d.body === 'string' && d.body.startsWith('{') && d.body.includes('"subject"') && d.body.includes('"body"')) && (
                          <button
                            onClick={() => startEdit(d)}
                            className="edit-draft-btn"
                            title="Edit this draft"
                          >
                            ✏️ Edit
                          </button>
                        )}
                        <button
                          onClick={() => deleteDraft(d.id)}
                          className="delete-draft-btn"
                          title="Delete this draft"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                      <span className="draft-timestamp">
                        {new Date(d.created || d.timestamp).toLocaleDateString()} {new Date(d.created || d.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="draft-preview">
                      {typeof d.body === 'string' && d.body.startsWith('{') && d.body.includes('"subject"') && d.body.includes('"body"')
                        ? 'This draft contains structured data and cannot be displayed here.'
                        : d.body.substring(0, 200) + (d.body.length > 200 ? '...' : '')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Draft Modal */}
      {editingDraft && (
        <div className="edit-modal-overlay" onClick={cancelEdit}>
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="edit-modal-header">
              <h3 className="edit-modal-title">✏️ Edit Draft</h3>
              <button onClick={cancelEdit} className="edit-modal-close">×</button>
            </div>
            <div className="edit-modal-content">
              <div className="mb-md">
                <label className="block text-sm font-medium mb-sm">Subject</label>
                <input
                  type="text"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  className="w-full"
                  placeholder="Enter email subject..."
                />
              </div>
              <div className="mb-md">
                <label className="block text-sm font-medium mb-sm">Message</label>
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  rows="8"
                  className="w-full"
                  placeholder="Write your email message here..."
                />
              </div>
            </div>
            <div className="edit-modal-actions">
              <button onClick={cancelEdit} className="cancel-edit-btn">Cancel</button>
              <button onClick={saveEdit} className="save-edit-btn">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog Component */}
      {dialog && (
        <div className="dialog-overlay" onClick={closeDialog}>
          <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <div className={`dialog-icon ${dialog.type}`}>
                {dialog.type === "success" && "✅"}
                {dialog.type === "error" && "❌"}
                {dialog.type === "warning" && "⚠️"}
                {dialog.type === "info" && "ℹ️"}
              </div>
              <h3 className="dialog-title">{dialog.title}</h3>
              <button onClick={closeDialog} className="dialog-close-btn">×</button>
            </div>
            <div className="dialog-content">
              <p>{dialog.message}</p>
            </div>
            <div className="dialog-actions">
              <button onClick={closeDialog} className="dialog-ok-btn">OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
