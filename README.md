# KSP DRISTI - Conversational Intelligence & Crime Analytics Platform

A production-ready, full-stack crime intelligence command center. The solution comprises a responsive **Next.js 14+ Web Command Dashboard** and a native **Flutter Mobile Companion App**, both querying a relational datastore parsed directly from the real 1.6 Million row KSP CSV dataset.

---

## 🚀 Key Modules Implemented

1. **Conversational Crime Intelligence**: Voice-enabled interface using the Web Speech API (English `en-IN` & Kannada `kn-IN`) with collapsible leads drawer and 1-click PDF Dossier compilation.
2. **Criminal Network Linkages**: SVG node visualizer mapping accomplice networks and Mule bank account transaction pipelines.
3. **Spatial Patrolling & Clusters**: Live Leaflet Maps displaying crime hotspots geolocated by district.
4. **Sociological Insights**: Analysis charts mapping victim demographics (ages, occupations, religions, and castes).
5. **Habitual Offender Recidivism Gauge**: Algorithm calculating recidivism risk probabilities (0-100%) based on historical arrests.
6. **Investigator Decision Support**: Real-time actionable directives and BNS/IPC legal code suggester.
7. **Predictive Beat Patrol Generator**: Flagship module drawing optimized polyline routes connecting hot waypoints on-the-fly.
8. **Explainable AI**: Active ZCQL SQL Trace console and evidence citations logs.
9. **Role-Based Governance**: Dropdown switcher mapping Investigator, Analyst, Supervisor, and Policymaker layouts dynamically.

---

## 🛠️ Installation & Setup

### 1. Environment Configurations
Clone this repository and create your local environment file:
```bash
cp .env.example .env.local
```
Edit `.env.local` to insert your Groq API key:
```text
GROQ_API_KEY=gsk_your_actual_api_key_here
```

### 2. Parse the KSP CSV Dataset
The platform includes a Python parser script that reads the 1.6M row dataset, samples 1,200 diverse cases, resolves district offsets, and writes them into a relational JSON store:
```bash
python3 scripts/csv_parser.py
```

### 3. Run the Next.js Web Command Dashboard
Install web dependencies and launch the server:
```bash
npm install
npm run dev
```
Open `http://localhost:3000` in your web browser.

### 4. Run the Flutter Mobile App
Change directory to the mobile app sub-project, verify dependencies, and launch on a simulator/emulator:
```bash
cd ksp_mobile
flutter pub get
flutter run
```
*Note: Tap the Settings cog icon in the top right of the mobile dashboard screen to override the host API URL dynamically if testing on different networks!*

---

## 📂 Project Architecture

```text
├── public/
│   └── sample_fir_data.json      # Compiled relational crime data (JSON format)
├── resources/
│   ├── FIR_Details_Data.csv      # Raw KSP 1.6 Million row CSV dataset
│   └── Police_FIR_ER_Diagram.pdf # Expected Relational Entity Diagram
├── scripts/
│   └── csv_parser.py             # Python data sampler & entity mapper
├── src/
│   ├── app/
│   │   ├── api/chat/route.ts     # ZCQL intent builder & AI router
│   │   └── page.tsx              # Main dashboard frontend interface
│   ├── components/
│   │   ├── CrimeMap.tsx          # Geospatial hotspot & beat route map
│   │   ├── NetworkGraph.tsx      # Accomplice & transaction network builder
│   │   └── ProfilingPanel.tsx    # Offender recidivism indicators
│   └── lib/
│       ├── pdfExporter.ts        # Dossier PDF compiler
│       └── zcqlHelper.ts         # Zoho Catalyst ZCQL SQL emulation parser
└── ksp_mobile/
    ├── pubspec.yaml              # Mobile project config
    └── lib/
        ├── main.dart             # Root state management & Slate theme
        ├── services/
        │   └── api_service.dart  # Mobile-to-Server network connector
        └── screens/
            ├── dashboard_screen.dart # Home tab view controller
            ├── chat_screen.dart      # Speech-to-Text interaction portal
            ├── map_screen.dart       # Geospatial beat route plotter
            └── profiling_screen.dart # Risk profile analytics
```
