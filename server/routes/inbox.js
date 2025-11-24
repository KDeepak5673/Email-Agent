const express = require("express");
const fs = require("fs");
const router = express.Router();

router.get("/", (req, res) => {
  const inbox = JSON.parse(fs.readFileSync("./data/inbox.json"));
  res.json(inbox);
});

module.exports = router;
