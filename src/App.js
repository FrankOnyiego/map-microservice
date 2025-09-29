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

// ✅ Custom icons
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

// Fit map to all markers
const FitBounds = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (points.filter(Boolean).length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [points, map]);
  return null;
};

// Haversine distance
function haversineDistance([lat1, lon1], [lat2, lon2]) {
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Convert seconds → d:h:m:s
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
  // Defaults
  const defaultPickup = [1.2921, 36.8219];
  const defaultDropoff = [1.3521, 36.9419];
  const defaultCurrent = [1.3000, 36.8500];
  const defaultSpeedKmh = 80;

  const [pickup, setPickup] = useState(defaultPickup);
  const [dropoff, setDropoff] = useState(defaultDropoff);
  const [currentLocation, setCurrentLocation] = useState(defaultCurrent);
  const [speedKmh, setSpeedKmh] = useState(defaultSpeedKmh);
  const [eta, setEta] = useState(null);

  // ✅ Parse query params directly from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const parseCoords = (str) => {
      if (!str) return null;
      const parts = str.split(",").map(Number);
      if (parts.length === 2 && !parts.some(isNaN)) {
        return parts;
      }
      return null;
    };

    const pickupCoords = parseCoords(params.get("pickup"));
    const dropoffCoords = parseCoords(params.get("dropoff"));
    const currentCoords = parseCoords(params.get("current"));
    const speedParam = parseInt(params.get("speed")); // ✅ parse speed as float

    if (pickupCoords) setPickup(pickupCoords);
    if (dropoffCoords) setDropoff(dropoffCoords);
    if (currentCoords) setCurrentLocation(currentCoords);
    if (!isNaN(speedParam)) setSpeedKmh(speedParam);;
  }, []);

  // ✅ ETA calculation
// ✅ ETA calculation
useEffect(() => {
  if (currentLocation && dropoff && speedKmh > 0) {
    const distanceKm = haversineDistance(currentLocation, dropoff);
    const timeHours = distanceKm / speedKmh;
    const etaStr = isFinite(timeHours) ? formatTime(timeHours * 3600) : "Took a break";
    setEta("Shipment arriving in: "+etaStr);
  } else {
    setEta("Transporter took a break"); // speed is 0 or invalid
  }
}, [currentLocation, dropoff, speedKmh]);


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

      <FitBounds points={[pickup, dropoff, currentLocation]} />

      <Marker position={pickup} icon={greenIcon}>
        <Tooltip permanent direction="top">
          🟢 Pickup
        </Tooltip>
        <Popup>Pickup Location</Popup>
      </Marker>

      <Marker position={dropoff} icon={redIcon}>
        <Tooltip permanent direction="bottom">
          🔴 Drop-off
        </Tooltip>
        <Popup>Drop-off Location</Popup>
      </Marker>

      <Marker position={currentLocation} icon={blueIcon}>
        <Tooltip permanent direction="right">
          🚚 Truck {eta ? `- ${eta}` : "Calculating..."}
        </Tooltip>
        <Popup>
          Current Location <br />
          Speed: {speedKmh.toFixed(1)} km/h <br />
          ETA: {eta || "Calculating..."}
        </Popup>
      </Marker>

      <Polyline positions={[pickup, currentLocation, dropoff]} color="blue" />
    </MapContainer>
  );
}

export default App;
