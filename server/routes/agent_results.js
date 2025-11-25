const express = require("express");
const router = express.Router();
const { getCollection } = require("../utils/db");

router.get("/", async (req, res) => {
    try {
        const coll = getCollection('agent_results');
        const results = await coll.find({}).toArray();
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/", async (req, res) => {
    try {
        const coll = getCollection('agent_results');
        const r = await coll.insertOne(req.body);
        if (!req.body.id) {
            await coll.updateOne({ _id: r.insertedId }, [{ $set: { id: { $toString: '$_id' } } }]);
        }
        res.json({ message: "Agent result saved", insertedId: r.insertedId.toString() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const coll = getCollection('agent_results');
        const id = req.params.id;
        let result = await coll.deleteOne({ id: id });
        if (result.deletedCount === 0 && !isNaN(Number(id))) {
            result = await coll.deleteOne({ id: Number(id) });
        }
        const { ObjectId } = require('mongodb');
        if (result.deletedCount === 0 && ObjectId.isValid(id)) {
            result = await coll.deleteOne({ _id: new ObjectId(id) });
        }
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Agent result not found' });
        }
        res.json({ message: "Agent result deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;