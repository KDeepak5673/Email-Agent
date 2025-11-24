const express = require("express");
const fs = require("fs");
const router = express.Router();
const { runLLM } = require("../utils/llm");

router.post("/", async (req, res) => {
  try {
    const { email, userQuery } = req.body;

    const prompts = JSON.parse(fs.readFileSync("./data/prompts.json"));

    const systemPrompt = `
You are an intelligent Email Productivity Agent.
ALL actions must strictly follow these user-defined prompts:

- Categorization: ${prompts.categorization}
- Action Item Extraction: ${prompts.action_item}
- Auto Reply Drafting: ${prompts.auto_reply}

Return clean text only.`;

    const userPrompt = `
EMAIL CONTENT:
${email.body}

USER REQUEST:
${userQuery}
`;

    const aiResponse = await runLLM(systemPrompt, userPrompt);

    res.json({ result: aiResponse });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
