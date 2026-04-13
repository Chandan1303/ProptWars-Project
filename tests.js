import assert from 'assert';
import { getDecision } from './aiService.js';

const runTests = async () => {
    const crowdDataDummy = `Zone A: low\nZone B: high\nZone C: low\nZone D: critical\nGate 1: low\nExit 1: critical`;

    console.log("=== Running Core Logic Validation Tests ===\n");

    const activeZonesMock = [
        { name: "Zone A", lat: 12.0, lng: 77.0, level: "low" },
        { name: "Zone B", lat: 12.1, lng: 77.1, level: "high" }
    ];

    const tests = [
        {
            name: "1. Normal Routing",
            lat: 12.9, lng: 77.6, intent: "seat", time: "before match", pref: "balanced"
        },
        {
            name: "2. Edge Case: Extreme Negative Coordinates",
            lat: -89.0, lng: -179.0, intent: "food", time: "halftime", pref: "least_crowded"
        },
        {
            name: "3. Exit Routing",
            lat: 12.0, lng: 77.0, intent: "exit", time: "end", pref: "fastest"
        }
    ];

    for (let t of tests) {
        console.log(`\n▶ [TEST] ${t.name}`);
        try {
            const start = Date.now();
            const decision = await getDecision(t.lat, t.lng, t.intent, t.time, activeZonesMock, t.pref);
            const duration = Date.now() - start;

            // Strict Assertions
            assert(decision !== null, "Decision should not be null");
            assert(Array.isArray(decision.primary_route), "Primary route must be an array");
            assert(typeof decision.message === "string", "Message must be a valid string");
            
            console.log(`✅ Passed in ${duration}ms! Message: ${decision.message.substring(0, 40)}...`);
        } catch (e) {
            console.error(`❌ Test Failed: ${e.message}`);
            process.exit(1);
        }
    }
    
    console.log("\n=== ✅ All rigorous testing assertions passed! ===");
    process.exit(0);
};

runTests();

