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

module.exports = router;
