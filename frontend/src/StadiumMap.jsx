import React, { useState, useMemo } from 'react';
import { GoogleMap, Marker, Polyline, InfoWindow, HeatmapLayerF } from '@react-google-maps/api';

const mapContainerStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '12px',
};

const getCrowdColor = (level, theme = 'dark') => {
    switch (level) {
        case 'low': return '#22c55e'; /* Green 500 */
        case 'medium': return '#facc15'; /* Yellow */
        case 'high': return '#f97316'; /* Orange */
        case 'critical': return '#dc2626'; /* Red */
        default: return '#f59e0b'; /* Amber */
    }
};

const StadiumMap = ({ isLoaded, loadError, center, activeZones, crowdData, route, alternateRoute, isEmergencyMode, theme, friends = [] }) => {
    const [selectedZone, setSelectedZone] = useState(null);

    // Build coordinates array based on active route from the AI Engine
    // The route is now expected to be an array of standard objects: [{name: "X", lat: 10, lng: 10}, ...]
    const polylinePath = useMemo(() => {
        if (!route || route.length === 0) return [];
        return route.map(point => ({ lat: Number(point.lat), lng: Number(point.lng) })).filter(p => !isNaN(p.lat) && !isNaN(p.lng));
    }, [route]);

    const polylineAlternatePath = useMemo(() => {
        if (!alternateRoute || alternateRoute.length === 0 || isEmergencyMode) return [];
        return alternateRoute.map(point => ({ lat: Number(point.lat), lng: Number(point.lng) })).filter(p => !isNaN(p.lat) && !isNaN(p.lng));
    }, [alternateRoute, isEmergencyMode]);

    const heatmapData = useMemo(() => {
        if (!activeZones || !window?.google?.maps?.LatLng) return [];
        const weights = {
            'low': 0.5,
            'medium': 2,
            'high': 5,
            'critical': 10
        };
        return activeZones.map(zone => {
            const level = crowdData[zone.name] || zone.level || 'low';
            return {
                location: new window.google.maps.LatLng(Number(zone.lat), Number(zone.lng)),
                weight: weights[level] || 0
            };
        });
    }, [activeZones, crowdData]);

    if (loadError) return <div className="map-fallback" style={{ color: 'var(--text-main)' }}>Error loading Google Maps script</div>;
    
    if (!isLoaded || !center.lat) return <div className="map-fallback" style={{ color: 'var(--text-main)' }}>Loading Global Stadium Maps...</div>;

    const options = {
        disableDefaultUI: true,
        zoomControl: true,
        styles: theme === 'light' ? [] : [
            { elementType: "geometry", stylers: [{ color: "#09090b" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#09090b" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#a1a1aa" }] },
            {
                featureType: "administrative.locality",
                elementType: "labels.text.fill",
                stylers: [{ color: "#f59e0b" }],
            },
            {
                featureType: "road",
                elementType: "geometry",
                stylers: [{ color: "#18181b" }],
            },
            {
                featureType: "road",
                elementType: "geometry.stroke",
                stylers: [{ color: "#27272a" }],
            },
        ],
    };

    return (
        <GoogleMap
            mapContainerStyle={mapContainerStyle}
            zoom={18}
            center={center}
            options={options}
        >
            {/* Render the Master Start Marker */}
            <Marker 
                position={center} 
                icon={{
                    path: window.google.maps.SymbolPath.CIRCLE,
                    fillColor: '#f59e0b',
                    fillOpacity: 1,
                    strokeWeight: 2,
                    strokeColor: '#ffffff',
                    scale: 10,
                }}
                title="Your Current Location"
            />

            {/* Render Map Markers for Dynamically Generated Nearby Zones */}
            {activeZones && activeZones.map((zone, idx) => {
                const isRouteEnd = route && route[route.length - 1]?.name === zone.name;
                
                // Base colors - Zones use crowd data, others use default
                const level = crowdData[zone.name] || zone.level;
                const markerColor = level ? getCrowdColor(level, theme) : '#f59e0b';

                return (
                    <Marker
                        key={idx}
                        position={{ lat: Number(zone.lat), lng: Number(zone.lng) }}
                        onClick={() => setSelectedZone({ name: zone.name, level: level || 'N/A', lat: Number(zone.lat), lng: Number(zone.lng) })}
                        icon={{
                            path: window.google.maps.SymbolPath.CIRCLE,
                            fillColor: markerColor,
                            fillOpacity: 1,
                            strokeWeight: isRouteEnd ? 3 : 1,
                            strokeColor: isRouteEnd ? '#e11d48' : '#3f3f46',
                            scale: isRouteEnd ? 12 : 9,
                        }}
                    />
                );
            })}

            {/* Render Heatmap Layer Overlay */}
            {heatmapData.length > 0 && (
                <HeatmapLayerF
                    data={heatmapData}
                    options={{
                        radius: 50,
                        opacity: 0.6,
                        gradient: [
                            'rgba(0, 255, 255, 0)',
                            'rgba(34, 197, 94, 1)',   // Green
                            'rgba(250, 204, 21, 1)',   // Yellow
                            'rgba(249, 115, 22, 1)',  // Orange
                            'rgba(220, 38, 38, 1)'    // Red
                        ]
                    }}
                />
            )}

            {/* Render Friend Markers */}
            {friends && friends.length > 0 && friends.map((friend, idx) => (
                <Marker 
                    key={`friend-${idx}`}
                    position={{ lat: Number(friend.lat), lng: Number(friend.lng) }} 
                    title={friend.id}
                    icon={{
                        path: window.google.maps.SymbolPath.CIRCLE,
                        fillColor: '#3b82f6',
                        fillOpacity: 1,
                        strokeWeight: 3,
                        strokeColor: '#ffffff',
                        scale: 8,
                    }}
                />
            ))}

            {/* Render AI Suggested Alternate Route */}
            {polylineAlternatePath.length > 0 && !isEmergencyMode && (
                <Polyline
                    path={polylineAlternatePath}
                    options={{
                        strokeColor: '#71717a', // Zinc 500 for alternate route
                        strokeOpacity: 0.8,
                        strokeWeight: 4,
                        geodesic: true
                    }}
                />
            )}

            {/* Render AI Suggested Primary Route */}
            {polylinePath.length > 0 && (
                <Polyline
                    path={polylinePath}
                    options={{
                        strokeColor: isEmergencyMode ? '#ff0000' : '#e11d48', // Bright red if emergency, otherwise crimson
                        strokeOpacity: isEmergencyMode ? 1 : 0.9,
                        strokeWeight: isEmergencyMode ? 9 : 7,
                        geodesic: true
                    }}
                />
            )}

            {/* Info Window on Marker Click */}
            {selectedZone && (
                <InfoWindow
                    position={{ lat: selectedZone.lat, lng: selectedZone.lng }}
                    onCloseClick={() => setSelectedZone(null)}
                >
                    <div style={{ color: '#000', padding: '4px' }}>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '14px' }}>{selectedZone.name}</h4>
                        {selectedZone.level !== 'N/A' && (
                            <p style={{ margin: 0, fontSize: '12px' }}>
                                Crowd Level: <strong style={{ color: getCrowdColor(selectedZone.level) }}>{selectedZone.level.toUpperCase()}</strong>
                            </p>
                        )}
                    </div>
                </InfoWindow>
            )}
        </GoogleMap>
    );
};

export default StadiumMap;
