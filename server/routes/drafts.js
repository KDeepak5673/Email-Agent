const express = require("express");
const fs = require("fs");
const router = express.Router();

router.get("/", (req, res) => {
  const drafts = JSON.parse(fs.readFileSync("./data/drafts.json"));
  res.json(drafts);
});

router.post("/", (req, res) => {
  const drafts = JSON.parse(fs.readFileSync("./data/drafts.json"));
  drafts.push(req.body);
  fs.writeFileSync("./data/drafts.json", JSON.stringify(drafts, null, 2));
  res.json({ message: "Draft saved" });
});

router.delete("/:id", (req, res) => {
  const drafts = JSON.parse(fs.readFileSync("./data/drafts.json"));
  const filteredDrafts = drafts.filter(draft => draft.id != req.params.id);
  fs.writeFileSync("./data/drafts.json", JSON.stringify(filteredDrafts, null, 2));
  res.json({ message: "Draft deleted" });
});

module.exports = router;
