const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const patientsRoutes = require('./routes/patients');
const usersRoutes = require('./routes/auth');
const prescriptionsRoutes = require('./routes/prescription');
const pharmacistRoutes = require('./routes/pharmacists');
const notifyRoutes = require('./routes/notification');

// Use routes
app.get('/', (req, res) => res.send('Hello from Server'));
app.use('/api/patients', patientsRoutes);
app.use('/api/prescriptions', prescriptionsRoutes);
app.use('/api/auth', usersRoutes);
app.use('/api/pharmacist', pharmacistRoutes);
app.use('/api/queue/pickup/notify', notifyRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});