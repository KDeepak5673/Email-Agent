const express = require("express");
const fs = require("fs");
const router = express.Router();

router.get("/", (req, res) => {
  const prompts = JSON.parse(fs.readFileSync("./data/prompts.json"));
  res.json(prompts);
});

router.post("/", (req, res) => {
  fs.writeFileSync("./data/prompts.json", JSON.stringify(req.body, null, 2));
  res.json({ msg: "Prompts updated" });
});

module.exports = router;
