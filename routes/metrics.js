const express = require('express');
const router = express.Router();
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);
// GET /metrics endpoint
router.get('/system', async (req, res) => {
    try {
        const metrics = await sql`SELECT * FROM metrics ORDER BY timestamp DESC LIMIT 10`;
        res.status(200).json(metrics);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch metrics' });
    }
});
router.get('/prescription', async (req, res) => {
    try {
        const metrics = await sql`SELECT * FROM prescriptions`;
        res.status(200).json(metrics);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch metrics' });
    }
});
module.exports = router;
