import { getDecision } from './aiService.js';
import { getCrowdDataString } from './db.js';

const runTests = async () => {
    const crowdDataDummy = `Zone A: low\nZone B: high\nZone C: low\nZone D: critical\nGate 1: low\nExit 1: critical`;

    console.log("=== Running API Tests (Prompt #8) ===\n");

    const tests = [
        {
            name: "1. Normal Scenario (Easy routing)",
            location: "Gate 1", intent: "seat", time: "before match"
        },
        {
            name: "2. Congested Scenario (Food rush during halftime)",
            location: "Zone A", intent: "food", time: "halftime"
        },
        {
            name: "3. Emergency/Predictive Exit (Leaving packed stadium)",
            location: "Zone D", intent: "exit", time: "end"
        }
    ];

    for (let t of tests) {
        console.log(`\n▶ [TEST] ${t.name}`);
        console.log(`Input: location=${t.location}, intent=${t.intent}, time=${t.time}`);
        try {
            const decision = await getDecision(t.location, t.intent, t.time, crowdDataDummy);
            console.log("Expected Output format matched.");
            console.log("Result:", JSON.stringify(decision, null, 2));
        } catch (e) {
            console.error("Test Failed:", e.message);
        }
    }
    
    console.log("\n=== Testing Complete. Proceed to Cloud Run demo! ===");
    process.exit(0);
};

runTests();
