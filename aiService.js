import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

// Ensure the API key is configured
if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_api_key_here') {
    console.warn("WARNING: GEMINI_API_KEY is missing or invalid in the .env file.");
}

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Master System Prompt from the Prompt Wars guidelines
const SYSTEM_INSTRUCTION = `You are an AI-powered Smart Stadium Assistant.

Your role is to optimize user movement and experience inside a large sports venue using real coordinate data.

You must make decisions based on:
1. User Intent (what the user wants)
2. Real-time Crowd Density at specific zones (low, medium, high, critical)
3. User Location (current lat/lng)
4. Time Context (before match, during match, halftime, exit time)

Your objectives:
- Minimize waiting time
- Avoid crowded areas
- Suggest the fastest and safest routes using exact lat/lng markers

Decision Rules:
- If crowd density is HIGH or CRITICAL near a zone → avoid it completely
- Choose the least crowded + shortest path
- If user intent is "food" → recommend nearest food stall zone with lowest wait time
- If user intent is "exit" → recommend exit zone early

Output Format (STRICT JSON ONLY):
{
  "message": "Human readable suggestion",
  "primary_route": [{"name": "Start", "lat": 12.34, "lng": 56.78}, {"name": "Destination", "lat": 12.35, "lng": 56.79}],
  "alternate_route": [{"name": "Start", "lat": 12.34, "lng": 56.78}, {"name": "Alternate Zone", "lat": 12.36, "lng": 56.80}],
  "reason": "Technical reason.",
  "explanation": "Conversational, simple english explaining WHY this route was picked based on crowd physics.",
  "priority": "low / medium / high"
}`;

export const getDecision = async (lat, lng, intent, timePhase, activeZones, preference = 'balanced', friends = []) => {
    
    // User Input Prompt Template
    const prompt = `User Context:
- Current Location: Lat ${lat}, Lng ${lng}
- Intent: ${intent}
- Time: ${timePhase}
- Routing Preference: ${preference}
- Nearby Active Zones:
${JSON.stringify(activeZones, null, 2)}
${friends && friends.length > 0 ? `- Friends Remote Coordinates (Find Midpoint):\n${JSON.stringify(friends, null, 2)}` : ''}

Provide the primary coordinate-based path, and an alternate backup path routing inside the provided valid Active Zones. Ensure the start of both routes is the user's current location ({ "name": "Current Location", "lat": ${lat}, "lng": ${lng} }). Generate the best decision. Ensure output is strict valid JSON.

CRITICAL PREFERENCE DIRECTIVE: The user's routing preference is '${preference}'. 
- If 'fastest', strongly prefer the shortest physical path, ignoring moderate crowd levels unless critical.
- If 'least_crowded', avoid 'high' and 'critical' crowds at all costs, even if the path is significantly longer.
- If 'balanced', weigh both distance and crowd levels equally.

CRITICAL RENDEZVOUS DIRECTIVE: If Intent equals 'friends_rendezvous', you MUST select an Active Zone that acts as the safest, least-crowded geographical midpoint between the User Coordinates and the Friends Remote Coordinates. Route the user directly to this rendezvous midpoint.

CRITICAL EMERGENCY DIRECTIVE: If Intent exactly equals 'emergency', you MUST completely ignore all crowd levels and preferences. Route the user to the nearest 'Exit' by the absolute fastest line immediately. Set priority to 'critical' and do not provide an alternate route if unnecessary.`;

    try {
        const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash', systemInstruction: SYSTEM_INSTRUCTION });
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.2, // Low temperature for deterministic, logical routing
                responseMimeType: "application/json" // Force strict JSON output
            }
        });

        // Parse and return strict JSON response
        const text = result.response.text();
        return JSON.parse(text); 

    } catch (error) {
        console.warn("Gemini API failed or missing key, falling back to rule-based mock decision.", error.message);
        
        // Find a safe mock destination fallback
        const safeDest = activeZones.find(z => z.level === 'low') || activeZones[0];
        const altDest = activeZones.find(z => z.name !== safeDest.name) || activeZones[1] || safeDest;

        // Default normal mock
        return {
            message: `Proceed toward ${safeDest.name}. Paths are relatively clear.`,
            primary_route: [
                { name: "Current Location", lat, lng },
                { name: safeDest.name, lat: safeDest.lat, lng: safeDest.lng }
            ],
            alternate_route: [
                { name: "Current Location", lat, lng },
                { name: altDest.name, lat: altDest.lat, lng: altDest.lng }
            ],
            reason: "Current crowd levels are manageable. Proceeding safely.",
            priority: "low"
        };
    }
};
