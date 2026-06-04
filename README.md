# Mr Truck — Map Microservice

A React-based map microservice for the Mr Truck logistics platform. Displays real-time truck locations, routes, and transporter listings using OpenStreetMap — no Google Maps billing required.

Deployed on Vercel and embedded inside the main Mr Truck mobile app as a WebView.

---

## Project Structure

```
mr-truck-dependancies/
├── public/
│   ├── index.html          # HTML shell — sets page title "Mr Truck"
│   ├── manifest.json       # PWA manifest
│   ├── logo.jpg            # App icon (also used as Apple touch icon)
│   └── favicon.ico
│
├── src/
│   ├── App.js              # Main component — all map logic lives here
│   ├── App.css             # Styles for the map, spinner, and compass widget
│   ├── App.test.js         # Placeholder test file
│   │
│   ├── firebase.js         # Firebase app init — exports `auth` and `db`
│   ├── CityUsersPanel.js   # Side panel listing transporters in a city (currently hidden)
│   ├── mapSpineer.js       # Full-screen loading spinner overlay
│   │
│   ├── index.js            # React entry point — mounts <App /> into #root
│   ├── index.css           # Global base styles
│   ├── logo.svg            # Create React App default logo (unused)
│   ├── reportWebVitals.js  # CRA performance reporting (unused)
│   ├── setupTests.js       # Jest/Testing Library setup
│   └── .env                # Local env vars (not committed)
│
├── vercel.json             # Vercel deployment config (build command, output dir)
├── package.json
└── package-lock.json
```

---

## How It Works

The app is a single full-screen map. It reads everything it needs from the URL query string and from Firebase Firestore in real time.

### URL Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `uid` | Logged-in user's Firebase UID | `?uid=abc123` |
| `pickup` | Pickup coordinates | `pickup=-1.28,36.82` |
| `dropoff` | Drop-off coordinates | `dropoff=-1.30,36.85` |
| `speed` | Truck speed in km/h (fallback) | `speed=60` |
| `city` | City name for transporter listing | `city=Nairobi` |

When `city` is provided, the map switches to **city mode** — it shows all transporters in that city pulled live from Firestore.

When `pickup` + `dropoff` are provided, the map switches to **trip mode** — it shows the route markers and a live ETA based on the truck's real-time location.

### Firebase Firestore Collections

| Collection | Purpose |
|------------|---------|
| `userBackgroundUpdates` | Real-time location, speed, and city for each user |
| `users` | User profile — name, role, vehicle type, phone |

### Map Modes

**Trip mode** (`pickup` + `dropoff` in URL):
- Green marker = pickup location
- Red marker = drop-off location
- Blue marker = truck's live location (updates from Firestore)
- Blue person icon = the viewing user's own position
- Live ETA calculated from Haversine distance ÷ current speed

**City mode** (`city` in URL):
- Shows all transporters in that city as truck icons on the map
- Tapping a marker shows the transporter's name, vehicle type, and city
- Map auto-fits bounds to show all transporters

### Compass & Direction Detection

A compass widget sits in the top-right corner of the map. On mobile:
- Reads the device's compass heading via the `DeviceOrientationEvent` API
- Rotates the map so the direction the phone faces is always at the top (heading-up mode)
- The red needle on the compass always points to true North
- On iOS 13+, tap the compass widget to grant orientation permission

---

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `react-leaflet` + `leaflet` | Map rendering using OpenStreetMap tiles |
| `leaflet-rotate` | Enables compass-driven map rotation |
| `firebase` | Firestore real-time location updates + Firebase Auth |

---

## Environment Variables

Create `src/.env` with:

```
REACT_APP_AUTO_LOGIN_EMAIL=your@email.com
REACT_APP_AUTO_LOGIN_PASSWORD=yourpassword
```

These are used to auto-login the map viewer so it can read Firestore data without the user having to sign in manually.

---

## Local Development

```bash
npm install
npm start        # dev server at http://localhost:3000
```

## Deployment

```bash
npm run build
vercel deploy --prod   # run from project root, not from build/
```

The `vercel.json` at the project root configures the build command and output directory so Vercel doesn't need to guess the framework.
