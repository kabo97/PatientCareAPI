const express = require('express');
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);
const router = express.Router();

router.post('/', async (req, res) => {
    const { doctorId, patientId, medicines } = req.body;

    try {
        let doctor = await sql`SELECT id FROM auth WHERE id = ${doctorId}`;
        
        const doctorIdDb = doctor[0]?.id;
        if (!doctorIdDb) {
            return res.status(404).json({ error: 'Doctor not found' });
        }

        let patient = await sql`SELECT id FROM patient WHERE id = ${patientId}`;

        const patientIdDb = patient[0]?.id;
        if (!patientIdDb) {
            return res.status(404).json({ error: 'Patient not found' });
        }
        const prescription = await sql`
            INSERT INTO prescriptions (doctor_id, patient_id)
            VALUES (${doctorIdDb}, ${patientIdDb}) RETURNING id
        `;
        const prescriptionId = prescription[0].id;

        for (const med of medicines) {
            await sql`
                INSERT INTO medicines (prescription_id, name, quantity, dosage)
                VALUES (${prescriptionId}, ${med.name}, ${med.quantity}, ${med.dosage})
            `;
        }

        res.status(201).json({ message: 'Prescription and medicines added successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to insert prescription data', details: err.message });
    }
});

router.post('/notify', async (req, res) => {
    const { patientId, prescriptionNumber } = req.body;

    try {
        const patient = await sql`SELECT id FROM patient WHERE id = ${patientId}`;
        if (patient.length === 0) {
            return res.status(404).json({ error: 'Patient not found' });
        }
        
        const prescription = await sql`
            SELECT id FROM prescriptions WHERE id = ${prescriptionNumber} AND patient_id = ${patient[0].id}
        `;
        
        if (prescription.length === 0) {
            return res.status(404).json({ error: 'Prescription not found for the specified patient' });
        }

        res.status(200).json({ message: 'Notification sent successfully for the prescription' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to process notification', details: err.message });
    }
});

module.exports = router;
