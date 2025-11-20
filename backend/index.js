const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/radar/latest', async (req, res) => {
    try {
        const sampleData = {
            sample: true,
            timestamp: new Date().toISOString(),
            product: 'Reflectivity at Lowest Altitude (RALA)',
            bounds: {
                nw: [49.0, -125.0],
                ne: [49.0, -67.0],
                se: [25.0, -67.0],
                sw: [25.0, -125.0]
            },
            status: 'active'
        };
        res.json(sampleData);
    } catch (error) {
        res.json({ error: 'Service unavailable', timestamp: new Date().toISOString() });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        service: 'MRMS Radar API',
        timestamp: new Date().toISOString()
    });
});

app.get('/', (req, res) => {
    res.json({ 
        message: 'MRMS Radar API is running',
        endpoints: ['/api/radar/latest', '/api/health']
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
    console.log('Server started on port', PORT);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
