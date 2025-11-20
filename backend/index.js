const express = require('express');
const app = express();

app.use(express.json());

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

app.get('/api/radar/latest', (req, res) => {
    res.json({
        sample: true,
        timestamp: new Date().toISOString(),
        product: 'RALA',
        bounds: {
            nw: [49.0, -125.0],
            ne: [49.0, -67.0],
            se: [25.0, -67.0],
            sw: [25.0, -125.0]
        }
    });
});

app.get('/', (req, res) => {
    res.json({ message: 'MRMS Radar API' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
    console.log('Server running on port', PORT);
});

console.log('Server started successfully');
