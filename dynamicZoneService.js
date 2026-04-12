let activeZones = [];

const CROWD_LEVELS = ['low', 'medium', 'medium', 'high', 'critical']; // Slightly weighted towards medium

// Offsets coordinate by roughly up to 200m (approx 0.002 degrees lat/lng)
const offset = () => (Math.random() - 0.5) * 0.004;

export const generateNearbyZones = (lat, lng) => {
    // Rebuild active zones around the new center
    activeZones = [
        { name: "Gate A", lat: lat + offset(), lng: lng + offset(), level: 'medium' },
        { name: "Gate B", lat: lat + offset(), lng: lng + offset(), level: 'high' },
        { name: "Food Court", lat: lat + offset(), lng: lng + offset(), level: 'high' },
        { name: "Washroom", lat: lat + offset(), lng: lng + offset(), level: 'low' },
        { name: "Exit", lat: lat + offset(), lng: lng + offset(), level: 'medium' }
    ];

    // Assign initial random levels
    activeZones.forEach(z => {
        z.level = CROWD_LEVELS[Math.floor(Math.random() * CROWD_LEVELS.length)];
    });

    return activeZones;
};

export const simulateCrowdUpdates = () => {
    console.log("🔄 Dynamic Crowd Simulation started: Updating every 10 seconds...");
    setInterval(() => {
        if (activeZones.length === 0) return;
        // Randomly pick a few zones to update
        for (let i=0; i<2; i++) {
            const randIndex = Math.floor(Math.random() * activeZones.length);
            activeZones[randIndex].level = CROWD_LEVELS[Math.floor(Math.random() * CROWD_LEVELS.length)];
        }
    }, 10000);
};

export const getCrowdDataJson = () => {
    const data = {};
    activeZones.forEach(z => {
        data[z.name] = z.level;
    });
    return data;
};

export const getActiveZones = () => activeZones;
