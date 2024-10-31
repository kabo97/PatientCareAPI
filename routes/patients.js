const express = require('express');
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);
const router = express.Router();

// Get patient by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Execute the SQL directly using the sql instance
        const result = await sql`SELECT * FROM patient WHERE id = ${id}`;

        // Check if the result has rows
        if (!result || !result.length) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        // Send the patient data back as a response
        res.json(result[0]); // or result.rows[0] depending on the structure
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

module.exports = router;
