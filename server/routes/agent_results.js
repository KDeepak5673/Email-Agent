const express = require("express");
const fs = require("fs");
const router = express.Router();

router.get("/", (req, res) => {
    const agentResults = JSON.parse(fs.readFileSync("./data/agent_results.json"));
    res.json(agentResults);
});

router.post("/", (req, res) => {
    const agentResults = JSON.parse(fs.readFileSync("./data/agent_results.json"));
    agentResults.push(req.body);
    fs.writeFileSync("./data/agent_results.json", JSON.stringify(agentResults, null, 2));
    res.json({ message: "Agent result saved" });
});

router.delete("/:id", (req, res) => {
    const agentResults = JSON.parse(fs.readFileSync("./data/agent_results.json"));
    const filteredResults = agentResults.filter(result => result.id != req.params.id);
    fs.writeFileSync("./data/agent_results.json", JSON.stringify(filteredResults, null, 2));
    res.json({ message: "Agent result deleted" });
});

module.exports = router;