const express = require('express');
const router = express.Router();
const db = require('../db');
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

// Get current queue
router.get('/', async (req, res) => {
  try {
    const queue = await sql`SELECT * FROM queue`;

    res.status(201).json(queue);}
  catch (err) {
    console.error(err)
    res.status(500).json({error: 'Failed to get queue from database.', details: err.message})
  }
    
  
});

// Add to queue
router.post('/', async (req, res) => {
  const { queueNumber, prescriptionId, patientId, medicines, waitTime, servedTime, entryTime } = req.body;

  try {
    // Validate prescription exists
    const prescriptionExists = await sql`
    SELECT id 
    FROM prescriptions 
    WHERE id = ${prescriptionId}`;

    if (prescriptionExists.length === 0) {
      return res.status(404).json({ message: `Prescription ${prescriptionId} does not exist` });
    }

    // Convert medicines array to JSONB
    const medicinesJson = JSON.stringify(medicines);

    const newEntry = await sql`
    INSERT INTO queue (
      queueNumber, 
      prescription_id, 
      patient_id, 
      status, 
      medicines, 
      wait_time, 
      served_time, 
      entry_time
    )
    VALUES (
      ${queueNumber}, 
      ${prescriptionId}, 
      ${patientId}, 
      'waiting', 
      ${medicinesJson}::jsonb, 
      ${waitTime}::time, 
      ${servedTime}::time, 
      ${waitTime}::interval
    )
    RETURNING *`;

    res.status(201).json({ message: 'New queue entry added', data: newEntry });
  } catch (error) {
    console.error('Error adding to queue:', error);
    res.status(500).json({ 
      message: 'Failed to add new entry to queue', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
});


// Update queue status
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { status, servedTime } = req.body;

  try {
    const result = await db.query(
      'UPDATE queue SET status = $1, served_time = $2 WHERE id = $3 RETURNING *',
      [status, servedTime, id]
    );

    // Emit socket event for status update
    const io = req.app.get('io');
    io.emit('queueUpdate', { type: 'update', data: result.rows[0] });

    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error updating queue:', error);
    res.status(500).json({ error: 'Failed to update queue' });
  }
});

// Delete from queue
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query('DELETE FROM queue WHERE id = $1 RETURNING *', [id]);

    // Emit socket event for queue deletion
    const io = req.app.get('io');
    io.emit('queueUpdate', { type: 'delete', data: result.rows[0] });

    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error deleting from queue:', error);
    res.status(500).json({ error: 'Failed to delete from queue' });
  }
});

// Mark prescription as complete
router.post('/:prescriptionId/complete', async (req, res) => {
  const { prescriptionId } = req.params;

  try {
    const result = await db.query(
      'UPDATE queue SET status = $1 WHERE prescription_id = $2 RETURNING *',
      ['completed', prescriptionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prescription not found in queue' });
    }

    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error completing prescription:', error);
    res.status(500).json({ error: 'Failed to complete prescription' });
  }
});

module.exports = router;
