import { getDecision } from './aiService.js';

async function test() {
    const res = await getDecision(
        12.34, 56.78, "food", "before match",
        [{name: "Zone A", lat: 12.35, lng: 56.79, level: "low"}],
        "fastest", []
    );
    console.log(res);
}

test();
