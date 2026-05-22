# SafeRoute AI — Tactical Safety Command Center & Navigation Platform

SafeRoute AI is a national-scale integrated safety command platform and tactical navigation system designed to address public place safety, harassment, and critical distress coordination in low-resource environments (e.g., low-bandwidth networks or offline states in India).

---

## 🌟 The Vision & National-Level Impact

SafeRoute AI addresses a massive, urgent problem using state-of-the-art engineering principles:
1. **Urgent India-First Crisis**: With high rates of recorded crimes against public safety, official statistics often underrepresent the lived reality. SafeRoute AI closes this gap by allowing community-led reports, incident votes, and lighting audits.
2. **Deep Technical Execution**: Rejecting simple static arrays, SafeRoute AI integrates a true mathematical safety scoring algorithm, two-way synchronized 2D/3D map engines, a real-time geohashed Socket.io room broadcaster, and localized retrieval-augmented generation (RAG) powered by Gemini 1.5 Flash.
3. **Resilience & Accessibility**: Engineered to run on 2G networks, support Twilio SMS fallback alerts, and integrate seamlessly with national emergency services (112 dispatch protocols).
4. **Wow Factor**: A stunning glassmorphic tactical command deck, WebAudio pulse alert routines, and an interactive 3D WebGL cybernetic city matrix.

---

## 📐 True Safety Scoring Formulation

Every route is evaluated server-side by checking proximity to historical incident markers. The algorithm calculates segment-level risk using this mathematical decay:

$$safetyScore = 100 - \sum \left[ severity_i \times timeDecay_i \times distanceWeight_i \times lightPenalty \right]$$

*   **Time-Decay Penalty**: Factors in the age of the incident to prevent stale warnings:
    $$timeDecay = e^{-\frac{hoursSince}{48}}$$
*   **Proximity Weighting**: Penalizes paths closer to the incident using an inverse rational function:
    $$distanceWeight = \frac{1}{1 + \frac{distanceMeters}{30}}$$
*   **Night-Low Lighting Modifier**: Applies a $1.5\times$ risk multiplier if the query occurs at night and the street segment has low streetlight density ($< 0.3$).

Based on the final score, segments are categorized into:
*   🟢 **Emerald Safe ($80 - 100$)**
*   🟡 **Orange Caution ($50 - 79$)**
*   🔴 **Crimson Avoid ($< 50$)**

---

## 🛠️ The Tech Stack

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 14 App Router (TS)** | SSR loading speed, robust routing, optimized asset streaming. |
| **2D Mapping** | **Leaflet.js + CartoDB Dark Tiles** | High performance (60fps on mobile), zero API billing friction. |
| **3D Rendering** | **React Three Fiber (R3F) + Drei** | Procedural WebGL city matrix loading extruded geometries. |
| **State Sync** | **Zustand** | Coordinates 2D hover indices with 3D glowing beacon scales instantly. |
| **Backend Core** | **Express.js (TypeScript)** | Robust event-driven API endpoints, strict Zod schema sanitizers. |
| **Database** | **MongoDB Atlas** | Geospatial indexes (`2dsphere`) to perform `$nearSphere` queries. |
| **AI Co-Navigator** | **Gemini 1.5 Flash (with Pollinations fallback)** | RAG pipeline parsing nearby database records in Hindi/English. |
| **WebSockets** | **Socket.io** | Geohashed coordinate room grouping for 2km radius SOS broadcasts. |

---

## 🏗️ Project Architecture

```
/
├── backend/                       <-- Express TS API & Socket Server
│   ├── src/
│   │   ├── config/                <-- Database & Global environment configurations
│   │   ├── middleware/            <-- Zod validation & Auth middleware
│   │   ├── models/                <-- Geospatial Mongoose schemas (Incident, SOSAlert, User)
│   │   ├── routes/                <-- Route planners, chat engines, and scoring routers
│   │   ├── server.ts              <-- App entry point & Socket geohash coordinators
│   │   └── types/                 <-- Shared typescript mappings
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/                      <-- Next.js 14 Client Dashboard
    ├── public/                    <-- Static assets & decals
    ├── src/
    │   ├── app/                   <-- Next.js App Router (Landing page & Command Dashboard)
    │   ├── components/            <-- LeafletMap, City3D Canvas, AIOrb, SafetyGauge, SOSHeartbeat
    │   ├── store/                 <-- Zustand global map coordinates synchronizer
    │   └── globals.css            <-- Neomorphic panels, glassmorphic tokens, and CSS animations
    ├── package.json
    └── tailwind.config.js
```

---

## ⚡ Setup & Launch Instructions

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Active Atlas connection string or local instance
- **Gemini API Key**: For multilingual RAG co-navigation chat

### 2. Environment Variables Setup
Configure your environment variables in both directories:

**Backend (`backend/.env`):**
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/saferoute
JWT_SECRET=your_jwt_signing_key_here
GEMINI_API_KEY=your_gemini_api_key
NODE_ENV=development
```

**Frontend (`frontend/.env.local`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 3. Installation
Install standard packages and peer-dependencies:

```bash
# Install backend packages
cd backend
npm install

# Install frontend packages (with legacy peer dependency resolution)
cd ../frontend
npm install --legacy-peer-deps
```

### 4. Running the Ecosystem
Launch the servers concurrently:

```bash
# Term 1: Start Backend Express Server
cd backend
npm run dev

# Term 2: Start Frontend Next.js Dev Client
cd frontend
npm run dev
```

Visit the dashboard directly at: **`http://localhost:3000/dashboard`**

---

## 🔒 Security & Privacy-First Policy
1. **Zero Logging Retention**: SOS coordinate broadcasts bypass permanent database tables and utilize short-term Redis/in-memory mapping. Permanent records carry a strict 24-hour TTL index purge configuration (`expiresAt`).
2. **Device Anonymization**: No Aadhaar or full-name registration is required for immediate SOS. Local browser fingerprinting hashes authorize safety votes, shielding user identity.

---

*Developed with ❤️ by the SafeRoute AI Technical Engineering Team.*
