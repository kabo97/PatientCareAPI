const express = require('express');
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);
const router = express.Router();

// View Queue
router.get('/queue', async (req, res) => {
  try {
    const queue = await sql`SELECT * FROM queue`;

    res.status(201).json(queue);}
  catch (err) {
    console.error(err)
    res.status(500).json({error: 'Failed to get queue from database.', details: err.message})
  }
    
  
});
  
  // Mark Prescription as Ready
router.post('/complete', async (req, res) => {
  const { prescriptionNumber } = req.body;

  try {
    let item = await sql`
    UPDATE queue 
    SET status = 'ready' 
    WHERE prescriptionNumber = ${prescriptionNumber} 
    RETURNING id`;

    if (result.length > 0) {
        res.json({ message: `Prescription ${prescriptionNumber} marked as ready` });
      } else {
        res.status(404).json({ message: `Prescription ${prescriptionNumber} not found` });
    }
  } catch (error) {
    console.error('Error updating prescription:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;