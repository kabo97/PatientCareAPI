const express = require('express');
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();
const jwt = require('jsonwebtoken');

const sql = neon(process.env.DATABASE_URL);
const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET
router.post('/sign', async (req, res) => {
    const { id, password } = req.body; // Accept only id and password in the request body

    if (!id || !password) {
        return res.status(400).json({ error: 'ID and password are required' });
    }

    try {
        // Fetch user details, including the role, from the database
        const result = await sql`SELECT * FROM auth WHERE id = ${id} AND password = ${password}`;
        if (result.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const role = result[0].role; // Extract role from the database

        // Generate a token with id and role
        const token = jwt.sign({ id: id, role: role }, SECRET_KEY, { expiresIn: '1h' });
        res.json({
            message: `Authenticated successfully as ${role}`,
            token: token
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});


module.exports = router;
