const express = require('express');
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();
const jwt = require('jsonwebtoken');

const sql = neon(process.env.DATABASE_URL);
const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET
router.post('/login', async (req, res) => {
    const { id, password } = req.body;
    if (!id || !password) {
        return res.status(400).json({ error: 'ID and password are required' });
    }
    try {
        const result = await sql`SELECT * FROM auth WHERE id = ${id} AND password = ${password}`;
        if (result.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: id }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ message: 'Authenticated successfully', token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

router.post('/sign', async (req, res) => {
    const { id, password, role } = req.body; // Add role to the request body

    if (!id || !password || !role) {
        return res.status(400).json({ error: 'ID, password, and role are required' });
    }

    try {
        // Check if the user is a doctor or pharmacist
        const result = await sql`SELECT * FROM ${role} WHERE id = ${id} AND password = ${password}`;
        if (result.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials or role' });
        }

        // Generate a token with role information
        const token = jwt.sign({ id: id, role: role }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ message: `Authenticated successfully as ${role}`, token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

module.exports = router;
