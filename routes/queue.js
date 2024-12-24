const express = require('express');
const router = express.Router();
const db = require('../db');

// Get current queue
router.get('/', async (req, res) => {
  try {
    const queue = await db.query(
      'SELECT * FROM queue WHERE status = $1 ORDER BY severity_impact DESC, ticket_number ASC',
      ['processing']
    );
    res.json({ data: queue.rows });
  } catch (error) {
    console.error('Error getting queue:', error);
    res.status(500).json({ error: 'Failed to get queue' });
  }
});

// Add to queue
router.post('/', async (req, res) => {
  const {
    queueNumber,
    prescriptionId,
    patientId,
    medicines,
    waitTime,
    servedTime,
    entryTime,
    severityImpact
  } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO queue (
        ticket_number,
        prescription_id,
        patient_id,
        medicines,
        wait_time,
        served_time,
        entry_time,
        severity_impact,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        queueNumber,
        prescriptionId,
        patientId,
        JSON.stringify(medicines),
        waitTime,
        servedTime,
        entryTime,
        severityImpact,
        'processing'
      ]
    );

    // Emit socket event for new queue entry
    const io = req.app.get('io');
    io.emit('queueUpdate', { type: 'add', data: result.rows[0] });

    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error adding to queue:', error);
    res.status(500).json({ error: 'Failed to add to queue' });
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
