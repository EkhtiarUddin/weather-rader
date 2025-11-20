const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const MRMS_BASE = 'https://mrms.ncep.noaa.gov/data';

async function fetchMRMSData() {
    try {
        const urls = [
            `${MRMS_BASE}/2D/RALA/MRMS_RALA_latest.grib2.gz`,
            `${MRMS_BASE}/2D/ReflectivityAtLowestAltitude/MRMS_ReflectivityAtLowestAltitude_latest.grib2.gz`
        ];
        
        for (const url of urls) {
            try {
                const response = await axios.head(url, { timeout: 5000 });
                if (response.status === 200) {
                    return { success: true, url, timestamp: new Date().toISOString() };
                }
            } catch (error) {
                continue;
            }
        }
        return { success: false, error: 'No MRMS data available' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

app.get('/api/radar/latest', async (req, res) => {
    try {
        const mrmsData = await fetchMRMSData();
        
        if (mrmsData.success) {
            res.json({
                dataUrl: mrmsData.url,
                timestamp: mrmsData.timestamp,
                product: 'Reflectivity at Lowest Altitude (RALA)',
                bounds: { nw: [49, -125], ne: [49, -67], se: [25, -67], sw: [25, -125] },
                status: 'live'
            });
        } else {
            res.json({
                sample: true,
                timestamp: new Date().toISOString(),
                product: 'Reflectivity at Lowest Altitude (RALA)',
                bounds: { nw: [49, -125], ne: [49, -67], se: [25, -67], sw: [25, -125] },
                status: 'sample_data',
                message: 'Real MRMS data unavailable - using sample data'
            });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        service: 'MRMS RALA Radar API',
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`MRMS Radar API running on port ${PORT}`);
});
