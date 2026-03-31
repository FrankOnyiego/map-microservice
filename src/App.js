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
const transporterIcon = L.divIcon({
  html: `
    <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" fill="green" viewBox="0 0 16 16">
      <path d="M0 3.5A1.5 1.5 0 0 1 1.5 2h9A1.5 1.5 0 0 1 12 3.5V5h1.02a1.5 1.5 0 0 1 1.17.563l1.481 1.85a1.5 1.5 0 0 1 .329.938V10.5a1.5 1.5 0 0 1-1.5 1.5H14a2 2 0 1 1-4 0H5a2 2 0 1 1-3.998-.085A1.5 1.5 0 0 1 0 10.5zm1.294 7.456A2 2 0 0 1 4.732 11h5.536a2 2 0 0 1 .732-.732V3.5a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5v7a.5.5 0 0 0 .294.456M12 10a2 2 0 0 1 1.732 1h.768a.5.5 0 0 0 .5-.5V8.35a.5.5 0 0 0-.11-.312l-1.48-1.85A.5.5 0 0 0 13.02 6H12zm-9 1a1 1 0 1 0 0 2 1 1 0 0 0 0-2m9 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2"/>
    </svg>
  `,
  className: "",
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
const meIcon = L.divIcon({
  html: `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="blue" viewBox="0 0 16 16"
         style="stroke:black; stroke-width:0.4; filter: drop-shadow(0px 2px 3px rgba(0,0,0,0.5));">
      <path d="M8 3a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3"/>
      <path d="M6 6.75v8.5a.75.75 0 0 0 1.5 0V10.5a.5.5 0 0 1 1 0v4.75a.75.75 0 0 0 1.5 0v-8.5a.25.25 0 1 1 .5 0v2.5a.75.75 0 0 0 1.5 0V6.5a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v2.75a.75.75 0 0 0 1.5 0v-2.5a.25.25 0 0 1 .5 0"/>
    </svg>
  `,
  className: "",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -35],
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
  const [uid, setUid] = useState(null);

useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  setUid(params.get("uid"));
}, []);

 useEffect(() => {
    if (!uid) return;

    // Listen to updates for this user directly
    const q = query(
      collection(db, "userBackgroundUpdates"),
      where("userId", "in", [uid, String(uid)])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.location && data.location.latitude != null && data.location.longitude != null) {
          setCurrentLocation([data.location.latitude, data.location.longitude]);
          setSpeedKmh(parseFloat(data.location.speed) || 0);
        }
      });
    });

    // Clean up listener on unmount or uid change
    return () => unsubscribe();
  }, [uid]);

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
    const otherUsers = cityUsers.filter(user => user.userId !== uid);
  return (
    <MapContainer
      center={currentLocation}
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
      {city && otherUsers.length > 0 ? (
        <>
<FitBounds
  points={[
    ...otherUsers.map(u =>
      u.latitude && u.longitude ? [u.latitude, u.longitude] : null
    ),
    currentLocation
  ].filter(Boolean)}
/>
          {otherUsers.map((user, i) =>
            user.latitude && user.longitude ? (
              <Marker
                key={i}
                position={[user.latitude, user.longitude]}
                icon={getIconByRole(user.role || user.userRole)}
              >

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
      {uid && currentLocation && (
  <Marker position={currentLocation} icon={meIcon}>
    <Tooltip permanent direction="right">You</Tooltip>

    <Popup>
      <b>Your current location.</b> <br />
    </Popup>
  </Marker>
)}
    </MapContainer>
  );
}

export default App;