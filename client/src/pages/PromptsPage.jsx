import React, { useEffect, useState } from "react";
import { api } from "../api";
import "./PromptsPage.css";

export default function PromptsPage() {
  const [prompts, setPrompts] = useState({
    categorization: "",
    action_item: "",
    auto_reply: ""
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const p = await api.loadPrompts();
      setPrompts(p);
    } catch (e) {
      alert("Failed to load prompts: " + e.message);
    }
  }

  async function save() {
    setSaving(true);
    try {
      await api.savePrompts(prompts);
      alert("✅ Prompts saved successfully!");
    } catch (e) {
      alert("❌ Save failed: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  const promptConfigs = [
    {
      key: "categorization",
      title: "📂 Email Categorization",
      placeholder: "Categorize emails into: Important, Work, Personal, Newsletter, Spam. Provide category and brief reason."
    },
    {
      key: "action_item",
      title: "✅ Action Item Extraction",
      placeholder: "Extract action items as JSON: [{'task': 'description', 'deadline': 'date', 'priority': 'high/medium/low'}]"
    },
    {
      key: "auto_reply",
      title: "💬 Auto-Reply Drafting",
      placeholder: "Draft appropriate replies based on email type. Return 'No reply required' if not needed."
    }
  ];

  return (
    <div className="prompts-page-container">
      <div className="prompts-header">
        <h1 className="prompts-title">🧠 Prompt Brain</h1>
        <p className="prompts-subtitle">
          Configure AI prompts for email processing and responses.
        </p>
      </div>

      <div className="prompts-grid">
        {promptConfigs.map(config => (
          <div key={config.key} className="prompt-card">
            <div className="prompt-card-header">
              <h3 className="prompt-card-title">{config.title}</h3>
            </div>
            <div className="prompt-card-content">
              <form className="prompt-form">
                <div className="prompt-field">
                  <textarea
                    value={prompts[config.key]}
                    onChange={(e) => setPrompts({ ...prompts, [config.key]: e.target.value })}
                    placeholder={config.placeholder}
                    className="prompt-textarea"
                  />
                </div>
              </form>
            </div>
          </div>
        ))}
      </div>

      <div className="prompt-card">
        <div className="prompt-card-content">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold mb-sm">💾 Save Configuration</h3>
              <p className="text-sm text-text-muted">
                Save your prompt changes to apply them to all future AI interactions.
              </p>
            </div>

            <div className="prompt-actions">
              <button onClick={load} className="prompt-btn prompt-btn-secondary">
                🔄 Reload
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="prompt-btn prompt-btn-primary"
              >
                {saving ? "⏳ Saving..." : "💾 Save Prompts"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
