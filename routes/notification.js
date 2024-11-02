const express = require('express');
const { neon } = require('@neondatabase/serverless');
const twilio = require('twilio');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);
const router = express.Router();

// Twilio client for sending WhatsApp messages
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = twilio(accountSid, authToken);

router.post('/', async (req, res) => {
    const { patientId, prescriptionNumber } = req.body;
    
    try {
        // Sending a WhatsApp message
        const message = await twilioClient.messages.create({
            from: process.env.TWILIO_WHATSAPP_NUMBER,
            to: `whatsapp:${patientId}`, // Patient's phone number in WhatsApp format
            body: `Your prescription with ID ${prescriptionNumber} is ready for pickup.`
        });
        
        console.log(`Successfully sent notification to ${patientId}`)
        res.status(200).json({ message: 'Notification sent', sid: message.sid });
    } catch (error) {
        console.error('Error sending WhatsApp message:', error);
        res.status(500).json({ error: 'Failed to send notification' });
    }
});



module.exports = router;