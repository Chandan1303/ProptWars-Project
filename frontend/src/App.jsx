import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import StadiumMap from './StadiumMap';
import { useLoadScript, Autocomplete } from '@react-google-maps/api';

const libraries = ['places', 'visualization'];

const POPULAR_STADIUMS = [
  { name: 'M. Chinnaswamy Stadium, Bengaluru', lat: 12.9788, lng: 77.5996 },
  { name: 'Wankhede Stadium, Mumbai', lat: 18.9388, lng: 72.8258 },
  { name: 'Eden Gardens, Kolkata', lat: 22.5646, lng: 88.3433 },
  { name: 'Wembley Stadium, London', lat: 51.5560, lng: -0.2795 },
  { name: 'Madison Square Garden, NY', lat: 40.7505, lng: -73.9934 }
];

function App() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey !== 'your_google_maps_api_key_here' ? apiKey : 'AIzaSyPlaceholderKeyForPreventingErrors',
    libraries
  });

  const [formData, setFormData] = useState({
    locationName: 'M. Chinnaswamy Stadium, Bengaluru',
    lat: 12.9788,
    lng: 77.5996,
    intent: 'food',
    time: 'before match',
    preference: 'balanced'
  });

  const [autocompleteRef, setAutocompleteRef] = useState(null);

  const [decision, setDecision] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("Ready");
  const [theme, setTheme] = useState(localStorage.getItem('stadium-theme') || 'light');
  const [viewMode, setViewMode] = useState('user');
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [score, setScore] = useState(0);
  const [badge, setBadge] = useState("Rookie 🥉");
  const [crowdData, setCrowdData] = useState({});
  const [activeZones, setActiveZones] = useState([]);
  const [friends, setFriends] = useState([]);
  const [predictiveAlert, setPredictiveAlert] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [isDemoActive, setIsDemoActive] = useState(false);

  // Auto-polling reference to compare state
  const prevCrowdDataRef = useRef({});

  useEffect(() => {
    if (score >= 500) setBadge("Smart Navigator 🏆");
    else if (score >= 200) setBadge("Pro Pathfinder 🥈");
    else if (score >= 50) setBadge("Explorer 🏅");
  }, [score]);

  useEffect(() => {
    document.body.className = theme === 'dark' ? 'dark-theme' : '';
    localStorage.setItem('stadium-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const getCrowdColor = (level) => {
    switch (level) {
      case 'low': return theme === 'light' ? '#52525b' : '#a1a1aa';
      case 'medium': return '#facc15';
      case 'high': return '#f97316';
      case 'critical': return '#dc2626';
      default: return '#f59e0b';
    }
  };

  const getCrowdPercentage = (level) => {
    if (level === 'critical') return 95;
    if (level === 'high') return 75;
    if (level === 'medium') return 45;
    return 15;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleQuickSelect = async (e) => {
    const selected = POPULAR_STADIUMS.find(s => s.name === e.target.value);
    if (selected) {
      setStatusMsg("Analyzing new location...");
      setDecision(null);
      setSearchInput(selected.name);

      const newFormData = {
        ...formData,
        locationName: selected.name,
        lat: selected.lat,
        lng: selected.lng
      };
      setFormData(newFormData);

      // Auto-recalculate
      await handleGetRoute(null, false, newFormData);
      await fetchCrowdData();
      setStatusMsg("Smart navigation ready");
    }
  };

  const startVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition not supported in this browser. Try Chrome.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setStatusMsg("🎙️ Listening...");
    };

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      setIsListening(false);
      setStatusMsg(`Heard: "${transcript}"`);

      let newIntent = formData.intent;
      if (transcript.includes("food") || transcript.includes("eat") || transcript.includes("hungry")) newIntent = "food";
      else if (transcript.includes("washroom") || transcript.includes("restroom") || transcript.includes("toilet")) newIntent = "washroom";
      else if (transcript.includes("exit") || transcript.includes("leave") || transcript.includes("out")) newIntent = "exit";
      else if (transcript.includes("seat") || transcript.includes("stage") || transcript.includes("match")) newIntent = "seat";
      else if (transcript.includes("emergency") || transcript.includes("help") || transcript.includes("fire") || transcript.includes("police")) newIntent = "emergency";

      let newPref = formData.preference;
      if (transcript.includes("fast") || transcript.includes("quick")) newPref = "fastest";
      else if (transcript.includes("crowd") || transcript.includes("comfort") || transcript.includes("empty")) newPref = "least_crowded";

      const newPayload = { ...formData, intent: newIntent, preference: newPref };
      setFormData(newPayload);

      if (newIntent === 'emergency') {
        setIsEmergencyMode(true);
      }

      await handleGetRoute(null, false, newPayload);
    };

    recognition.onerror = () => {
      setIsListening(false);
      setStatusMsg("Smart navigation ready");
    };

    recognition.start();
  };

  const handleFindFriends = async (e) => {
    if (e) e.preventDefault();
    if (!formData.lat) return;

    // Generate 2 random friend locations nearby
    const genLat = () => formData.lat + (Math.random() - 0.5) * 0.003;
    const genLng = () => formData.lng + (Math.random() - 0.5) * 0.003;

    const mockFriends = [
      { id: "Alice", lat: genLat(), lng: genLng() },
      { id: "Bob", lat: genLat(), lng: genLng() }
    ];
    setFriends(mockFriends);
    setIsEmergencyMode(false);

    const payload = { ...formData, intent: 'friends_rendezvous', friends: mockFriends };
    setStatusMsg("📍 Locating optimal rendezvous midpoint...");
    await handleGetRoute(null, false, payload);
  };

  const onLoadAutocomplete = (autocomplete) => {
    setAutocompleteRef(autocomplete);
  };

  const handleManualSearch = (e) => {
    if (e) e.preventDefault();
    if (!searchInput) return;
    setStatusMsg("Searching location...");
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: searchInput }, async (results, status) => {
      if (status === 'OK' && results[0]) {
        const place = results[0];
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        setIsEmergencyMode(false);
        setDecision(null);

        const name = place.formatted_address || searchInput;
        setSearchInput(name);

        const newFormData = {
          ...formData,
          locationName: name,
          lat,
          lng
        };
        setFormData(newFormData);

        await handleGetRoute(null, false, newFormData);
        await fetchCrowdData();
        setStatusMsg("Smart navigation ready");
      } else {
        setStatusMsg(`Search Failed: ${status}. API Key issue?`);
        console.error("Geocoding API blocked:", status);
      }
    });
  };

  const onPlaceChanged = async () => {
    if (autocompleteRef !== null) {
      const place = autocompleteRef.getPlace();
      if (place.geometry) {
        setIsEmergencyMode(false);
        setStatusMsg("Analyzing new location...");
        setDecision(null);
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        const name = place.name || place.formatted_address || 'Selected Location';
        setSearchInput(name);

        const newFormData = {
          ...formData,
          locationName: name,
          lat,
          lng
        };
        setFormData(newFormData);

        // Auto-recalculate
        await handleGetRoute(null, false, newFormData);
        await fetchCrowdData();
        setStatusMsg("Smart navigation ready");
      }
    }
  };

  const checkPredictiveAlerts = (activeRoute, oldData, newData) => {
    if (!activeRoute || activeRoute.length === 0) return;

    const levelWarningMap = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };

    // Check points in route
    for (const point of activeRoute) {
      if (!point.name) continue;
      const oldLevel = levelWarningMap[oldData[point.name]] || 1;
      const newLevel = levelWarningMap[newData[point.name]] || 1;

      if (newLevel > oldLevel && newLevel >= 3) {
        setPredictiveAlert({
          zone: point.name,
          message: `If you wait 5 mins, ${point.name} is likely to become highly congested. Trend is increasing.`
        });

        // Auto-re-route silently
        handleGetRoute(null, true);
        return;
      }
    }

    setPredictiveAlert(null);
  };

  /**
   * Fetches latest dynamically generated crowd metrics.
   * If a critical congestion overlaps current active AI route, triggers Predictive Alert logic.
   */
  const fetchCrowdData = async () => {
    if (isDemoActive) return;
    try {
      const res = await fetch('/api/crowd');
      if (res.ok) {
        const newData = await res.json();
        const newLevels = newData.levels;
        const newZones = newData.zones;

        if (decision?.route) {
          checkPredictiveAlerts(decision.route, prevCrowdDataRef.current, newLevels);
        }

        prevCrowdDataRef.current = newLevels;
        setCrowdData(newLevels);
        if (newZones && newZones.length > 0) setActiveZones(newZones);
      }
    } catch (error) {
      console.warn("Failed to fetch real-time crowd data");
    }
  };

  useEffect(() => {
    fetchCrowdData();
    const interval = setInterval(fetchCrowdData, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [decision, isDemoActive]);

  const handleActivateDemo = () => {
    setIsDemoActive(true);
    setStatusMsg("🔥 DEMO MODE ACTIVE");
    
    // M Chinnaswamy
    const demoLat = 12.9788;
    const demoLng = 77.5996;
    
    const mockZones = [
      { name: "Gate 1 (North)", lat: demoLat + 0.0012, lng: demoLng, level: "critical" },
      { name: "Gate 2 (South)", lat: demoLat - 0.0012, lng: demoLng, level: "low" },
      { name: "Food Stall East", lat: demoLat, lng: demoLng + 0.0012, level: "high" },
      { name: "Restrooms West", lat: demoLat, lng: demoLng - 0.0012, level: "medium" },
      { name: "VIP Pavilion", lat: demoLat - 0.0006, lng: demoLng + 0.0006, level: "low" },
      { name: "Merch Stand", lat: demoLat + 0.0006, lng: demoLng - 0.0006, level: "critical" },
    ];
    
    const mockLevels = {
      "Gate 1 (North)": "critical",
      "Gate 2 (South)": "low",
      "Food Stall East": "high",
      "Restrooms West": "medium",
      "VIP Pavilion": "low",
      "Merch Stand": "critical",
    };
    
    setFormData({
        ...formData,
        locationName: 'M. Chinnaswamy Stadium, Bengaluru',
        lat: demoLat,
        lng: demoLng,
        intent: 'exit'
    });
    
    setActiveZones(mockZones);
    setCrowdData(mockLevels);
    setSearchInput('M. Chinnaswamy Stadium, Bengaluru');
    
    setDecision({
        message: "<strong>[DEMO] Rerouting active.</strong> Bypassing the heavily congested Gate 1 (North) and Merch Stand.",
        primary_route: [
          { name: "Your Seat", lat: demoLat, lng: demoLng },
          { name: "VIP Pavilion", lat: demoLat - 0.0006, lng: demoLng + 0.0006 },
          { name: "Gate 2 (South)", lat: demoLat - 0.0012, lng: demoLng }
        ],
        alternate_route: [
           { name: "Your Seat", lat: demoLat, lng: demoLng },
           { name: "Restrooms West", lat: demoLat, lng: demoLng - 0.0012 },
           { name: "Gate 2 (South)", lat: demoLat - 0.0012, lng: demoLng }
        ],
        reason: "Gate 1 is experiencing critical crowd density. VIP Pavilion path is currently safe ('low').",
        priority: "high"
    });
    setScore(prev => prev + 100);
  };

  /**
   * Main Navigation Action dispatcher
   * Communicates current context (Location, Intent, Map Data) to backend Gemini engine.
   * Modifies the UI explicitly if the routing triggers 'High' or 'Critical' zones.
   *
   * @param {Event} e - Optional React Form event payload
   * @param {boolean} isAutoReroute - Determines if action was automatically dispatched via background density poll
   * @param {Object} payload - Current state of user contexts
   */
  const handleGetRoute = async (e, isAutoReroute = false, payload = formData) => {
    if (e) e.preventDefault();
    if (!isAutoReroute) {
      setIsEmergencyMode(payload.intent === 'emergency');
      setLoading(true);
      setDecision(null);
      setPredictiveAlert(null);
    }

    try {
      const response = await fetch('/get-decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      // GAMIFICATION LOGIC
      if (!isAutoReroute && payload.intent !== 'emergency' && data.primary_route) {
        let highestLevel = 1; // max danger detected
        for (const pt of data.primary_route) {
          const lbl = crowdData[pt.name];
          if (lbl === 'critical') highestLevel = 4;
          else if (lbl === 'high' && highestLevel < 3) highestLevel = 3;
          else if (lbl === 'medium' && highestLevel < 2) highestLevel = 2;
        }

        // If path involves no 'high' or 'critical' areas, reward user!
        if (highestLevel <= 2) {
          setScore(prev => prev + 50);
          data.message = `[🎉 +50 Smart Points] ` + data.message;
        }
      }

      if (isAutoReroute) {
        data.message = "Route updated due to congestion. " + data.message;
      }
      setDecision(data);
    } catch (error) {
      console.error('Error fetching decision:', error);
      if (!isAutoReroute) {
        setDecision({
          message: 'Backend disconnected. Failed to fetch AI navigation logic.',
          primary_route: [],
          alternate_route: [],
          reason: 'System Error',
          priority: 'high'
        });
      }
    } finally {
      if (!isAutoReroute) setLoading(false);
    }
  };

  const handleEmergencyTrigger = async (e) => {
    e.preventDefault();
    setIsEmergencyMode(true);
    setStatusMsg("🚨 EMERGENCY EVACUATION ACTIVE");

    const emergencyPayload = { ...formData, intent: 'emergency' };
    setFormData(emergencyPayload);

    await handleGetRoute(null, false, emergencyPayload);
  };

  return (
    <div className={`dashboard-container ${isEmergencyMode ? 'emergency-active' : ''}`}>
      {/* HEADER */}
      <header className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="header-title">
          <svg viewBox="0 0 24 24" width="32" height="32" stroke="#f59e0b" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
            <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
          </svg>
          <h1>Smart Stadium AI</h1>
        </div>

        <div style={{ flex: 1 }}></div>

        <div className="status-indicator" style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', marginRight: '16px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '6px', overflow: 'hidden' }}>
            <button onClick={() => setViewMode('user')} style={{ background: viewMode === 'user' ? 'var(--primary)' : 'transparent', color: viewMode === 'user' ? '#fff' : 'var(--text-main)', border: 'none', padding: '6px 12px', cursor: 'pointer', fontWeight: 'bold' }}>👤 User</button>
            <button onClick={() => setViewMode('admin')} style={{ background: viewMode === 'admin' ? '#3b82f6' : 'transparent', color: viewMode === 'admin' ? '#fff' : 'var(--text-main)', border: 'none', padding: '6px 12px', cursor: 'pointer', fontWeight: 'bold' }}>📊 Organizer</button>
          </div>
          <button
            onClick={toggleTheme}
            aria-label="Toggle Dark and Light Theme"
            style={{ marginRight: '16px', background: 'transparent', border: '1px solid var(--card-border)', color: 'var(--text-main)', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer' }}
          >
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
          <div style={{ marginRight: '16px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b', padding: '6px 12px', borderRadius: '6px' }}>
            <span style={{ fontWeight: 'bold', color: '#f59e0b' }}>{score} PTS</span> • {badge}
          </div>
          {loading || statusMsg === "Analyzing new location..." ? (
            <span style={{ color: '#f59e0b', fontSize: '14px' }}>⏳ {statusMsg}</span>
          ) : (
            <>
              <div className="status-dot"></div>
              {statusMsg}
            </>
          )}
        </div>
      </header>

      <div className="dashboard-content">
        {/* SIDEBAR: INTENT + TIME SELECTION OR ADMIN VIEW */}
        {viewMode === 'admin' ? (
          <aside className="sidebar admin-sidebar" style={{ width: '400px' }}>
            <h2 style={{ color: 'var(--text-main)' }}>Global Organizer Dashboard</h2>
            <div className="analytics-box" style={{ marginTop: '16px' }}>
              <h3 style={{ color: 'var(--text-main)' }}>Live Crowd Density</h3>
              {Object.entries(crowdData).length === 0 && <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Waiting for geospatial telemetry...</p>}
              {Object.entries(crowdData).map(([zoneName, level]) => (
                <div key={zoneName} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-main)' }}>{zoneName}</span>
                    <span style={{ color: getCrowdColor(level), fontWeight: 'bold' }}>{level.toUpperCase()}</span>
                  </div>
                  <div style={{ width: '100%', backgroundColor: 'var(--card-border)', height: '6px', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: getCrowdPercentage(level) + '%', backgroundColor: getCrowdColor(level), height: '100%', borderRadius: '4px', transition: 'width 1s ease' }} />
                  </div>
                </div>
              ))}

              <h3 style={{ marginTop: '32px', color: 'var(--text-main)' }}>Operational Alerts</h3>
              <div style={{ height: '250px', overflowY: 'auto', border: '1px solid var(--card-border)', padding: '12px', borderRadius: '8px', background: 'var(--bg-color)' }}>
                {Object.entries(crowdData).filter(([n, lvl]) => lvl === 'critical' || lvl === 'high').length === 0 && <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No critical alerts in sector.</p>}
                {Object.entries(crowdData).filter(([n, lvl]) => lvl === 'critical' || lvl === 'high').map(([zone, lvl], i) => (
                  <div key={i} style={{ padding: '8px', marginBottom: '8px', borderLeft: `3px solid ${lvl === 'critical' ? 'var(--critical)' : 'var(--danger)'}`, background: 'var(--card-bg)', fontSize: '12px', color: 'var(--text-main)', borderRadius: '4px' }}>
                    <span style={{ color: lvl === 'critical' ? 'var(--critical)' : 'var(--danger)', fontWeight: 'bold' }}>🚨 [URGENT]</span> Protocol Alert: {zone} is reporting {lvl} congestion levels. Security dispatched.
                  </div>
                ))}
              </div>
            </div>
          </aside>
        ) : (
          <aside className="sidebar">
            <h2 style={{ color: 'var(--text-main)' }}>Navigation Setup</h2>

            <button
              type="button"
              onClick={handleActivateDemo}
              style={{ padding: '12px', borderRadius: '12px', fontWeight: '700', border: 'none', cursor: 'pointer', marginBottom: '8px', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#ffffff', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)' }}
            >
              🔥 INSTANT DEMO MODE
            </button>

            <button
              type="button"
              onClick={handleEmergencyTrigger}
              style={{ padding: '12px', borderRadius: '12px', fontWeight: '700', border: 'none', cursor: 'pointer', marginBottom: '8px', background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#ffffff', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)' }}
            >
              🚨 1-CLICK EMERGENCY EXIT
            </button>

            <form onSubmit={handleGetRoute} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              <div className="form-group">
                <label style={{ color: 'var(--text-main)' }}>Search Any Location</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    {isLoaded ? (
                      <Autocomplete onLoad={onLoadAutocomplete} onPlaceChanged={onPlaceChanged}>
                        <input
                          type="text"
                          value={searchInput}
                          onChange={(e) => setSearchInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleManualSearch();
                            }
                          }}
                          placeholder="Type any stadium or city..."
                          style={{
                            width: '100%', padding: '10px', borderRadius: '6px',
                            border: '1px solid var(--card-border)', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)'
                          }}
                        />
                      </Autocomplete>
                    ) : <div style={{color: 'var(--text-main)'}}>Loading Google Places...</div>}
                  </div>
                  <button 
                    type="button" 
                    onClick={handleManualSearch}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: 'var(--primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    Search
                  </button>
                </div>
                
                <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  📍 Current: <strong style={{ color: 'var(--primary)' }}>{formData.locationName}</strong>
                </div>

                <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {POPULAR_STADIUMS.map(s => (
                    <button
                      key={s.name}
                      type="button"
                      onClick={() => handleQuickSelect({ target: { value: s.name } })}
                      style={{
                        padding: '4px 8px', fontSize: '11px', borderRadius: '12px', border: '1px solid var(--card-border)',
                        backgroundColor: formData.locationName === s.name ? 'var(--primary)' : 'var(--bg-color)',
                        color: formData.locationName === s.name ? '#fff' : 'var(--text-main)', cursor: 'pointer'
                      }}
                    >
                      {s.name.split(',')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label style={{ color: 'var(--text-main)' }}>What's your intent?</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select name="intent" value={formData.intent} onChange={handleChange} style={{ flex: 1 }}>
                    <option value="food">Get Food</option>
                    <option value="washroom">Washroom</option>
                    <option value="seat">Find Seat / Main Stage</option>
                    <option value="explore">Explore</option>
                    <option value="exit">Exit Stadium</option>
                    <option value="emergency">Emergency</option>
                  </select>

                  <button
                    type="button"
                    onClick={startVoiceInput}
                    title="Voice Command"
                    aria-label="Start Voice Command"
                    role="button"
                    tabIndex="0"
                    style={{
                      padding: '10px',
                      width: '44px',
                      height: '44px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: isListening ? '#e11d48' : 'var(--bg-color)',
                      border: isListening ? '1px solid #e11d48' : '1px solid var(--card-border)',
                      borderRadius: '6px',
                      transition: 'all 0.2s',
                      fontSize: '18px'
                    }}
                  >
                    🎙️
                  </button>

                  <button
                    type="button"
                    onClick={handleFindFriends}
                    title="Find Friends Rendezvous"
                    aria-label="Find Friends Rendezvous"
                    role="button"
                    tabIndex="0"
                    style={{
                      padding: '10px',
                      width: '44px',
                      height: '44px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: '#3b82f6',
                      border: '1px solid #2563eb',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '18px'
                    }}
                  >
                    🧑‍🤝‍🧑
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label style={{ color: 'var(--text-main)' }}>AI Routing Preference</label>
                <select name="preference" value={formData.preference} onChange={handleChange}>
                  <option value="balanced">Balanced (Recommended)</option>
                  <option value="least_crowded">Least Crowded (Avoid People)</option>
                  <option value="fastest">Fastest (Direct Line)</option>
                </select>
              </div>

              <div className="form-group">
                <label style={{ color: 'var(--text-main)' }}>Time Phase</label>
                <select name="time" value={formData.time} onChange={handleChange}>
                  <option value="before match">Before Match</option>
                  <option value="live">Live (During Match)</option>
                  <option value="halftime">Halftime</option>
                  <option value="end">End of Match</option>
                </select>
              </div>

              <button type="submit" disabled={loading}>
                {loading ? 'Analyzing Routes...' : 'Get Smart Route 🚀'}
              </button>
            </form>
          </aside>
        )}

        {/* MAIN AREA */}
        <main className="main-area">
          <div className="map-wrapper">
            <div className="map-container">
              <StadiumMap
                isLoaded={isLoaded}
                loadError={loadError}
                center={{ lat: formData.lat, lng: formData.lng }}
                activeZones={activeZones}
                crowdData={crowdData}
                route={decision?.primary_route || []}
                alternateRoute={decision?.alternate_route || []}
                isEmergencyMode={isEmergencyMode}
                theme={theme}
                friends={friends}
              />
            </div>
          </div>

          {/* AI PANEL (BOTTOM) */}
          {decision && (
            <div className="bottom-panel">
              {predictiveAlert && (
                <div className="predictive-alert">
                  <div className="predictive-alert-icon">⚠️</div>
                  <div className="predictive-alert-content">
                    <h4 style={{ color: 'var(--warning)' }}>Predictive Alert Triggered</h4>
                    <p style={{ color: 'var(--text-main)' }}>{predictiveAlert.message} <strong>Auto-rerouting you to a safer path.</strong></p>
                  </div>
                </div>
              )}

              <div className="ai-header">
                <h2>AI Decision Engine</h2>
                <span className={`priority-badge ${decision.priority?.toLowerCase()}`}>
                  {decision.priority} PRIORITY
                </span>
              </div>
              <div className="decision-panel">
                <div dangerouslySetInnerHTML={{ __html: decision.message }} className="ai-message" style={{ color: 'var(--text-main)' }}></div>

                {decision.explanation && (
                  <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'rgba(245, 158, 11, 0.05)', borderLeft: '3px solid var(--primary)', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                    💡 <strong>AI Reasoning:</strong> {decision.explanation}
                  </div>
                )}

                {decision.primary_route && decision.primary_route.length > 0 && (
                  <div className="route-container" style={{ marginTop: '12px' }}>
                    <strong>Primary Path:</strong>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                      {decision.primary_route.map((node, idx) => (
                        <React.Fragment key={idx}>
                          <span className="route-tag" style={{ backgroundColor: '#e11d48', color: '#ffffff', padding: '4px 8px', borderRadius: '4px' }}>{node.name || 'Point'}</span>
                          {idx < decision.primary_route.length - 1 && <span className="route-arrow">➔</span>}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}

                {decision.alternate_route && decision.alternate_route.length > 0 && (
                  <div className="route-container" style={{ marginTop: '12px', opacity: 0.8 }}>
                    <strong>Alternate Path:</strong>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                      {decision.alternate_route.map((node, idx) => (
                        <React.Fragment key={idx}>
                          <span className="route-tag" style={{ backgroundColor: '#3f3f46', color: '#ffffff', padding: '4px 8px', borderRadius: '4px' }}>{node.name || 'Point'}</span>
                          {idx < decision.alternate_route.length - 1 && <span className="route-arrow">➔</span>}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}

                <div className="ai-reason" style={{ marginTop: '12px', color: 'var(--text-main)' }}>
                  <strong>Why?</strong> {decision.reason}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
