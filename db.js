const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // required for Neon
});

client.connect()
    .then(() => console.log("Connected to Neon PostgreSQL"))
    .catch(err => console.error("Connection error", err.stack));

module.exports = client;