import React, { useEffect, useState } from "react";
import { api } from "../api";
import "./InboxPage.css";

export default function InboxPage() {
  const [inbox, setInbox] = useState([]);
  const [filteredInbox, setFilteredInbox] = useState([]);
  const [selected, setSelected] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    filterEmails();
  }, [inbox, filter]);

  async function load() {
    try {
      const data = await api.loadInbox();
      setInbox(data);
    } catch (e) {
      alert("Failed to load inbox: " + e.message);
    }
  }

  function filterEmails() {
    if (filter === "all") {
      setFilteredInbox(inbox);
    } else {
      setFilteredInbox(inbox.filter(email => {
        // Simple categorization based on sender/content
        const content = (email.subject + email.body).toLowerCase();
        switch (filter) {
          case "important":
            return content.includes("urgent") || content.includes("important") || email.sender.includes("boss");
          case "work":
            return !content.includes("newsletter") && !content.includes("amazon");
          case "personal":
            return email.sender.includes("mom") || email.sender.includes("family");
          default:
            return true;
        }
      }));
    }
  }

  async function processEmail(email) {
    setProcessing(true);
    try {
      // First, get categorization and action items
      const categorizationResp = await api.agentQuery({
        email,
        userQuery: "Categorize and extract action items (JSON).",
      });

      // Then, generate auto-reply
      const autoReplyResp = await api.agentQuery({
        email,
        userQuery: "Generate an auto-reply draft for this email.",
      });

      // Combine both results
      const combinedResult = `📊 CATEGORIZATION & ACTION ITEMS:\n${categorizationResp.result}\n\n🤖 AUTO-REPLY DRAFT:\n${autoReplyResp.result}`;

      setSelected({
        email,
        agentResult: combinedResult,
        categorizationResult: categorizationResp.result,
        autoReplyResult: autoReplyResp.result,
        isProcessed: true
      });
    } catch (err) {
      alert("Processing error: " + err.message);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <>
      <div className="page">
        <div className="left-col">
          <div className="card">
            <div className="inbox-header">
              <h2 className="inbox-title">📧 Inbox</h2>
              <button onClick={load} className="reload-btn">
                🔄 Reload
              </button>
            </div>

            {/* Filters Bar */}
            <div className="filters-bar">
              <div className="filter-buttons">
                {[
                  { key: "all", label: "All", count: inbox.length },
                  { key: "important", label: "Important", count: inbox.filter(e => e.subject.includes("Submit") || e.sender.includes("boss")).length },
                  { key: "work", label: "Work", count: inbox.filter(e => !e.sender.includes("mom") && !e.sender.includes("amazon")).length },
                  { key: "personal", label: "Personal", count: inbox.filter(e => e.sender.includes("mom")).length }
                ].map(f => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`filter-btn ${filter === f.key ? "active" : ""}`}
                  >
                    {f.label} ({f.count})
                  </button>
                ))}
              </div>
            </div>

            <div className="inbox-list-container">
              <ul className="inbox-list">
                {filteredInbox.map((m) => (
                  <li
                    key={m.id}
                    className={`email-item ${selected?.email?.id === m.id ? "active" : ""}`}
                    onClick={() => setSelected({ email: m })}
                  >
                    <div className="email-subject">{m.subject}</div>
                    <div className="email-meta">
                      <span>{m.sender}</span>
                      <span>{m.timestamp}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="right-col">
          {selected ? (
            <div className="email-details">
              <div className="email-header">
                <div className="email-title">
                  <h3>{selected.email.subject}</h3>
                  <div className="email-meta">
                    <span>{selected.email.sender}</span>
                    <span>{selected.email.timestamp}</span>
                  </div>
                </div>
              </div>

              <div className="email-body">{selected.email.body}</div>

              <div className="controls">
                <button onClick={() => processEmail(selected.email)} disabled={processing} className="process-btn">
                  {processing ? " Processing..." : " 🚀 Process & Generate Reply"}
                </button>
              </div>

              {selected.agentResult && (
                <div className="agent-result">
                  <h4>🚀 Processing Results</h4>
                  <pre>{selected.agentResult}</pre>
                  {selected.isProcessed && selected.autoReplyResult && (
                    <div className="auto-reply-actions">
                      <button
                        onClick={() => {
                          const draft = {
                            id: Date.now(),
                            subject: `Re: ${selected.email.subject}`,
                            body: selected.autoReplyResult,
                            timestamp: new Date().toISOString(),
                            originalEmailId: selected.email.id
                          };
                          api.saveDraft(draft).then(() => {
                            alert("✅ Auto-reply saved to drafts!");
                          }).catch(err => {
                            alert("❌ Failed to save draft: " + err.message);
                          });
                        }}
                        className="save-draft-btn"
                      >
                        💾 Save Auto-Reply to Drafts
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="card empty-state">
              <div className="empty-icon">📭</div>
              <h3>No Email Selected</h3>
              <p>Click on an email from the list to view its contents and process it with AI.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}