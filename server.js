import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import decisionRoutes from './routes/decision.js';
import { simulateCrowdUpdates, getActiveZones, getCrowdDataJson } from './dynamicZoneService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Routes
app.use('/get-decision', decisionRoutes);

app.get('/api/crowd', (req, res) => {
    try {
        const fullData = {
            levels: getCrowdDataJson(),
            zones: getActiveZones()
        };
        res.json(fullData);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch crowd data' });
    }
});

// Serve React Frontend exactly how GCP Cloud Run expects
app.use(express.static(path.join(__dirname, 'frontend/dist')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Smart Stadium Assistant Backend running on http://localhost:${PORT}`);
    
    // Start Real-time crowd update simulation based on dynamic generation
    simulateCrowdUpdates();
});
