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
import { collection, query, where, onSnapshot, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "./firebase"; // adjust path if needed

// ✅ Role icons
const adminIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
  iconSize: [35, 35],
  iconAnchor: [17, 34],
  popupAnchor: [0, -28],
});
const transporterIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/743/743922.png",
  iconSize: [35, 35],
  iconAnchor: [17, 34],
  popupAnchor: [0, -28],
});
const supplierIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/1687/1687490.png",
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
      map.fitBounds(bounds, { padding: [50, 50],  maxZoom: 12 });
    }
  }, [points, map]);
  return null;
};

// ✅ Haversine distance
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
  const [cityBounds, setCityBounds] = useState(null);

  // ✅ Parse URL params
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

    if (pickupCoords) setPickup(pickupCoords);
    if (dropoffCoords) setDropoff(dropoffCoords);
    if (currentCoords) setCurrentLocation(currentCoords);
    if (!isNaN(speedParam)) setSpeedKmh(speedParam);
    if (cityParam) setCity(cityParam);
  }, []);


  // ✅ Geocode city if provided (and no users or coords)
  useEffect(() => {
    if (city && cityUsers.length === 0 && !pickup && !dropoff && !currentLocation) {
      const fetchCityBounds = async () => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(
              city
            )}&format=json&limit=1`
          );
          const data = await res.json();
          if (data && data[0]) {
            const { lat, lon, boundingbox } = data[0];
            const bounds = [
              [parseFloat(boundingbox[0]), parseFloat(boundingbox[2])],
              [parseFloat(boundingbox[1]), parseFloat(boundingbox[3])],
            ];
            setCityBounds(bounds);
            setCurrentLocation([parseFloat(lat), parseFloat(lon)]);
          }
        } catch (err) {
          console.error("Failed to geocode city:", err);
        }
      };
      fetchCityBounds();
    }
  }, [city, cityUsers, pickup, dropoff, currentLocation]);

  //get the users in the city
  useEffect(() => {
  if (!city) return;

  const updatesRef = collection(db, "userBackgroundUpdates");
  const q = query(updatesRef, where("location.city", "==", city));

  const unsubscribe = onSnapshot(q, async (snapshot) => {

    const usersList = await Promise.all(
      snapshot.docs.map(async (docSnap) => {

        const data = docSnap.data();

        if (!data.userId) return null;

        // 🔥 Get user profile
        const userRef = doc(db, "users", data.userId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) return null;

        const userData = userDoc.data();

        const role = userData.role?.toLowerCase() || "";
        const userRole = userData.userRole?.toLowerCase() || "";

        if (role !== "transporter" && userRole !== "transporter")
          return null;

        // 🔥 Get rating
        const reviewsRef = collection(db, "reviews");
        const reviewsQ = query(
          reviewsRef,
          where("DriverRecievingTheRating", "==", data.userId)
        );

        const reviewsSnap = await getDocs(reviewsQ);

        let averageRating = 0;

        if (!reviewsSnap.empty) {
          let total = 0;

          reviewsSnap.forEach((r) => {
            const rd = r.data();
            if (rd.rating) total += rd.rating;
          });

          averageRating = total / reviewsSnap.size;
        }

        return {
          userId: data.userId,
          city: data.location?.city || "",
          latitude: data.location?.latitude || 0,
          longitude: data.location?.longitude || 0,
          speed: data.location?.speed || 0,
          fullName: userData.fullName || "",
          phone: userData.phone || "",
          vehicleType: userData.vehicleType || "",
          vehicleNumber: userData.vehicleNumber || "",
          role: userData.role || "",
          userRole: userData.userRole || "",
          rating: averageRating || 0,
        };
      })
    );

    const cleanUsers = usersList.filter(Boolean);
    setCityUsers(cleanUsers);
  });

  return () => unsubscribe();

}, [city]);

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
    if (lower === "other") return supplierIcon;
    return blueIcon;
  };
  const getDisplayRole = (role) =>
    role?.toLowerCase() === "other" ? "Supplier" : role || "Supplier";

  return (
    <MapContainer
      center={currentLocation || [0, 0]}
      zoom={cityBounds ? 6 : 5}
      style={{ height: "100vh", width: "100%" }}
    >

    <TileLayer
      attribution='© Bridgeway Supply Chain'
    url={`https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=QdJadrKmMo3jQGFPxUBf`}
    />

      {/* ✅ City bounds */}
      {cityBounds && <FitBounds points={cityBounds} />}

      {/* ✅ City mode with users */}
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
                  {city}
                  <br />
                  {user?.vehicleType}
                </Popup>
              </Marker>
            ) : null
          )}
        </>
      ) : (
        <>
          {/* ✅ Spinner overlay */}
          {(!pickup && !dropoff && !currentLocation) && <MapSpineer />}

          {pickup && dropoff && currentLocation && (
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
                  Speed: {speedKmh?.toFixed(1)} km/h <br />
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