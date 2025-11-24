const express = require("express");
const fs = require("fs");
const router = express.Router();

router.get("/", (req, res) => {
    const conversations = JSON.parse(fs.readFileSync("./data/conversations.json"));
    res.json(conversations);
});

router.post("/", (req, res) => {
    const conversations = JSON.parse(fs.readFileSync("./data/conversations.json"));
    conversations.push(req.body);
    fs.writeFileSync("./data/conversations.json", JSON.stringify(conversations, null, 2));
    res.json({ message: "Conversation saved" });
});

router.delete("/:id", (req, res) => {
    const conversations = JSON.parse(fs.readFileSync("./data/conversations.json"));
    const filteredConversations = conversations.filter(conversation => conversation.id != req.params.id);
    fs.writeFileSync("./data/conversations.json", JSON.stringify(filteredConversations, null, 2));
    res.json({ message: "Conversation deleted" });
});

module.exports = router;