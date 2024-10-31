const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const patientsRoutes = require('./routes/patients');
const doctorsRoutes = require('./routes/doctors');
const medicinesRoutes = require('./routes/medicines');
const usersRoutes = require('./routes/auth');
const prescriptionsRoutes = require('./routes/prescription');

// Use routes
app.use('/api/patients', patientsRoutes);
app.use('/api/doctors', doctorsRoutes);
app.use('/api/prescriptions', prescriptionsRoutes);
app.use('/api/auth', usersRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
