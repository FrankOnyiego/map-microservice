import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./App.css"; // 👈 custom styles here

// ✅ Custom marker icons
const greenIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const redIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const blueIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Fit map to show all markers
const FitBounds = ({ pickup, dropoff, currentLocation }) => {
  const map = useMap();
  useEffect(() => {
    const bounds = L.latLngBounds([pickup, dropoff, currentLocation]);
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [map, pickup, dropoff, currentLocation]);
  return null;
};

function App({ pickup = [1.2921, 36.8219], dropoff = [1.3521, 36.9419] }) {
  const [currentLocation, setCurrentLocation] = useState([1.3000, 36.8000]);

  useEffect(() => {
    if (navigator.geolocation) {
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

      {/* 🟢 Pickup marker */}
      <Marker position={pickup} icon={greenIcon}>
        <Tooltip permanent direction="top" offset={[0, -10]} className="tooltip-green">
          📍 Pickup
        </Tooltip>
        <Popup>Pickup Location</Popup>
      </Marker>

      {/* 🔴 Dropoff marker */}
      <Marker position={dropoff} icon={redIcon}>
        <Tooltip permanent direction="bottom" offset={[0, 10]} className="tooltip-red">
          🏁 Drop-off
        </Tooltip>
        <Popup>Drop-off Location</Popup>
      </Marker>

      {/* 🔵 Current location marker */}
      <Marker position={currentLocation} icon={blueIcon}>
        <Tooltip permanent direction="right" offset={[10, 0]} className="tooltip-blue">
          🧍 Current
        </Tooltip>
        <Popup>Current Location</Popup>
      </Marker>

      <Polyline positions={[pickup, dropoff]} color="blue" />
    </MapContainer>
  );
}

export default App;