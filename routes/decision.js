import { generateNearbyZones, getCrowdDataJson } from '../dynamicZoneService.js';
import { getDecision } from '../aiService.js';
import express from 'express';

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const { location, lat, lng, intent, time, preference, friends } = req.body;

        if (!intent || !time || lat === undefined || lng === undefined) {
            return res.status(400).json({ error: "Missing required fields: lat, lng, intent, time" });
        }

        // Generate or Re-generate dynamic zones around user coordinate
        const activeZones = generateNearbyZones(lat, lng);

        // Fetch crowd data from memory
        const crowdData = getCrowdDataJson();

        // Send to AI Decision Engine, providing lat/lng and the active spatial objects
        const aiResponse = await getDecision(lat, lng, intent, time, activeZones, preference, friends);

        res.json(aiResponse);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;
