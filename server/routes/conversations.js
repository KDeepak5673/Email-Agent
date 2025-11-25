const express = require("express");
const router = express.Router();
const { getCollection } = require("../utils/db");

router.get("/", async (req, res) => {
    try {
        const coll = getCollection('conversations');
        const conversations = await coll.find({}).toArray();
        // Map documents to include `id` as string and sort messages oldest->newest
        const mapped = conversations.map(doc => {
            const obj = { ...doc };
            if (obj._id) obj.id = obj.id || obj._id.toString();
            if (Array.isArray(obj.messages)) {
                obj.messages = obj.messages.map(m => ({ ...m, timestamp: m.timestamp ? new Date(m.timestamp).toISOString() : new Date().toISOString() }));
                obj.messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            }
            // Avoid sending Mongo internals if not needed
            delete obj._id;
            return obj;
        });
        res.json(mapped);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const { ObjectId } = require('mongodb');

router.post("/", async (req, res) => {
    try {
        const coll = getCollection('conversations');
        const data = { ...req.body };

        // If client provided an id, try to update existing document (supports numeric id, string id, or _id)
        if (data.id) {
            // Try direct match
            let result = await coll.updateOne({ id: data.id }, { $set: data });
            if (result.matchedCount === 0 && !isNaN(Number(data.id))) {
                result = await coll.updateOne({ id: Number(data.id) }, { $set: data });
            }
            if (result.matchedCount === 0 && ObjectId.isValid(data.id)) {
                result = await coll.updateOne({ _id: new ObjectId(data.id) }, { $set: data });
            }
            if (result.matchedCount > 0) {
                // return the updated document
                const updated = await coll.findOne({ id: data.id }) || (ObjectId.isValid(data.id) ? await coll.findOne({ _id: new ObjectId(data.id) }) : null);
                if (updated) {
                    if (updated._id) updated.id = updated.id || updated._id.toString();
                    if (Array.isArray(updated.messages)) {
                        updated.messages = updated.messages.map(m => ({ ...m, timestamp: m.timestamp ? new Date(m.timestamp).toISOString() : new Date().toISOString() }));
                        updated.messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                    }
                    delete updated._id;
                }
                return res.json({ message: 'Conversation updated', conversation: updated });
            }
        }

        // Otherwise insert as new document
        const r = await coll.insertOne(data);
        // ensure id exists
        await coll.updateOne({ _id: r.insertedId, id: { $exists: false } }, [{ $set: { id: { $toString: '$_id' } } }]);
        const inserted = await coll.findOne({ _id: r.insertedId });
        if (inserted) {
            inserted.id = inserted.id || inserted._id.toString();
            if (Array.isArray(inserted.messages)) {
                inserted.messages = inserted.messages.map(m => ({ ...m, timestamp: m.timestamp ? new Date(m.timestamp).toISOString() : new Date().toISOString() }));
                inserted.messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            }
            delete inserted._id;
        }
        res.json({ message: "Conversation saved", conversation: inserted });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const coll = getCollection('conversations');
        const id = req.params.id;
        let result = await coll.deleteOne({ id: id });
        if (result.deletedCount === 0 && !isNaN(Number(id))) {
            result = await coll.deleteOne({ id: Number(id) });
        }
        if (result.deletedCount === 0 && ObjectId.isValid(id)) {
            result = await coll.deleteOne({ _id: new ObjectId(id) });
        }
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Conversation not found' });
        }
        res.json({ message: "Conversation deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;