import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Tooltip,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./App.css";

// ✅ Custom marker icons
const greenIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const redIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const blueIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Fit map to show all markers
const FitBounds = ({ pickup, dropoff, currentLocation }) => {
  const map = useMap();
  useEffect(() => {
    if (pickup && dropoff && currentLocation) {
      const bounds = L.latLngBounds([pickup, dropoff, currentLocation]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, pickup, dropoff, currentLocation]);
  return null;
};

// 🧮 Haversine distance between two [lat, lng] points in km
function haversineDistance(coord1, coord2) {
  const R = 6371; // radius of Earth in km
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(coord2[0] - coord1[0]);
  const dLon = toRad(coord2[1] - coord1[1]);

  const lat1 = toRad(coord1[0]);
  const lat2 = toRad(coord2[0]);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) *
      Math.sin(dLon / 2) *
      Math.cos(lat1) *
      Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // distance in km
}

// ⏱️ Convert seconds → days:hours:minutes:seconds
function formatTime(seconds) {
  const d = Math.floor(seconds / (24 * 3600));
  seconds %= 24 * 3600;
  const h = Math.floor(seconds / 3600);
  seconds %= 3600;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);

  return `${d}d:${h}h:${m}m:${s}s`;
}

function App() {
  const [pickup, setPickup] = useState(null);
  const [dropoff, setDropoff] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [eta, setEta] = useState(null);
  const [speed, setSpeed] = useState(null); // m/s from device

  // Load pickup/dropoff from query
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const parseCoords = (param) => {
      const val = params.get(param);
      if (!val) return null;
      const [lat, lng] = val.split(",").map(Number);
      return [lat, lng];
    };

    setPickup(parseCoords("pickup") || [1.2921, 36.8219]);
    setDropoff(parseCoords("dropoff") || [1.3521, 36.9419]);
  }, []);

  // Track live location & speed from device
  useEffect(() => {
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, speed } = pos.coords;
          setCurrentLocation([latitude, longitude]);
          setSpeed(speed); // may be null
        },
        (err) => console.error("GPS error:", err),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  // Calculate ETA
  useEffect(() => {
    if (currentLocation && dropoff) {
      const distanceKm = haversineDistance(currentLocation, dropoff);

      let speedKmh;
      if (speed && speed > 0) {
        speedKmh = speed * 3.6; // m/s → km/h
      } else {
        speedKmh = 40; // fallback if no device speed
      }

      const timeHours = distanceKm / speedKmh;
      const timeSeconds = timeHours * 3600;
      setEta(formatTime(timeSeconds));
    }
  }, [currentLocation, dropoff, speed]);

  if (!pickup || !dropoff || !currentLocation) {
    return <div>Loading map...</div>;
  }

  return (
    <MapContainer
      center={currentLocation}
      zoom={13}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FitBounds
        pickup={pickup}
        dropoff={dropoff}
        currentLocation={currentLocation}
      />

      {/* 🟢 Pickup marker (North) */}
      <Marker position={pickup} icon={greenIcon}>
        <Tooltip permanent direction="top" offset={[0, -20]}>
          🟢 Pickup
        </Tooltip>
        <Popup>Pickup Location</Popup>
      </Marker>

      {/* 🔴 Dropoff marker (South) */}
      <Marker position={dropoff} icon={redIcon}>
        <Tooltip permanent direction="bottom" offset={[0, 20]}>
          🔴 Drop-off
        </Tooltip>
        <Popup>Drop-off Location</Popup>
      </Marker>

      {/* 🚚 Current location (East) */}
      <Marker position={currentLocation} icon={blueIcon}>
        <Tooltip permanent direction="right" offset={[20, 0]}>
          🚚 Truck {eta ? `-Arriving in  ${eta}` : "Calculating..."}
        </Tooltip>
        <Popup>
          Current Location <br />
          Speed: {speed ? (speed * 3.6).toFixed(1) + " km/h" : "N/A"} <br />
          ETA: {eta || "Calculating..."}
        </Popup>
      </Marker>

      {/* Line from pickup → dropoff */}
      <Polyline positions={[pickup, dropoff]} color="blue" />
    </MapContainer>
  );
}

export default App;
