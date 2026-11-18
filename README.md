# JobPilot 🧭

> **Every opportunity, every application, every interview — organized across your phone and desktop.**  
> A fast, privacy-respecting, offline-first application ecosystem to manage your entire job search journey without scattered spreadsheets, bloated SaaS subscriptions, or cloud dependencies.

[![Android App](https://img.shields.io/badge/Platform-Android-3DDC84?logo=android&logoColor=white)](https://github.com/Helix-looper/Application-management-app)
[![Desktop Web Companion](https://img.shields.io/badge/Platform-Desktop%20Web-646CFF?logo=vite&logoColor=white)](https://github.com/Helix-looper/Application-management-app)
[![React Native](https://img.shields.io/badge/React%20Native-0.88-61DAFB?logo=react&logoColor=black)](https://reactnative.dev)
[![Expo SDK 58](https://img.shields.io/badge/Expo%20SDK-58-black?logo=expo&logoColor=white)](https://expo.dev)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![SQLite](https://img.shields.io/badge/Database-Expo%20SQLite-003B57?logo=sqlite&logoColor=white)](https://docs.expo.dev/versions/latest/sdk/sqlite/)
[![Offline First](https://img.shields.io/badge/Architecture-100%25%20Offline--First-54745D)](https://github.com/Helix-looper/Application-management-app)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 📖 About JobPilot

Job search workflows are notoriously fragmented. Candidates juggle spreadsheets, job boards, email chains, bookmarks, and calendar invites across multiple disconnected apps. Most existing job tracking tools are bloated SaaS wrappers that require account registration, upload your private resumes to third-party cloud databases, and charge recurring monthly subscriptions.

**JobPilot is engineered differently:**
- **Zero Cloud, 100% Offline & Private**: There is no remote backend, no telemetry, and no forced account registration. All application details, notes, interview records, and documents remain strictly on your local devices.
- **Unified Mobile & Desktop Ecosystem**: Search and batch-import opportunities rapidly on your computer, then seamlessly sync them to your Android phone over your local Wi-Fi network using a single QR code scan.
- **Calm, High-Information UX**: Designed with a mature, warm-neutral aesthetic inspired by tools like Things and Linear — free of SaaS gradients, neon badges, and AI fluff.
- **Native Speed**: The Android application is powered by React Native (New Architecture & Hermes bytecode) and an indexed SQLite database; the Desktop Companion runs on Vite, React, and browser-native IndexedDB.

---

## 📱 1. Android Mobile Application

The primary daily driver for tracking your opportunities on the go.

- **📊 Centralized Dashboard**: Time-based greeting, dynamic metric counters (Total, Active, Interviews, Offers, Rejections), visual application pipeline distribution bar, and upcoming interview countdowns.
- **🗂️ Dual-View Application Management**: Toggle between a dense **List View** and an interactive multi-stage **Kanban Board** (`Saved` → `Applied` → `Assessment` → `Interview` → `Offer` → `Rejected` → `Withdrawn`).
- **🏢 Company Directory**: Automatically logs company profiles, websites, industry tags, and aggregates all applications submitted to that organization.
- **🎙️ Multi-Round Interview Tracker**: Schedule rounds (Screening, Technical, System Design, Behavioral, Executive) with meeting links (Google Meet, Zoom, Teams) and retrospective debrief notes.
- **📅 Interactive Calendar & Agenda**: Full monthly calendar grid with color-coded dots for application deadlines and interview dates with day-by-day agenda breakdown.
- **⏰ Reminders & Follow-Up Tasks**: Dedicated task manager for recruiter check-ins, assessment deadlines, and prep milestones with +1 day snooze actions.
- **📄 Sandboxed Resume Vault**: Store versioned resume PDFs securely in Android's private app sandbox, link specific versions to individual job postings, and share via the native Android Share Sheet.
- **📈 Conversion Funnel Analytics**: Visual conversion metrics measuring progress through Application → Interview → Offer, interview invitation rates, and application source breakdown.
- **📷 Camera QR Code Scanner**: Built-in camera scanner with custom animated viewfinder overlay for instant zero-click pairing with the desktop companion.

---

## 💻 2. Desktop Web Companion

Engineered specifically for heavy desktop work sessions where you apply to dozens of jobs across LinkedIn, Naukri, Indeed, or career portals.

- **⚡ Quick Add with Deterministic Parser**:
  - Paste an entire job description into the large workspace.
  - Instantly extracts **Job Title**, **Company**, **Location**, **Work Arrangement** (Remote / Hybrid / On-site), **Employment Type**, **Salary Range**, **Required Tech Skills**, **Experience Level**, and **Application Source** without external AI APIs or cloud costs.
  - Review and edit extracted details in real time before saving.
- **📑 Bulk CSV / Spreadsheet Importer**:
  - Import existing job search spreadsheets.
  - Flexible column mapping with real-time data preview, duplicate detection, and import summary. Includes downloadable CSV template.
- **📋 High-Density Application Table**:
  - Spreadsheet-style table with sortable columns, full-text search, multi-status filters, and column toggling.
  - Bulk actions: update status for multiple applications at once or batch-delete with safety confirmation.
- **🏢 Company Management**:
  - Split list-detail interface displaying registered companies and associated opportunities.
- **💾 Browser-Native IndexedDB Storage**:
  - Full local persistence inside your browser without needing an external database server.
- **🌗 Light & Dark Theme Parity**:
  - Matches the exact JobPilot warm-neutral visual identity (`#F7F7F2` / `#191D1A` with forest green accents).

---

## 🔄 3. Seamless Cross-Device Synchronization

JobPilot bridges desktop productivity and mobile convenience **without uploading your data to any cloud service**.

```
┌─────────────────────────────────┐                 ┌─────────────────────────────────┐
│     Desktop Web Companion       │                 │       JobPilot Android App      │
│  (Vite + React + IndexedDB)     │                 │   (React Native + Expo SQLite)  │
│                                 │                 │                                 │
│  • Quick Add & JD Parser        │   Local Wi-Fi   │  • Daily Application Tracking   │
│  • Bulk CSV Importer            │  ─────────────► │  • Interview Alarms & Calendar  │
│  • Embedded Sync Server         │   QR Scan / PIN │  • Sandboxed Resume Vault       │
│  • Generates Dynamic QR Code    │                 │  • Built-in Camera QR Scanner   │
└─────────────────────────────────┘                 └─────────────────────────────────┘
```

### Two Synchronization Modes:

1. **⚡ Wi-Fi Direct Sync (Live Auto-Pairing)**:
   - Start the web companion (`npm run dev`). It automatically starts the sync bridge on your local network.
   - Open **Wi-Fi Sync** on desktop to see your dynamic QR code and 4-digit pairing PIN.
   - In the Android app, go to **Settings $\rightarrow$ Desktop Companion $\rightarrow$ Scan Desktop QR Code**.
   - Point your phone camera at the screen: JobPilot pairs instantly and performs a transactional `INSERT OR REPLACE` into your phone's SQLite database.
2. **📁 Portable JSON Backup File Transfer**:
   - Both Android and Desktop share the identical **`BackupData v1` schema**.
   - Export a timestamped `.json` backup file from either device and import it on the other anytime — perfect for offline transfers, email, or USB storage.

---

## 🛠️ Architecture & Tech Stack

```
JobPilot/
├── app/                        # Android App (Expo Router Screens)
│   ├── (tabs)/                 # Bottom Tabs: Home, Applications, Calendar, Companies, Settings
│   ├── applications/           # Details, Creation, and Edit Screens
│   ├── companies/              # Company Profiles and Creation
│   ├── interviews/             # Scheduler and Debrief Screens
│   ├── reminders/              # Follow-up and Task Manager
│   ├── resumes/                # Document and Resume Vault
│   ├── sync.tsx                # Wi-Fi Direct Sync & Camera QR Code Scanner
│   └── analytics.tsx           # Conversion Funnel Analytics Screen
├── src/                        # Android Shared Modules
│   ├── database/               # Expo SQLite Migrations (8 Relational Tables) & Repositories
│   ├── services/               # Desktop Sync Client & Notifications
│   ├── store/                  # Zustand Reactivity Store
│   └── theme/                  # Warm-Neutral Light & Dark Theme Tokens
├── web/                        # Desktop Web Companion
│   ├── src/
│   │   ├── pages/              # Dashboard, Applications, QuickAdd, Companies, Sync, ImportExport, Settings
│   │   ├── lib/                # IndexedDB Engine, Deterministic JD Parser, Helpers
│   │   └── components/         # High-density Desktop UI Elements
│   ├── sync-server.js          # Standalone / Embedded Node.js Sync Bridge
│   └── vite.config.ts          # Vite Configuration with Embedded Sync Server Middleware
└── JobPilot-release.apk        # Ready-to-Install Production Release Android APK
```

| Component | Android Mobile App | Desktop Web Companion |
| :--- | :--- | :--- |
| **Framework** | React Native 0.88 (Expo SDK 58) | React 19 + Vite 6 |
| **Routing** | Expo Router (File-based navigation) | React Router DOM v7 |
| **Language** | TypeScript (Strict Mode) | TypeScript (Strict Mode) |
| **Storage** | Expo SQLite (Embedded SQL) | Browser IndexedDB |
| **Styling** | React Native StyleSheet (Design Tokens) | Tailwind CSS v4 + CSS Variables |
| **Camera & QR** | `expo-camera` (`CameraView`) | `qrcode.react` (SVG) |
| **Sync Protocol** | Local HTTP REST (`fetch`) with PIN Auth | Node.js HTTP Sync Bridge / Vite Middleware |
| **Currency** | INR (`₹`) default + Multi-Currency (USD, EUR, GBP) | INR (`₹`) default + Multi-Currency (USD, EUR, GBP) |

---

## 🚀 Quick Start Guide

### Running the Desktop Web Companion
```bash
cd "web"
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

### Installing & Running the Android App

#### Option A: Install Pre-Built Production APK
The optimized release APK is compiled and ready in the repository root:
1. Transfer **[`JobPilot-release.apk`](JobPilot-release.apk)** to your Android phone.
2. Tap the file on your device to install / update the app.

#### Option B: Run in Development Mode
```bash
npm install
npx expo start
```
Press `a` in the terminal to launch on an Android Emulator or connected physical device running Expo Go / Development Build.

#### Option C: Build Standalone APK Locally
```bash
cd android
./gradlew assembleRelease
```
The compiled APK will be generated at `android/app/build/outputs/apk/release/app-release.apk`.

---

## 🔒 Privacy Guarantee

- **No Remote Servers**: JobPilot does not connect to any external cloud, tracking service, or telemetry endpoint.
- **Zero Account Registration**: No email sign-up, no passwords, no OAuth.
- **Local Network Only**: Cross-device sync occurs strictly over your private local Wi-Fi network between your two devices.
- **Open Standards**: Export all your data at any time in plain, human-readable JSON.

---

## 📄 License

This project is open-source under the [MIT License](LICENSE).
