const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const MRMS_BASE = 'https://mrms.ncep.noaa.gov/data';

app.get('/api/radar/latest', async (req, res) => {
    try {
        const radarUrls = [
            `${MRMS_BASE}/2D/RALA/MRMS_RALA_latest.grib2.gz`,
            `${MRMS_BASE}/2D/ReflectivityAtLowestAltitude/MRMS_ReflectivityAtLowestAltitude_latest.grib2.gz`,
            `${MRMS_BASE}/2D/CONUS/RALA/MRMS_RALA_latest.grib2.gz`
        ];
        
        let successfulUrl = null;
        
        for (const url of radarUrls) {
            try {
                const response = await axios.head(url, { timeout: 10000 });
                if (response.status === 200) {
                    successfulUrl = url;
                    break;
                }
            } catch (error) {
                continue;
            }
        }
        
        if (!successfulUrl) {
            throw new Error('Could not find accessible RALA data');
        }
        
        const radarData = {
            dataUrl: successfulUrl,
            timestamp: new Date().toISOString(),
            product: 'Reflectivity at Lowest Altitude (RALA)',
            bounds: {
                nw: [49.0, -125.0],
                ne: [49.0, -67.0],
                se: [25.0, -67.0],
                sw: [25.0, -125.0]
            },
            status: 'active',
            nextUpdate: new Date(Date.now() + 2 * 60 * 1000).toISOString()
        };
        
        res.json(radarData);
        
    } catch (error) {
        const sampleData = {
            sample: true,
            timestamp: new Date().toISOString(),
            product: 'Reflectivity at Lowest Altitude (RALA) - SAMPLE DATA',
            bounds: {
                nw: [49.0, -125.0],
                ne: [49.0, -67.0],
                se: [25.0, -67.0],
                sw: [25.0, -125.0]
            },
            status: 'sample_data',
            message: 'Using sample data - real MRMS data unavailable'
        };
        
        res.json(sampleData);
    }
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'MRMS RALA Radar API',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

app.get('/', (req, res) => {
    res.json({
        name: 'MRMS RALA Radar API',
        endpoints: {
            '/api/radar/latest': 'Get latest radar data',
            '/api/health': 'Health check'
        },
        source: 'https://mrms.ncep.noaa.gov/'
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
