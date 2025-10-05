# KSP DRISTI - Wireframe Layouts & UI Mockups

This document outlines the detailed user interface wireframes and structural layouts for both the **Next.js Web Command Center** and the **Flutter Mobile Companion App**.

---

## 💻 1. Web Command Dashboard Wireframe

The dashboard implements a modular grid layout with a collapsible sidebar, an interactive main map panel, an explainable SQL terminal, and a dynamic contextual intelligence drawer.

```text
+-----------------------------------------------------------------------------------------------+
| 👮 KSP DRISTI - WEB COMMAND CENTER                                           [Time: 19:25:52] |
+------------+----------------------------------------------------------+-----------------------+
|  [NAV]     |                   [INTERACTIVE MAP CANVAS]               |  [CONTEXT DRAWER] (X) |
|            |                                                          |                       |
|  Dashboard |      (Hotspot Cluster: Hebbal - 42 Cases)                |  • SUGGESTED ACTS:    |
|  AI Chat   |                                                          |    - BNS Sec. 325     |
|  Map       |                * [Animal Cruelty Marker]                 |    - PCA Act Sec. 11  |
|  Network   |                                                          |                       |
|  Analytics |      ======================== (Optimized Beat Polyline)  |  • ACTION LEADS:      |
|  Reports   |                                                          |    1. Secure CCTV     |
|  Settings  |                                                          |    2. Call Vet Office |
|            |                                                          |    3. Trace KYC of IP |
+------------+----------------------------------------------------------+-----------------------+
|  [EXPLAINABLE XAI CONSOLE]                                                                    |
|  ZCQL Trace Logs: SELECT * FROM CaseMaster JOIN Unit ON ... WHERE PoliceStationID = '1410'     |
+-----------------------------------------------------------------------------------------------+
```

---

## 🎙️ 2. Conversational AI Portal Wireframe

This interface supports multi-lingual voice transcription, conversational parameter analysis, and database reference citations.

```text
+-----------------------------------------------------------------------------------------------+
| 👮 KSP DRISTI - CONVERSATIONAL AI ASSISTANT                                                   |
+------------+----------------------------------------------------------------------------------+
|  [NAV]     |  User: "Show details for the Hebbal animal abuse suspect"                       |
|            |  AI Summary: "Suspect is Venkatesh (39, Male). Arrested today by Hebbal Police   |
|  Dashboard |  under Section 325 BNS. Currently held in Judicial Custody."                     |
|  AI Chat   |                                                                                  |
|  Map       |  Evidence Trails:                                                                |
|  Network   |  - Hebbal PS Case File #344/2026 (Judicial Custody Ledger)                       |
|  Analytics |  - Accused Master ID: A_COW_001 | Arrest ID: AS_COW_001                          |
|            |  ------------------------------------------------------------------------------  |
|            |  [Language: en-IN / kn-IN]              [🎙️ Click to Speak (en-IN / kn-IN)]      |
+------------+----------------------------------------------------------------------------------+
```

---

## 🕸️ 3. Criminal Linkages Network Canvas Wireframe

This graphical visualizer maps suspect associations, bank accounts, and transaction streams on an SVG canvas.

```text
+-----------------------------------------------------------------------------------------------+
| 👮 KSP DRISTI - ACCOMPLICE & BANK NETWORK GRAPH                                               |
+------------+----------------------------------------------------------+-----------------------+
|  [NAV]     |                                                          |  [NODE INSPECTOR] (X) |
|            |              (Suspect_1) --- Accomplice --- (Suspect_2)  |                       |
|  Dashboard |                   \                             /        |  • Name: Kiran Kumar  |
|  AI Chat   |                    \                           /         |  • Account: SBI Mule  |
|  Map       |               (SBI Mule Account) ---- (HDFC Mule Account)|  • Traced: Rs. 1.25L  |
|  Network   |                       |                         |        |  • Severity: High     |
|  Analytics |                       +--- Rs. 1.25 Lakhs ----->+        |  • Connections: 3     |
+------------+----------------------------------------------------------+-----------------------+
```

---

## 📊 4. Offender Profiling & Recidivism Gauge Wireframe

The analytical pane evaluates historical arrests, crime groups, and profiles target demographics.

```text
+-----------------------------------------------------------------------------------------------+
| 👮 KSP DRISTI - OFFENDER PROFILE & RISK EVALUATION                                            |
+------------+----------------------------------------------------------+-----------------------+
|  [NAV]     |           [RECIDIVISM RISK GAUGE]                        |  [ARREST TIMELINE]    |
|            |                      ________                            |                       |
|  Dashboard |                   /   75%    \                           |  - 2026-07-26:        |
|  AI Chat   |                  |  HIGH RISK |                          |    Hebbal PS (BNS 325)|
|  Map       |                   \__________/                           |  - 2025-11-12:        |
|  Network   |                                                          |    Kolar PS (Theft)   |
|  Analytics |  Sociological Insights: Vokkaliga (OBC)                  |  - 2024-03-05:        |
|  Reports   |  Age: 39, Occupation: Daily Wage Driver                  |    Amengad (NDPS)     |
+------------+----------------------------------------------------------+-----------------------+
```

---

## 📱 5. Flutter Mobile App Wireframe (3-Tab Layout)

The companion mobile app is configured as a compact utility containing beat paths, speech recording interfaces, and offender profiling.

```text
+----------------------------+
| 👮 KSP DRISTI COMPANION    |
+----------------------------+
| [📍 Map]   [🎙️ Voice]  [👤 Profile]
|                            |
|        [ OFFICER GPS ]     |
|              o             |
|              |             |
|              | (Beat Route)|
|              |             |
|              v             |
|                            |
| Active Dispatch: Route #4  |
| Patrol Station: Hebbal PS  |
+----------------------------+
```
