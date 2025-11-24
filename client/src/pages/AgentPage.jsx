import React, { useEffect, useState } from "react";
import { api } from "../api";
import "./AgentPage.css";

export default function AgentPage() {
  const [inbox, setInbox] = useState([]);
  const [email, setEmail] = useState(null);
  const [query, setQuery] = useState("");
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savedResults, setSavedResults] = useState([]);
  const [activeView, setActiveView] = useState("chat"); // "chat" or "saved"
  const [searchTerm, setSearchTerm] = useState("");
  const [dialog, setDialog] = useState(null);

  const filteredSavedResults = savedResults.filter(result =>
    result.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.query.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const showDialog = (type, title, message) => {
    setDialog({ type, title, message });
  };

  const closeDialog = () => {
    setDialog(null);
  };

  useEffect(() => {
    loadInbox();
    loadSavedResults();
  }, []);

  async function loadInbox() {
    try {
      const data = await api.loadInbox();
      setInbox(data);
      if (data.length && !email) setEmail(data[0]);
    } catch (e) {
      showDialog("error", "Load Failed", "Failed to load inbox: " + e.message);
    }
  }

  async function loadSavedResults() {
    try {
      const data = await api.loadDrafts();
      setSavedResults(data.filter(draft => draft.type === "agent_result"));
    } catch (e) {
      console.error("Failed to load saved results:", e);
    }
  }

  async function askAgent() {
    if (!email || !query.trim()) {
      showDialog("warning", "Input Required", "Pick email and write a question.");
      return;
    }

    const userMessage = { type: "user", content: query, timestamp: new Date() };
    setConversation(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const resp = await api.agentQuery({ email, userQuery: query });
      const agentMessage = {
        type: "agent",
        content: resp.result,
        timestamp: new Date(),
        id: Date.now(),
        emailId: email.id,
        query: query
      };
      setConversation(prev => [...prev, agentMessage]);
      setQuery("");
    } catch (err) {
      const errorMessage = { type: "error", content: "Agent error: " + err.message, timestamp: new Date() };
      setConversation(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }

  async function saveResult(message) {
    try {
      const savedResult = {
        id: Date.now(),
        type: "agent_result",
        title: `Analysis: ${email.subject}`,
        content: message.content,
        query: message.query,
        emailSubject: email.subject,
        emailSender: email.sender,
        timestamp: new Date().toISOString(),
        originalEmailId: email.id
      };

      await api.saveDraft(savedResult);
      setSavedResults(prev => [savedResult, ...prev]);
      showDialog("success", "Saved", "Result saved successfully!");
    } catch (err) {
      showDialog("error", "Save Failed", "Failed to save result: " + err.message);
    }
  }

  async function deleteSavedResult(id) {
    try {
      await api.deleteDraft(id);
      setSavedResults(prev => prev.filter(result => result.id !== id));
      showDialog("success", "Deleted", "Result deleted!");
    } catch (err) {
      showDialog("error", "Delete Failed", "Failed to delete result: " + err.message);
    }
  }

  const [editingResult, setEditingResult] = useState(null);
  const [editContent, setEditContent] = useState("");

  async function startNewConversation() {
    setConversation([]);
    setQuery("");
    showDialog("success", "New Conversation", "Started new conversation!");
  }

  async function editSavedResult(result) {
    setEditingResult(result);
    setEditContent(result.content);
    setActiveView("chat"); // Switch to chat view for editing
  }

  async function saveEditedResult() {
    if (!editingResult) return;

    try {
      const updatedResult = {
        ...editingResult,
        content: editContent,
        timestamp: new Date().toISOString()
      };

      // Update the result in savedResults
      setSavedResults(prev => prev.map(r => r.id === editingResult.id ? updatedResult : r));

      // Also update in the backend
      await api.deleteDraft(editingResult.id);
      await api.saveDraft(updatedResult);

      setEditingResult(null);
      setEditContent("");
      showDialog("success", "Updated", "Draft updated successfully!");
    } catch (err) {
      showDialog("error", "Update Failed", "Failed to update draft: " + err.message);
    }
  }

  async function cancelEdit() {
    setEditingResult(null);
    setEditContent("");
  }

  return (
    <div className="agent-page-container">
      {/* Left Sidebar - Emails */}
      <div className="agent-sidebar">
        <div className="agent-card">
          <div className="agent-header">
            <h2 className="agent-title">📧 Emails</h2>
            <button onClick={loadInbox} className="reload-btn">
              🔄 Reload
            </button>
          </div>
          <div className="agent-emails-list">
            {inbox.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <h3>No Emails</h3>
                <p>Your inbox is empty. Add some emails to get started.</p>
              </div>
            ) : (
              <ul className="agent-emails-ul">
                {inbox.map(e => (
                  <li
                    key={e.id}
                    className={`email-list-item ${email?.id === e.id ? "active" : ""}`}
                    onClick={() => setEmail(e)}
                  >
                    <div className="email-list-subject">{e.subject}</div>
                    <div className="email-list-sender">{e.sender}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="agent-main">
        <div className="agent-card">
          {/* Main Header with Tabs */}
          <div className="agent-header">
            <div className="agent-tabs">
              <button
                className={`agent-tab ${activeView === "chat" ? "active" : ""}`}
                onClick={() => setActiveView("chat")}
              >
                🤖 Agent Chat
              </button>
              <button
                className={`agent-tab ${activeView === "saved" ? "active" : ""}`}
                onClick={() => setActiveView("saved")}
              >
                💾 Saved Results ({savedResults.length})
              </button>
            </div>
          </div>

          {activeView === "chat" ? (
            /* Chat View */
            email ? (
              <div className="agent-chat-area">
                {editingResult ? (
                  /* Edit Mode */
                  <div className="agent-edit-area">
                    <div className="agent-edit-header">
                      <h3 className="agent-edit-title">✏️ Edit Draft Reply</h3>
                      <div className="agent-edit-actions">
                        <button onClick={cancelEdit} className="cancel-edit-btn">
                          ❌ Cancel
                        </button>
                        <button onClick={saveEditedResult} className="save-edit-btn">
                          💾 Save Changes
                        </button>
                      </div>
                    </div>
                    <div className="agent-edit-content">
                      <div className="edit-info">
                        <strong>Original Query:</strong> {editingResult.query}
                      </div>
                      <div className="edit-info">
                        <strong>Email:</strong> {editingResult.emailSubject}
                      </div>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="agent-edit-textarea"
                        placeholder="Edit your draft reply..."
                        rows="15"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="agent-context-section">
                      <div className="agent-context-card">
                        <div className="agent-context-header">
                          <h4 className="agent-context-title">📄 Context Email</h4>
                          <button
                            onClick={startNewConversation}
                            className="new-conversation-btn"
                            title="Start new conversation"
                          >
                            🔄 New Conversation
                          </button>
                        </div>
                        <div className="agent-context-content">
                          <strong>{email.subject}</strong>
                          <div className="text-text-muted mt-xs">{email.sender} • {email.timestamp}</div>
                          <div className="agent-context-preview">{email.body.substring(0, 200)}...</div>
                        </div>
                      </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="agent-messages-container">
                      {conversation.length === 0 ? (
                        <div className="agent-empty-chat">
                          <h3 className="agent-empty-title">Start a Conversation</h3>
                          <p className="agent-empty-text">Ask the agent about this email. Try questions like:</p>
                          <ul className="agent-suggestions">
                            <li>• "Summarize this email"</li>
                            <li>• "What action items are there?"</li>
                            <li>• "Draft a reply"</li>
                          </ul>
                        </div>
                      ) : (
                        <div className="space-y-md">
                          {conversation.map((msg, index) => (
                            <div key={index} className="agent-message-group">
                              <div className={`agent-message-bubble ${msg.type}`}>
                                <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                                <div className="agent-message-timestamp">
                                  {msg.timestamp.toLocaleTimeString()}
                                </div>
                                {msg.type === "agent" && (
                                  <div className="agent-message-actions">
                                    <button
                                      onClick={() => saveResult(msg)}
                                      className="save-result-btn"
                                      title="Save this result"
                                    >
                                      💾 Save
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Input Section */}
                    <div className="agent-input-section">
                      <div className="agent-input-container">
                        <textarea
                          placeholder="Ask the agent (e.g., Summarize this, What tasks?, Draft reply in friendly tone)"
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              askAgent();
                            }
                          }}
                          className="agent-input"
                          rows="2"
                        />
                        <button
                          onClick={askAgent}
                          disabled={loading || !query.trim()}
                          className="agent-send-btn"
                        >
                          {loading ? "Sending..." : "Send"}
                        </button>
                      </div>
                      <div className="agent-input-help">
                        Press Enter to send, Shift+Enter for new line
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="agent-empty-chat">
                <div className="agent-empty-icon">📭</div>
                <h3 className="agent-empty-title">No Email Selected</h3>
                <p className="agent-empty-text">Select an email from the left to start chatting with the AI agent.</p>
              </div>
            )
          ) : (
            /* Saved Results View */
            <div className="agent-saved-area">
              {/* Search Bar */}
              <div className="agent-search-section">
                <div className="agent-search-container">
                  <input
                    type="text"
                    placeholder="Search saved results..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="agent-search-input"
                  />
                  <div className="search-icon">🔍</div>
                </div>
              </div>

              {/* Saved Results List */}
              <div className="agent-saved-list">
                {filteredSavedResults.length === 0 ? (
                  <div className="agent-empty-saved">
                    <div className="empty-icon">📄</div>
                    <h3>No Saved Results</h3>
                    <p>Save agent responses to access them later. Click the 💾 Save button on any agent response.</p>
                  </div>
                ) : (
                  <div className="saved-results-grid">
                    {filteredSavedResults.map(result => (
                      <div key={result.id} className="saved-result-card">
                        <div className="saved-result-header">
                          <h4 className="saved-result-title">{result.title}</h4>
                          <div className="saved-result-meta">
                            <span className="saved-result-date">
                              {new Date(result.timestamp).toLocaleDateString()}
                            </span>
                            <div className="saved-result-actions">
                              <button
                                onClick={() => editSavedResult(result)}
                                className="edit-result-btn"
                                title="Edit this result"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => deleteSavedResult(result.id)}
                                className="delete-result-btn"
                                title="Delete this result"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="saved-result-content">
                          <div className="saved-result-query">
                            <strong>Query:</strong> {result.query}
                          </div>
                          <div className="saved-result-response">
                            <pre>{result.content}</pre>
                          </div>
                        </div>
                        <div className="saved-result-footer">
                          <span className="saved-result-email">
                            From: {result.emailSubject}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

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