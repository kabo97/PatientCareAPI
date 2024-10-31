const express = require('express');
const { Pool } = require('pg');
const client = require('../db');
const router = express.Router();
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Add a new doctor
router.post('/', async (req, res) => {
    const { name, specialty } = req.body;
    try {
        const result = await pool.query('INSERT INTO doctors (name, specialty) VALUES ($1, $2) RETURNING *', [name, specialty]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;
