# JobPilot 🧭

> **Every opportunity, every application, every interview — organized in one place.**  
> A fast, privacy-respecting, offline-first Android application to manage your entire job search journey without scattered spreadsheets, bloated SaaS tools, or cloud dependencies.

[![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?logo=react&logoColor=black)](https://reactnative.dev)
[![Expo SDK 58](https://img.shields.io/badge/Expo%20SDK-58-black?logo=expo&logoColor=white)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![SQLite](https://img.shields.io/badge/Database-Expo%20SQLite-003B57?logo=sqlite&logoColor=white)](https://docs.expo.dev/versions/latest/sdk/sqlite/)
[![Offline First](https://img.shields.io/badge/Architecture-100%25%20Offline--First-54745D)](https://github.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 📖 About JobPilot

Job search workflows are notoriously fragmented. Candidates juggle spreadsheets, email chains, bookmarks, notes, and calendar notifications across multiple disconnected apps. Most existing job tracking tools are bloated SaaS web-wrappers that require account registration, upload your private resumes to third-party cloud servers, and charge subscriptions.

**JobPilot** is built differently:
- **100% Offline & Private**: There is no backend, no telemetry, and no forced account registration. All application details, notes, interview records, and documents remain strictly on your device.
- **Calm, High-Information UX**: Designed with a mature, warm-neutral aesthetic inspired by tools like Things and Linear — free of SaaS gradients, neon badges, and AI clutter.
- **Native Android Speed**: Powered by React Native (New Architecture / Hermes bytecode), Expo Router, and a normalized Expo SQLite database with indexed queries.

---

## ✨ Features

### 1. 📊 Centralized Dashboard
- Dynamic time-based greeting and high-level metric counters (Total, Active, Interviews, Offers, Rejections).
- Visual horizontal application pipeline distribution bar.
- Upcoming interview cards with countdown badges and direct meeting links.
- Overdue and upcoming follow-up tasks with one-tap completion.
- Recent application audit feed.

### 2. 🗂️ Application Management
- **Dual View Modes**: Switch between a compact **List View** and a multi-column **Kanban Board** with one tap.
- **Full Lifecycle Statuses**: `Saved` → `Applied` → `Assessment` → `Interview` → `Offer` → `Rejected` → `Withdrawn`.
- **Instant Search & Multi-Filters**: Filter by status, location type (Remote, Hybrid, On-site), work type (Full-time, Contract, Internship), and sort by date or company.
- **Rich Opportunity Profiles**: Job description, salary range, application URL, referral contacts, interview stages, and an automatic chronological status change history log.

### 3. 🏢 Company Directory
- Automatic company profile creation linked with every application.
- Company initials avatar, website URL, industry, glassdoor ratings, and quick notes.
- Complete breakdown of all historical and active applications submitted to each company.

### 4. 🎙️ Multi-Round Interview Tracker
- Schedule interviews across multiple stages: Screening, Technical, System Design, Behavioral, Manager, Executive, or HR.
- Meeting type flags (Google Meet, Zoom, Teams, Phone, In-person) with clickable URLs.
- Retrospective prep notes and post-interview debrief logs.
- Automatic scheduled local device notifications 30 minutes before each interview.

### 5. 📅 Interactive Calendar & Agenda
- Full monthly calendar grid with color-coded dots for application deadlines and interview dates.
- Interactive day-by-day agenda view showing scheduled interviews and pending action items.

### 6. ⏰ Reminders & Follow-Up Tasks
- Dedicated task tracker for recruiter follow-ups, assessment deadlines, and prep milestones.
- Quick `+1 Day` snooze buttons and instant completion toggles.

### 7. 📄 Resume & Document Vault
- Local document picker integrating with Android's system storage.
- Files are securely copied into the app's private sandbox storage (`FileSystem.documentDirectory`).
- Track resume versions (e.g., `Frontend_Resume_v2.pdf`, `FullStack_2026.pdf`) linked to individual job applications.
- Preview, rename, delete, and share resumes via native Android Share Sheet.

### 8. 📈 Analytics & Funnel Insights
- Visual conversion funnel measuring progress through Application → Interview → Offer.
- Offer conversion rate, interview invitation rate, and rejection percentage.
- Application sources breakdown (LinkedIn, Indeed, Referrals, Company site, etc.).
- 5 configurable timeframe filters: `7 Days`, `30 Days`, `90 Days`, `1 Year`, and `All Time`.

### 9. 💾 True Data Ownership (JSON Backup & Restore)
- One-tap export of your entire database (applications, companies, interviews, notes, reminders, history) into a portable, versioned JSON backup file.
- Native Android Share Sheet integration to store backups on Google Drive, USB storage, or send to another device.
- Validated backup restoration with integrity checks.
- Nuclear data wipe option protected by confirmation modals.

### 10. 🎨 Warm-Neutral Design & Themes
- Built from the ground up for both **Light Mode** (warm paper-white `#F7F7F2` with forest-green accents `#54745D`) and **Dark Mode** (charcoal `#191D1A` with sage accents `#94B39A`).
- Accessible typography scale, comfortable 4dp spacing grid, and native haptic feedback.

---

## 🛠️ Tech Stack & Architecture

```
JobPilot/
├── app/                        # Expo Router file-based screens
│   ├── (tabs)/                 # Bottom tab bar (Home, Applications, Calendar, Companies, Settings)
│   ├── applications/           # Details, creation, and edit screens
│   ├── companies/              # Company profiles and creation
│   ├── interviews/             # Interview scheduler and debrief screens
│   ├── reminders/              # Follow-up and task manager
│   ├── resumes/                # Document and resume vault
│   ├── analytics.tsx           # Conversion analytics screen
│   ├── onboarding.tsx          # 2-step first-launch onboarding
│   └── _layout.tsx             # Root layout (SQLite, ThemeProvider, Notifications)
├── src/
│   ├── components/common/      # Atomic UI components (Button, Card, Badges, SearchBar, Modals)
│   ├── database/               # Expo SQLite configuration
│   │   ├── migrations/         # DDL migration scripts (8 relational tables + indexes)
│   │   └── repositories/       # Type-safe query repositories (Application, Company, Interview, etc.)
│   ├── services/               # Expo Notifications & FileSystem management
│   ├── store/                  # Zustand UI state & reactivity triggers
│   ├── theme/                  # Light & Dark color tokens and typography
│   └── types/                  # Strict TypeScript domain interfaces
```

| Layer | Technology |
| :--- | :--- |
| **Framework** | React Native (0.81+) with Expo SDK 58 |
| **Routing** | Expo Router (v58 file-based navigation) |
| **Language** | TypeScript (Strict mode enabled) |
| **Database** | Expo SQLite (local SQLite with SQL migrations & foreign keys) |
| **State Management** | Zustand (transient UI state & cross-screen triggers) |
| **Notifications** | `expo-notifications` (scheduled local Android notifications) |
| **File Storage** | `expo-file-system/legacy` & `expo-document-picker` |
| **Icons** | `lucide-react-native` |
| **Dates** | `dayjs` |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Android Studio](https://developer.android.com/studio) with Android SDK (API 34+ and Build Tools 35+)
- [Expo CLI](https://docs.expo.dev/more/expo-cli/) (`npx expo`)

### 1. Clone & Install
```bash
git clone https://github.com/your-username/jobpilot.git
cd jobpilot
npm install
```

### 2. Run the Development Server
```bash
npx expo start
```
- Press `a` in the terminal to launch the app on an Android Emulator or connected physical device running Expo Go / Development Build.

### 3. Build Standalone APK Locally
To compile an optimized, standalone Production Release APK directly on your machine:
```bash
cd android
./gradlew assembleRelease
```
The output APK will be generated at:
```
android/app/build/outputs/apk/release/app-release.apk
```

---

## 🔒 Privacy & Security

- **No Network Requests**: JobPilot never connects to external servers, APIs, or cloud analytics.
- **Zero Third-Party Trackers**: No ads, no analytics SDKs, no behavioral tracking.
- **Sandboxed Storage**: Resumes and documents are stored strictly within Android's private app sandbox.
- **Your Data Stays Yours**: Back up your database at any time as JSON and restore it whenever you switch devices.

---

## 📄 License

This project is open-source under the [MIT License](LICENSE).
