const express = require('express');
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);
const router = express.Router();

// Function to generate prescription number (letter + 6 digits)
function generatePrescriptionNumber() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const randomLetter = letters[Math.floor(Math.random() * letters.length)];
    const randomDigits = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `${randomLetter}${randomDigits}`;
}

router.post('/', async (req, res) => {
    const { doctorId, patientId, serviceTime, severityImpact } = req.body;

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

        const serviceTimeDb = serviceTime || '00:04:59';
        const severityImpactDb = severityImpact || 1;

        // Generate and verify uniqueness of prescription number
        let prescriptionNumber;
        let isUnique = false;

        while (!isUnique) {
            prescriptionNumber = generatePrescriptionNumber();
            const existing = await sql`SELECT prescription_id FROM prescriptions WHERE prescription_id = ${prescriptionNumber}`;
            if (existing.length === 0) {
                isUnique = true;
            }
        }

        const prescription = await sql`
            INSERT INTO prescriptions (prescription_id, patient_id, doctor_id, service_time, severity_impact)
            VALUES (${prescriptionNumber}, ${patientIdDb}, ${doctorIdDb}, ${serviceTimeDb}, ${severityImpactDb})
            RETURNING prescription_id
        `;

        res.status(201).json({
            message: 'Prescription added successfully',
            id: prescription[0].prescription_id,
            prescriptionNumber: prescriptionNumber
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to insert prescription data', details: err.message });
    }
});

router.get('/:id', async (req, res) => {
    const prescriptionId = req.params.id;

    try {
        const prescription = await sql`
            SELECT prescription_id, patient_id, doctor_id, severity_impact, service_time, created_at
            FROM prescriptions
            WHERE prescription_id = ${prescriptionId}
        `;

        if (prescription.length === 0) {
            return res.status(404).json({ error: 'Prescription not found' });
        }

        res.status(200).json({
            data: {
                prescriptionId: prescription[0].prescription_id,
                patientId: prescription[0].patient_id,
                doctorId: prescription[0].doctor_id,
                severityImpact: prescription[0].severity_impact,
                serviceTime: prescription[0].service_time,
                createdAt: prescription[0].created_at
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch prescription', details: err.message });
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
            SELECT prescription_id FROM prescriptions 
            WHERE prescription_id = ${prescriptionNumber} 
            AND patient_id = ${patient[0].id}
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
