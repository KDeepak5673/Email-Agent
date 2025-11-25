const express = require("express");
const router = express.Router();
const { getCollection } = require("../utils/db");

router.get("/", async (req, res) => {
  try {
    const coll = getCollection('inbox');
    const inbox = await coll.find({}).toArray();
    res.json(inbox);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
