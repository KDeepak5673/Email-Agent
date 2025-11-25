const express = require("express");
const router = express.Router();
const { runLLM } = require("../utils/llm");
const { getCollection } = require("../utils/db");

router.post("/", async (req, res) => {
  try {
    const { email, userQuery } = req.body;

    const coll = getCollection('prompts');
    const promptsDoc = await coll.findOne({ name: 'prompts' });
    const prompts = promptsDoc ? promptsDoc.value : {};

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
