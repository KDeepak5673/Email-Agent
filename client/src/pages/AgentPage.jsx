import React, { useEffect, useState, useRef } from "react";
import { api } from "../api";
import "./AgentPage.css";

export default function AgentPage() {

  const [inbox, setInbox] = useState([]);
  const [email, setEmail] = useState(null);
  const [query, setQuery] = useState("");
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeView, setActiveView] = useState("chat"); // "chat", "conversations", or "inbox-agent"
  const [searchTerm, setSearchTerm] = useState("");
  const [dialog, setDialog] = useState(null);
  const [emailConversations, setEmailConversations] = useState({}); // Track conversations per email
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const messagesRef = useRef(null);

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.messages.some(msg => msg.content.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const showDialog = (type, title, message) => {
    setDialog({ type, title, message });
  };

  const closeDialog = () => {
    setDialog(null);
  };

  useEffect(() => {
    loadInbox();
    loadConversations();
  }, []);

  // Auto-select first email after both inbox and conversations are loaded
  useEffect(() => {
    if (inbox.length > 0 && conversations.length >= 0 && !email) {
      selectEmail(inbox[0]);
    }
  }, [inbox, conversations, email]);

  async function loadInbox() {
    try {
      const data = await api.loadInbox();
      setInbox(data);
    } catch (e) {
      showDialog("error", "Load Failed", "Failed to load inbox: " + e.message);
    }
  }

  // Normalize message timestamps: ensure each message.timestamp is a Date
  function normalizeMessageTimestamps(messages = []) {
    // Convert timestamp fields to Date and sort ascending (oldest first)
    const normalized = messages.map(m => ({ ...m, timestamp: m.timestamp ? new Date(m.timestamp) : new Date() }));
    normalized.sort((a, b) => {
      const ta = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
      const tb = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
      return ta - tb;
    });
    return normalized;
  }

  // Format timestamps safely (accepts Date or string)
  function formatTime(ts) {
    const d = ts instanceof Date ? ts : new Date(ts);
    return isNaN(d) ? "" : d.toLocaleTimeString();
  }

  async function loadConversations() {
    try {
      const data = await api.loadConversations();
      // Normalize timestamps inside each conversation's messages
      const normalized = (data || []).map(conv => ({
        ...conv,
        messages: normalizeMessageTimestamps(conv.messages || [])
      }));
      // Sort conversations by timestamp (newest first)
      normalized.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
      setConversations(normalized);
    } catch (e) {
      showDialog("error", "Load Failed", "Failed to load conversations: " + e.message);
    }
  }

  // Scroll messages container to bottom whenever conversation updates
  useEffect(() => {
    if (messagesRef.current) {
      // slight delay to let DOM render
      setTimeout(() => {
        messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
      }, 50);
    }
  }, [conversation, activeView]);

  async function selectEmail(selectedEmail) {
    setEmail(selectedEmail);

    // Check if there's an existing conversation for this email
    const existingConversation = conversations.find(conv =>
      conv.emailId === selectedEmail.id && conv.type === "conversation"
    );

    if (existingConversation) {
      setConversation(normalizeMessageTimestamps(existingConversation.messages));
      setCurrentConversationId(existingConversation.id);
    } else {
      // Start fresh conversation for this email
      setConversation([]);
      setCurrentConversationId(null);
    }
  }

  async function askAgent() {
    if (!email || !query.trim()) {
      showDialog("warning", "Input Required", "Pick email and write a question.");
      return;
    }

    const userMessage = { type: "user", content: query, timestamp: new Date() };
    const newConversation = [...conversation, userMessage];
    setConversation(newConversation);
    setLoading(true);

    try {
      const resp = await api.agentQuery({ email, userQuery: query });
      const agentMessage = {
        type: "agent",
        content: resp.result,
        timestamp: new Date(),
        query: query
      };
      const finalConversation = [...newConversation, agentMessage];
      setConversation(finalConversation);
      setQuery("");

      // Auto-save the conversation
      await saveConversation(finalConversation, email);
    } catch (err) {
      const errorMessage = { type: "error", content: "Agent error: " + err.message, timestamp: new Date() };
      const finalConversation = [...newConversation, errorMessage];
      setConversation(finalConversation);
    } finally {
      setLoading(false);
    }
  }

  async function saveConversation(messages, emailContext) {
    try {
      const conversationData = {
        id: currentConversationId || undefined,
        type: "conversation",
        title: `Chat: ${emailContext.subject}`,
        messages: messages,
        emailSubject: emailContext.subject,
        emailSender: emailContext.sender,
        timestamp: new Date().toISOString(),
        emailId: emailContext.id
      };
      // Send conversation to server; server will insert or update and return the saved document
      const resp = await api.saveConversation(conversationData);
      const savedConv = (resp && resp.conversation) ? resp.conversation : null;
      const returnedId = (savedConv && savedConv.id) ? savedConv.id : (conversationData.id || currentConversationId);
      setCurrentConversationId(returnedId);

      // Use server-returned conversation (if provided) to update local state, normalize timestamps and sort messages
      const convToShow = savedConv ? {
        ...savedConv,
        messages: normalizeMessageTimestamps(savedConv.messages || [])
      } : { ...conversationData, id: returnedId, messages: normalizeMessageTimestamps(conversationData.messages || []) };

      setConversations(prev => {
        const filtered = prev.filter(conv => conv.id !== returnedId);
        return [convToShow, ...filtered];
      });
    } catch (err) {
      console.error("Failed to save conversation:", err);
    }
  }

  async function startNewConversation() {
    if (!email) return;

    setConversation([]);
    setCurrentConversationId(null);
    showDialog("success", "New Conversation", `Started new conversation for "${email.subject}"`);
  }

  async function loadConversation(conv) {
    setConversation(normalizeMessageTimestamps(conv.messages));
    setCurrentConversationId(conv.id);

    // Find and set the associated email
    const associatedEmail = inbox.find(e => e.id === conv.emailId);
    if (associatedEmail) {
      setEmail(associatedEmail);
    }

    setActiveView("chat");
  }

  async function deleteConversation(id) {
    try {
      await api.deleteConversation(id);
      setConversations(prev => prev.filter(conv => conv.id !== id));
      if (currentConversationId === id) {
        setConversation([]);
        setCurrentConversationId(null);
      }
      showDialog("success", "Deleted", "Conversation deleted!");
    } catch (err) {
      showDialog("error", "Delete Failed", "Failed to delete conversation: " + err.message);
    }
  }

  async function askInboxAgent() {
    if (!query.trim()) {
      showDialog("warning", "Input Required", "Please enter a question about your inbox.");
      return;
    }

    const userMessage = { type: "user", content: query, timestamp: new Date() };
    const newConversation = [...conversation, userMessage];
    setConversation(newConversation);
    setLoading(true);

    try {
      const resp = await api.inboxAgentQuery({ inbox, userQuery: query });
      const agentMessage = {
        type: "agent",
        content: resp.result,
        timestamp: new Date(),
        query: query
      };
      const finalConversation = [...newConversation, agentMessage];
      setConversation(finalConversation);
      setQuery("");

      // Auto-save the inbox conversation
      await saveInboxConversation(finalConversation);
    } catch (err) {
      const errorMessage = { type: "error", content: "Agent error: " + err.message, timestamp: new Date() };
      const finalConversation = [...newConversation, errorMessage];
      setConversation(finalConversation);
    } finally {
      setLoading(false);
    }
  }

  async function saveInboxConversation(messages) {
    try {
      const conversationData = {
        id: currentConversationId || Date.now(),
        type: "inbox_conversation",
        title: `Inbox Chat: ${messages[0]?.content.substring(0, 50)}...`,
        messages: messages,
        timestamp: new Date().toISOString()
      };

      if (currentConversationId) {
        await api.deleteConversation(currentConversationId);
      }

      await api.saveConversation(conversationData);
      setCurrentConversationId(conversationData.id);

      setConversations(prev => {
        const filtered = prev.filter(conv => conv.id !== conversationData.id);
        return [{ ...conversationData, messages: normalizeMessageTimestamps(conversationData.messages || []) }, ...filtered];
      });
    } catch (err) {
      console.error("Failed to save inbox conversation:", err);
    }
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
                    onClick={() => selectEmail(e)}
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
                🤖 Email Agent
              </button>
              <button
                className={`agent-tab ${activeView === "inbox-agent" ? "active" : ""}`}
                onClick={() => setActiveView("inbox-agent")}
              >
                📧 Inbox Agent
              </button>
              <button
                className={`agent-tab ${activeView === "conversations" ? "active" : ""}`}
                onClick={() => setActiveView("conversations")}
              >
                💬 Conversations ({conversations.length})
              </button>
            </div>
          </div>

          {activeView === "chat" ? (
            /* Chat View */
            email ? (
              <div className="agent-chat-area">
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
                      <div className="text-text-muted mt-xs">{email.sender} • {new Date(email.timestamp || email.created || Date.now()).toLocaleString()}</div>
                      <div className="agent-context-preview">{email.body.substring(0, 200)}...</div>
                    </div>
                  </div>
                </div>

                {/* Chat Messages */}
                <div ref={messagesRef} className="agent-messages-container">
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
                              {formatTime(msg.timestamp)}
                            </div>
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
              </div>
            ) : (
              <div className="agent-empty-chat">
                <div className="agent-empty-icon">📭</div>
                <h3 className="agent-empty-title">No Email Selected</h3>
                <p className="agent-empty-text">Select an email from the left to start chatting with the AI agent.</p>
              </div>
            )
          ) : activeView === "inbox-agent" ? (
            /* Inbox Agent View */
            <div className="agent-chat-area">
              <div className="agent-context-section">
                <div className="agent-context-card">
                  <div className="agent-context-header">
                    <h4 className="agent-context-title">📧 Inbox Overview</h4>
                    <button
                      onClick={startNewConversation}
                      className="new-conversation-btn"
                      title="Start new conversation"
                    >
                      🔄 New Conversation
                    </button>
                  </div>
                  <div className="agent-context-content">
                    <strong>{inbox.length} emails in inbox</strong>
                    <div className="text-text-muted mt-xs">Ask questions about your entire inbox</div>
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div ref={messagesRef} className="agent-messages-container">
                {conversation.length === 0 ? (
                  <div className="agent-empty-chat">
                    <h3 className="agent-empty-title">Ask About Your Inbox</h3>
                    <p className="agent-empty-text">Try questions like:</p>
                    <ul className="agent-suggestions">
                      <li>• "Show me all urgent emails"</li>
                      <li>• "Find emails from last week"</li>
                      <li>• "What meetings do I have today?"</li>
                      <li>• "Summarize unread emails"</li>
                    </ul>
                  </div>
                ) : (
                  <div className="space-y-md">
                    {conversation.map((msg, index) => (
                      <div key={index} className="agent-message-group">
                        <div className={`agent-message-bubble ${msg.type}`}>
                          <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                          <div className="agent-message-timestamp">
                            {formatTime(msg.timestamp)}
                          </div>
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
                    placeholder="Ask about your inbox (e.g., Show me urgent emails, Find emails from John)"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        askInboxAgent();
                      }
                    }}
                    className="agent-input"
                    rows="2"
                  />
                  <button
                    onClick={askInboxAgent}
                    disabled={loading || !query.trim()}
                    className="agent-send-btn"
                  >
                    {loading ? "Thinking..." : "Ask"}
                  </button>
                </div>
                <div className="agent-input-help">
                  Press Enter to send, Shift+Enter for new line
                </div>
              </div>
            </div>
          ) : (
            /* Conversations View */
            <div className="agent-saved-area">
              {/* Search Bar */}
              <div className="agent-search-section">
                <div className="agent-search-container">
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="agent-search-input"
                  />
                  <div className="search-icon">🔍</div>
                </div>
              </div>

              {/* Conversations List */}
              <div className="agent-saved-list">
                {filteredConversations.length === 0 ? (
                  <div className="agent-empty-saved">
                    <div className="empty-icon">💬</div>
                    <h3>No Conversations</h3>
                    <p>Start chatting with the agents to see your conversation history here.</p>
                  </div>
                ) : (
                  <div className="saved-results-grid">
                    {filteredConversations.map(conv => (
                      <div key={conv.id} className="saved-result-card">
                        <div className="saved-result-header">
                          <h4 className="saved-result-title">{conv.title}</h4>
                          <div className="saved-result-meta">
                            <span className="saved-result-date">
                              {new Date(conv.timestamp).toLocaleDateString()}
                            </span>
                            <div className="saved-result-actions">
                              <button
                                onClick={() => loadConversation(conv)}
                                className="edit-result-btn"
                                title="Load this conversation"
                              >
                                📂
                              </button>
                              <button
                                onClick={() => deleteConversation(conv.id)}
                                className="delete-result-btn"
                                title="Delete this conversation"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="saved-result-content">
                          <div className="saved-result-messages">
                            {conv.messages.slice(0, 2).map((msg, idx) => (
                              <div key={idx} className={`message-preview ${msg.type}`}>
                                <strong>{msg.type === 'user' ? 'You:' : 'Agent:'}</strong> {msg.content.substring(0, 100)}...
                              </div>
                            ))}
                            {conv.messages.length > 2 && (
                              <div className="message-preview more">
                                ... and {conv.messages.length - 2} more messages
                              </div>
                            )}
                          </div>
                        </div>
                        {conv.emailSubject && (
                          <div className="saved-result-footer">
                            <span className="saved-result-email">
                              📧 {conv.emailSubject}
                            </span>
                            {conv.emailSender && (
                              <span className="saved-result-sender">
                                from {conv.emailSender}
                              </span>
                            )}
                          </div>
                        )}
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