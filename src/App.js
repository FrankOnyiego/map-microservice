import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const FitBounds = ({ pickup, dropoff, currentLocation }) => {
  const map = useMap();
  useEffect(() => {
    const bounds = L.latLngBounds([pickup, dropoff, currentLocation]);
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [map, pickup, dropoff, currentLocation]);
  return null;
};

// ✅ Helper: parse coords from URL
const parseCoords = (param, fallback) => {
  const url = new URL(window.location.href);
  const value = url.searchParams.get(param);
  if (!value) return fallback;
  const parts = value.split(",").map(Number);
  return parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]) ? parts : fallback;
};

function App() {
  const pickup = parseCoords("pickup", [1.2921, 36.8219]);   // Default Nairobi
  const dropoff = parseCoords("dropoff", [1.3521, 36.9419]);
  const [currentLocation, setCurrentLocation] = useState(parseCoords("current", [1.3000, 36.8000]));

  // If current not in URL, fallback to geolocation
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.get("current") && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCurrentLocation([pos.coords.latitude, pos.coords.longitude]),
        () => console.warn("Geolocation failed, using default")
      );
    }
  }, []);

  return (
    <MapContainer center={currentLocation} zoom={13} style={{ height: "100vh", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds pickup={pickup} dropoff={dropoff} currentLocation={currentLocation} />

      <Marker position={pickup}>
        <Tooltip permanent direction="top" offset={[0, -10]}>📍 Pickup</Tooltip>
        <Popup>Pickup Location</Popup>
      </Marker>

      <Marker position={dropoff}>
        <Tooltip permanent direction="bottom" offset={[0, 10]}>🏁 Drop-off</Tooltip>
        <Popup>Drop-off Location</Popup>
      </Marker>

      <Marker position={currentLocation}>
        <Tooltip permanent direction="right" offset={[10, 0]}>🧍 Current</Tooltip>
        <Popup>Current Location</Popup>
      </Marker>

      <Polyline positions={[pickup, dropoff]} color="blue" />
    </MapContainer>
  );
}

export default App;
