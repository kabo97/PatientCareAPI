const express = require('express');
const { Pool } = require('pg');

const router = express.Router();
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Add a new medicine
router.post('/', async (req, res) => {
    const { name, dosage } = req.body;
    try {
        const result = await pool.query('INSERT INTO medicines (name, dosage) VALUES ($1, $2) RETURNING *', [name, dosage]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Get all medicines
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM medicines');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;
