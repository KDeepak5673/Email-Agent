const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGO_DB_NAME || 'email_agent_db';

let client;
let db;

async function connect() {
    if (db) return db;
    try {
        client = new MongoClient(MONGO_URI);
        await client.connect();
    } catch (err) {
        console.error('Failed to connect to MongoDB at', MONGO_URI, err.message);
        throw err;
    }
    db = client.db(DB_NAME);
    console.log(`Connected to MongoDB:  (db: ${DB_NAME})`);
    return db;
}

function getCollection(name) {
    if (!db) throw new Error('Database not connected. Call connect() first.');
    return db.collection(name);
}

async function close() {
    if (client) await client.close();
    client = null;
    db = null;
}

module.exports = { connect, getCollection, close };
