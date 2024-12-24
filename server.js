const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cronJobs = require('./routes/cronJob');
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Configure this according to your frontend URL in production
        methods: ["GET", "POST"]
    }
});
const PORT = process.env.PORT || 3009;

// Middleware
app.use(cors());
app.use(express.json());

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Handle queue updates
    socket.on('queueUpdate', (update) => {
        console.log('Queue update received:', update);
        // Broadcast the update to all connected clients
        io.emit('queueUpdate', update);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Make io accessible to routes
app.set('io', io);

// Import routes
const patientsRoutes = require('./routes/patients');
const usersRoutes = require('./routes/auth');
const prescriptionsRoutes = require('./routes/prescription');
const medicinesRoutes = require('./routes/medicines');
const pharmacistRoutes = require('./routes/pharmacists');
const metricsRoutes = require('./routes/metrics');
const queueRoutes = require('./routes/queue');

// Use routes
app.get('/', (req, res) => res.send('Hello from Server'));
app.use('/api/patients', patientsRoutes);
app.use('/api/prescriptions', prescriptionsRoutes);
app.use('/api/auth', usersRoutes);
app.use('/api/pharmacists', pharmacistRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/medicines', medicinesRoutes);
app.use('/api/queue', queueRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

// Start server
httpServer.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});