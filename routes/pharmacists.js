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
// Add a New Entry to the Queue
router.post('/queue/add', async (req, res) => {
  const { queueNumber, prescriptionId, patientId, medicines, waitTime, servedTime, entryTime } = req.body;

  try {
    const prescriptionExists = await sql`
    SELECT id 
    FROM prescriptions 
    WHERE id = ${prescriptionId}`;

  if (prescriptionExists.length === 0) {
    return res.status(404).json({ message: `Prescription ${prescriptionId} does not exist` });
  }
    const newEntry = await sql`
    INSERT INTO queue (queueNumber, prescription_id, patient_id, status, medicines, wait_time, served_time, entry_time)
    VALUES (${queueNumber}, ${prescriptionId}, ${patientId}, 'waiting', ${medicines}, ${waitTime}, ${servedTime}, ${entryTime})
    RETURNING *`;

    res.status(201).json({ message: 'New queue entry added', data: newEntry });
  } catch (error) {
    console.error('Error adding to queue:', error);
    res.status(500).json({ message: 'Failed to add new entry to queue', details: error.message });
  }
});

  // Mark Prescription as Ready
router.post('/complete', async (req, res) => {
  const { prescriptionId } = req.body;

  try {
        const prescriptionExists = await sql`
        SELECT id 
        FROM prescriptions 
        WHERE id = ${prescriptionId}`;

      if (prescriptionExists.length === 0) {
        return res.status(404).json({ message: `Prescription ${prescriptionId} does not exist` });
      }
    let item = await sql`
    UPDATE queue 
    SET status = 'ready' 
    WHERE prescription_id = ${prescriptionId} 
    RETURNING id`;

    if (item.length > 0) {
        res.json({ message: `Prescription ${prescriptionId} marked as ready` });
      } else {
        res.status(404).json({ message: `Prescription ${prescriptionId} not found` });
    }
  } catch (error) {
    console.error('Error updating prescription:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;