const express = require('express');
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);
const router = express.Router();

router.post('/prescriptions', async (req, res) => {
    const { doctorId, patientId, medicines } = req.body;

    try {
        // Insert doctor if not already in database
        let doctor = await sql`SELECT id FROM auth WHERE doctor_id = ${doctorId}`;
        
        const doctorIdDb = doctor[0].id;

        // Insert patient if not already in database
        let patient = await sql`SELECT id FROM patient WHERE patient_id = ${patientId}`;
        if (patient.length === 0) {
            patient = await sql`INSERT INTO patient (patient_id) VALUES (${patientId}) RETURNING id`;
        }
        const patientIdDb = patient[0].id;

        // Insert prescription
        const prescription = await sql`INSERT INTO prescriptions (doctor_id, patient_id) VALUES (${doctorIdDb}, ${patientIdDb}) RETURNING id`;
        const prescriptionId = prescription[0].id;

        // Insert medicines
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

module.exports = router;
