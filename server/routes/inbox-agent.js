const express = require("express");
const fs = require("fs");
const router = express.Router();
const { runLLM } = require("../utils/llm");

router.post("/", async (req, res) => {
    try {
        const { inbox, userQuery } = req.body;

        const systemPrompt = `
You are an intelligent Inbox Analysis Agent that can analyze an entire inbox of emails.

Your capabilities:
- Analyze patterns across all emails
- Find emails by sender, date, content, or category
- Summarize inbox contents
- Identify urgent or important emails
- Group emails by topics or senders
- Answer questions about email trends and statistics

Rules:
1. Always provide helpful, accurate responses based on the actual email data
2. If no emails match the criteria, clearly state that
3. Be concise but comprehensive
4. Use clear formatting for lists and summaries
5. Include relevant email details (subject, sender, date) when appropriate

Return clean, well-formatted text responses.`;

        const inboxSummary = inbox.map(email => ({
            id: email.id,
            subject: email.subject,
            sender: email.sender,
            timestamp: email.timestamp,
            body: email.body.substring(0, 200) + (email.body.length > 200 ? "..." : "")
        }));

        const userPrompt = `
INBOX SUMMARY (${inbox.length} emails):
${JSON.stringify(inboxSummary, null, 2)}

USER QUERY: ${userQuery}

Please analyze the inbox and provide a helpful response to the user's query.`;

        const aiResponse = await runLLM(systemPrompt, userPrompt);

        res.json({ result: aiResponse });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;