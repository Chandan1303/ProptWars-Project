# Smart Stadium Assistant

## 1. Chosen Vertical
**Smart Stadium Navigation (Persona: Attendee / Organizer)**
The project focuses on enhancing the stadium experience for both regular attendees and event organizers by providing real-time, dynamic navigation, crowd density visualization, and AI-driven decision-making to optimize movement within large venues.

## 2. Approach and Logic
The application consists of a Node.js backend integrating with the Gemini AI model and a React Vite frontend implementing Google Maps dynamically.
- **Dynamic Routing**: Instead of hard-coded paths, the system accepts search inputs via Google Places Autocomplete to locate any stadium globally.
- **AI Decision Engine**: Gemini calculates the optimal navigation routes based on user intent (e.g., getting food, exiting, emergency) and live crowd data.
- **Real-Time Simulation**: A local service fakes crowd updates periodically to simulate dynamic congestion across stadium zones, triggering auto-rerouting when paths become too critical.

## 3. How the Solution Works
1. **Selection & Intent**: Users enter a stadium location and select an intent (e.g., Food, Exit, Washroom).
2. **Context Passing**: This context, along with realtime generated crowd data, is sent to the backend.
3. **AI Navigation Generation**: The backend uses Gemini API to generate logical arrays of coordinates acting as the primary and alternate paths.
4. **Interactive Display**: The React frontend uses Google Maps API to parse and draw the predicted paths, warning users of "critical" density nodes while assigning scores for efficient navigation choices.

## 4. Assumptions Made
- The real-world application would be connected to actual IoT and stadium turnstile metrics instead of the simulated random data generator currently implemented in `dynamicZoneService.js`.
- Location coordinates generated via Gemini for the route nodes are estimations around the selected stadium center point for demonstration purposes.
- Deployment operates with standard permissions and valid API keys applied via Google Cloud environment variables.

---
*Built for Prompt Wars. 🏆*