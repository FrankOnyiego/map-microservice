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
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(coord2[0] - coord1[0]);
  const dLon = toRad(coord2[1] - coord1[1]);

  const lat1 = toRad(coord1[0]);
  const lat2 = toRad(coord2[0]);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ⏱️ Convert seconds → d:h:m:s
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
  // ✅ Defaults (Nairobi area)
  const defaultPickup = [1.2921, 36.8219];
  const defaultDropoff = [1.3521, 36.9419];
  const defaultCurrent = [1.3000, 36.8500];
  const defaultSpeedKmh = 40;

  const [pickup, setPickup] = useState(defaultPickup);
  const [dropoff, setDropoff] = useState(defaultDropoff);
  const [currentLocation, setCurrentLocation] = useState(defaultCurrent);
  const [eta, setEta] = useState(null);
  const [speed, setSpeed] = useState(null); // m/s

  // Parse query string
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const parseCoords = (param, fallback) => {
      const val = params.get(param);
      if (!val) return fallback;
      const [lat, lng] = val.split(",").map(Number);
      return [lat, lng];
    };

    setPickup(parseCoords("pickup", defaultPickup));
    setDropoff(parseCoords("dropoff", defaultDropoff));
  }, []);

  // Track live location
  useEffect(() => {
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, speed } = pos.coords;
          setCurrentLocation([latitude, longitude]);
          setSpeed(speed); // may be null
        },
        () => {
          // fallback
          setCurrentLocation(defaultCurrent);
          setSpeed(defaultSpeedKmh / 3.6); // back to m/s
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      setCurrentLocation(defaultCurrent);
      setSpeed(defaultSpeedKmh / 3.6);
    }
  }, []);

  // ETA calculation
  useEffect(() => {
    if (currentLocation && dropoff) {
      const distanceKm = haversineDistance(currentLocation, dropoff);
      const speedKmh =
        speed && speed > 0 ? speed * 3.6 : defaultSpeedKmh;

      const timeHours = distanceKm / speedKmh;
      const timeSeconds = timeHours * 3600;
      setEta(formatTime(timeSeconds));
    }
  }, [currentLocation, dropoff, speed]);

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

      <Marker position={pickup} icon={greenIcon}>
        <Tooltip permanent direction="top" offset={[0, -20]}>
          🟢 Pickup
        </Tooltip>
        <Popup>Pickup Location</Popup>
      </Marker>

      <Marker position={dropoff} icon={redIcon}>
        <Tooltip permanent direction="bottom" offset={[0, 20]}>
          🔴 Drop-off
        </Tooltip>
        <Popup>Drop-off Location</Popup>
      </Marker>

      <Marker position={currentLocation} icon={blueIcon}>
        <Tooltip permanent direction="right" offset={[20, 0]}>
          🚚 Truck{" "}
          {eta ? `- Arriving in ${eta}` : "Calculating..."}
        </Tooltip>
        <Popup>
          Current Location <br />
          Speed:{" "}
          {speed
            ? (speed * 3.6).toFixed(1) + " km/h"
            : defaultSpeedKmh + " km/h (default)"}{" "}
          <br />
          ETA: {eta || "Calculating..."}
        </Popup>
      </Marker>

      <Polyline positions={[pickup, dropoff]} color="blue" />
    </MapContainer>
  );
}

export default App;
