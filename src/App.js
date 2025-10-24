import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./App.css";
import MapSpineer from "./mapSpineer";

// ✅ Role icons
const adminIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png", // 👑 Admin
  iconSize: [35, 35],
  iconAnchor: [17, 34],
  popupAnchor: [0, -28],
});

const transporterIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/743/743922.png", // 🚛 Transporter
  iconSize: [35, 35],
  iconAnchor: [17, 34],
  popupAnchor: [0, -28],
});

const supplierIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/1687/1687490.png", // 🏭 Supplier (Other)
  iconSize: [35, 35],
  iconAnchor: [17, 34],
  popupAnchor: [0, -28],
});

// ✅ Default truck icons
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

// ✅ Fit map to markers
const FitBounds = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    const valid = points.filter(Boolean);
    if (valid.length > 0) {
      const bounds = L.latLngBounds(valid);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [points, map]);
  return null;
};

// ✅ Distance formula
const haversineDistance = ([lat1, lon1], [lat2, lon2]) => {
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ✅ Convert seconds → d:h:m:s
const formatTime = (seconds) => {
  const d = Math.floor(seconds / (24 * 3600));
  seconds %= 24 * 3600;
  const h = Math.floor(seconds / 3600);
  seconds %= 3600;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${d}d:${h}h:${m}m:${s}s`;
};

function App() {
const [pickup, setPickup] = useState(null);
const [dropoff, setDropoff] = useState(null);
const [currentLocation, setCurrentLocation] = useState(null);
const [speedKmh, setSpeedKmh] = useState(null);
const [eta, setEta] = useState(null);

  const [city, setCity] = useState(null);
  const [cityUsers, setCityUsers] = useState([]);

  // ✅ Parse URL query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const parseCoords = (str) => {
      if (!str) return null;
      const parts = str.split(",").map(Number);
      return parts.length === 2 && !parts.some(isNaN) ? parts : null;
    };

    const pickupCoords = parseCoords(params.get("pickup"));
    const dropoffCoords = parseCoords(params.get("dropoff"));
    const currentCoords = parseCoords(params.get("current"));
    const speedParam = parseInt(params.get("speed"));
    const cityParam = params.get("city");
    const usersParam = params.get("users");

    if (pickupCoords) setPickup(pickupCoords);
    if (dropoffCoords) setDropoff(dropoffCoords);
    if (currentCoords) setCurrentLocation(currentCoords);
    if (!isNaN(speedParam)) setSpeedKmh(speedParam);
    if (cityParam) setCity(cityParam);

    // ✅ Decode city users if passed
    if (usersParam) {
      try {
        const decoded = JSON.parse(decodeURIComponent(usersParam));
        setCityUsers(decoded);
      } catch (e) {
        console.error("Error parsing users param:", e);
      }
    }
  }, []);

  // ✅ ETA calculation
  useEffect(() => {
    if (currentLocation && dropoff && speedKmh > 0) {
      const distanceKm = haversineDistance(currentLocation, dropoff);
      const timeHours = distanceKm / speedKmh;
      const etaStr = isFinite(timeHours)
        ? formatTime(timeHours * 3600)
        : "Took a break";
      setEta("Shipment arriving in: " + etaStr);
    } else {
      setEta("Transporter took a break");
    }
  }, [currentLocation, dropoff, speedKmh]);

  // ✅ Role-based icon
  const getIconByRole = (role) => {
    const lower = role?.toLowerCase() || "";
    if (lower === "admin") return adminIcon;
    if (lower === "transporter") return transporterIcon;
    if (lower === "other") return supplierIcon; // “Other” → Supplier
    return blueIcon;
  };

  // ✅ Safe role name display
  const getDisplayRole = (role) =>
    role?.toLowerCase() === "other" ? "Supplier" : role || "Supplier";

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

      {/* ✅ City Mode: Display users by city */}
      {city && cityUsers.length > 0 ? (
        <>
          <FitBounds
            points={cityUsers
              .map((u) =>
                u.latitude && u.longitude ? [u.latitude, u.longitude] : null
              )
              .filter(Boolean)}
          />
          {cityUsers.map((user, i) =>
            user.latitude && user.longitude ? (
              <Marker
                key={i}
                position={[user.latitude, user.longitude]}
                icon={getIconByRole(user.role || user.userRole)}
              >
                <Tooltip direction="top" permanent>
                  {getDisplayRole(user.role || user.userRole)}
                </Tooltip>
                <Popup>
                  <b>{user?.fullName || "Unknown User"}</b>
                  <br />
                  {getDisplayRole(user?.role || user?.userRole)}
                  <br />
                  Last seen: {city}
                </Popup>
              </Marker>
            ) : null
          )}
        </>
      ) : (
        <>
          {/* Spinner overlay if coordinates or speed not ready */}
          {(!pickup || !dropoff || !currentLocation) && <MapSpineer />}
          
          {pickup && dropoff && currentLocation&& (
              <>
                <FitBounds points={[pickup, dropoff, currentLocation]} />

                <Marker position={pickup} icon={greenIcon}>
                  <Tooltip permanent direction="top">🟢 Pickup Location</Tooltip>
                </Marker>

                <Marker position={dropoff} icon={redIcon}>
                  <Tooltip permanent direction="bottom">🔴 Drop-off Location</Tooltip>
                </Marker>

                <Marker position={currentLocation} icon={blueIcon}>
                  <Tooltip permanent direction="right">
                    🚚 Truck {eta ? `- ${eta}` : "Calculating..."}
                  </Tooltip>
                  <Popup>
                    Truck Location <br />
                    Speed: {speedKmh.toFixed(1)} km/h <br />
                    ETA: {eta || "Calculating..."}
                  </Popup>
                </Marker>
              </>
            )}
        </>
      )}
    </MapContainer>
  );
}

export default App;
