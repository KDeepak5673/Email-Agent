const express = require("express");
const router = express.Router();
const { getCollection } = require("../utils/db");

// Prompts are stored as a single document with { name: 'prompts', value: {...} }
router.get("/", async (req, res) => {
  try {
    const coll = getCollection('prompts');
    const doc = await coll.findOne({ name: 'prompts' });
    res.json(doc ? doc.value : {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const coll = getCollection('prompts');
    await coll.updateOne({ name: 'prompts' }, { $set: { value: req.body } }, { upsert: true });
    res.json({ msg: "Prompts updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
